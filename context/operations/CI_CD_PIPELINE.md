---
type: operations-doc
module: operations
tags: [operations, ci-cd, infrastructure]
date: 2026-03-10
---

# CI/CD Pipeline — GitHub Actions

> **Status:** Planned (not yet implemented)
> **Current workflow:** Manual SSH → git pull → deploy scripts (see [[operations/DEPLOYMENT]])

## Overview

This document specifies the CI/CD automation plan for Breyus using **GitHub Actions**. The pipeline replaces the manual SSH deployment workflow with automated checks on PRs and one-click deploys on merge.

**What changes:**
- PRs get automatic lint/build validation before merge
- Merging to `main` triggers automatic deployment to production
- Rollbacks are a single button-click with audit trail

**What stays the same:**
- Single VPS architecture (DigitalOcean Singapore)
- Docker Compose orchestration on the server
- `.env` secrets stay on the server (never in GitHub)

---

## Architecture

```
Developer  →  GitHub PR  →  CI Checks (lint/build)
                                    ↓ (pass)
                              Merge to main
                                    ↓
                          GitHub Actions Deploy
                                    ↓
                          SSH into VPS (deploy user)
                                    ↓
                          git pull → selective docker compose build → restart
                                    ↓
                          Health checks (Docker + HTTP)
                                    ↓
                          Tag deploy commit (deploy-YYYY-MM-DD-<sha>)
```

---

## GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Value | Notes |
|--------|-------|-------|
| `DEPLOY_SSH_KEY` | Ed25519 private key for `deploy` user | Generate with `ssh-keygen -t ed25519` |
| `DEPLOY_HOST` | VPS IP address or hostname | e.g., `143.198.xxx.xxx` |
| `DEPLOY_USER` | `deploy` | Non-root user (see [[operations/SERVER_SETUP#Phase 2.5]]) |
| `DEPLOY_PORT` | `22` | Change if SSH port is non-standard |
| `DEPLOY_PATH` | `/opt/app` | Application root on the server |

**Important:** Application secrets (`JWT_SECRET_KEY`, `MONGODB_URI`, etc.) stay in the server's `.env` file. They are **never** stored in GitHub Secrets.

---

## Workflow 1: CI (`ci.yml`)

**Trigger:** Pull requests targeting `main`
**Purpose:** Validate code before merge — fast feedback, no deployment

### Selective Checks

Uses `dorny/paths-filter` to only run checks for changed services:

| Path Pattern | Check Triggered |
|--------------|-----------------|
| `backend/**` | Backend lint + build |
| `frontend/**` | Frontend lint + build |
| `admin-portal/**` | Admin portal lint + build |
| `AI_NEW/**` | Python lint (ruff/flake8) |
| `docker-compose.yml`, `nginx/**` | Config validation |

### Steps per Service

**Backend (NestJS):**
1. `npm ci`
2. `npm run lint`
3. `npm run build`

**Frontend (React/CRA):**
1. `npm ci`
2. `npm run build` (catches TypeScript errors)

**Admin Portal (Vite):**
1. `npm ci`
2. `npm run build`

**AI Server (Python):**
1. `pip install -r requirements.txt`
2. `ruff check .` or `flake8`

### Container Image Scanning

Add a security scan step to CI for Docker images:

```yaml
# In CI workflow, after build steps:
security-scan:
  runs-on: ubuntu-latest
  needs: [backend-check, ai-check]  # Only after builds pass
  steps:
    - uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        severity: 'CRITICAL,HIGH'
        exit-code: '1'  # Fail CI on critical/high CVEs
```

This catches known vulnerabilities in dependencies before they reach production.

### Design Notes

- Each service check runs in a **separate job** for parallelism
- Jobs only run when their paths are changed (saves CI minutes)
- No database or Docker required — pure build validation
- Target: <3 minutes total for a typical single-service PR
- Security scan runs after build validation for early CVE detection

---

## Workflow 2: Deploy (`deploy.yml`)

**Triggers:**
1. **Automatic:** Push to `main` (i.e., PR merge)
2. **Manual:** `workflow_dispatch` with inputs for service selection and branch/tag

### Manual Dispatch Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `services` | choice | `auto` | Which services to deploy (`auto`, `all`, `backend`, `frontend`, `admin`, `ai`) |
| `ref` | string | `main` | Branch, tag, or SHA to deploy |

### Selective Deployment Logic

When `services` is `auto`, the workflow uses `git diff` to determine what changed:

| Changed Path | Services Rebuilt | Containers Restarted |
|--------------|------------------|----------------------|
| `backend/**` | `breyus_backend` | `breyus_backend` |
| `frontend/**` | `breyus_frontend` | `breyus_frontend`, `breyus_nginx` |
| `admin-portal/**` | `breyus_admin_portal` | `breyus_admin_portal`, `breyus_nginx` |
| `AI_NEW/**` | `breyus_ai_service` | `breyus_ai_service` |
| `docker-compose.yml` | All | All |
| `nginx/**` | None (config only) | `breyus_nginx` |

### Deploy Steps

1. **SSH into VPS** using `appleboy/ssh-action`
2. `cd /opt/app && git fetch origin && git checkout <ref>`
3. Determine changed services (via `git diff` against previous deploy tag)
4. **Run database migrations** (if backend or AI changed):
   ```bash
   # NestJS seed/migration scripts (if any new seeds exist)
   docker compose exec backend node dist/seeds/<migration-script>.js
   # PostgreSQL schema migrations (if AI_NEW/shared/db/schema.sql changed)
   docker compose exec postgres psql -U "$POSTGRES_USER" -d breyus_ai -f /app/shared/db/schema.sql
   ```
5. Build only changed services: `docker compose build <service>`
6. Restart changed services: `docker compose up -d <service>`
7. Run health checks (see below)
8. Tag the deploy: `git tag deploy-YYYY-MM-DD-<short-sha>`
9. Push tag to origin
10. **Send deploy notification** (success or failure)

### Why `appleboy/ssh-action`?

- Mature, well-maintained GitHub Action for SSH execution
- Supports Ed25519 keys, custom ports, proxy jumps
- No self-hosted runner overhead — uses GitHub-hosted runners
- The VPS already has Docker — no need for remote Docker builds

---

## Workflow 3: Rollback (`rollback.yml`)

**Trigger:** Manual only (`workflow_dispatch`)

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | string | Yes | Deploy tag (e.g., `deploy-2026-03-10-abc1234`) or commit SHA |
| `services` | choice | No | Which services to rollback (`all`, specific service) |

### Rollback Steps

1. SSH into VPS
2. `cd /opt/app && git fetch --tags`
3. `git checkout <target>`
4. `docker compose build <services>`
5. `docker compose up -d <services>`
6. Run health checks
7. Tag: `git tag rollback-YYYY-MM-DD-<short-sha>`
8. Push tag for audit trail

### Finding Available Deploy Tags

```bash
# List recent deploy tags
git tag -l 'deploy-*' --sort=-creatordate | head -10
```

---

## Health Check Strategy

Two-layer verification after every deploy/rollback:

### Layer 1: Docker Container Status

```bash
# Verify all expected containers are running
for container in breyus_nginx breyus_backend breyus_ai_service breyus_mongo breyus_postgres breyus_redis breyus_frontend breyus_admin_portal; do
  status=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null)
  if [ "$status" != "running" ]; then
    echo "FAIL: $container is $status"
    exit 1
  fi
done
```

### Layer 2: HTTP Endpoint Checks

| Endpoint | Expected | Timeout |
|----------|----------|---------|
| `http://localhost:3001/health` | 200 OK | 10s |
| `http://localhost:8000/health` | 200 OK | 15s |
| `http://localhost:80` (frontend via nginx) | 200 OK | 5s |

### Layer 3: Database Connectivity Checks

> **Why?** HTTP 200 from `/health` doesn't guarantee database connectivity. A backend with a broken DB connection will return 200 but fail on the first real request.

```bash
# MongoDB connectivity
docker exec breyus_mongo mongosh --eval "db.adminCommand('ping')" --quiet

# PostgreSQL connectivity
docker exec breyus_postgres pg_isready -U postgres -d breyus_ai

# Redis connectivity
docker exec breyus_redis redis-cli ping
```

**Recommendation:** Enhance the `/health` endpoints to include DB connection checks and return a structured response:
```json
{ "status": "ok", "mongo": "connected", "redis": "connected" }
```

```bash
# Check HTTP endpoints with retries
for url in "http://localhost:3001/health" "http://localhost:8000/health" "http://localhost:80"; do
  for i in 1 2 3; do
    if curl -sf --max-time 10 "$url" > /dev/null; then
      break
    fi
    sleep 5
  done
done
```

### Failure Behavior

If health checks fail after deploy:
1. Workflow marks as **failed** (red status in GitHub)
2. Containers stay in current state (no auto-rollback — deliberate choice)
3. Engineer uses Rollback workflow to revert, or investigates via SSH

**Why no auto-rollback?** Auto-rollback can mask root causes and create confusion about what's actually running. A manual rollback with the Rollback workflow takes <30 seconds and provides a clear audit trail.

---

## Deploy Notifications

Add a notification step at the end of the deploy workflow to alert the team:

```yaml
# At the end of the deploy job:
- name: Notify deploy result
  if: always()  # Run on success AND failure
  run: |
    STATUS=${{ job.status }}
    SHA=$(git rev-parse --short HEAD)
    MSG="🚀 Breyus deploy $STATUS — $SHA on $(date -u +%Y-%m-%d)"
    # Option 1: Slack webhook
    # curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$MSG\"}" $SLACK_WEBHOOK_URL
    # Option 2: Email via GitHub notification (automatic for failed workflows)
    echo "$MSG"
```

---

## Concurrency Control

```yaml
concurrency:
  group: deploy-production
  cancel-in-progress: false
```

- Only one deploy can run at a time
- New deploys **queue** rather than cancel in-progress ones (data safety)
- This prevents race conditions from rapid merges

---

## Security Considerations

### Deploy User (Non-Root)

The `deploy` user has minimal permissions:
- Member of `docker` group (can run Docker commands)
- Owns `/opt/app` (can git pull and build)
- **Cannot** sudo or access other system resources
- Setup instructions: [[operations/SERVER_SETUP#Phase 2.5: Deploy User Setup]]

### Secrets Separation

| Where | What | Why |
|-------|------|-----|
| GitHub Secrets | SSH key, host, user, port, path | Only deployment credentials |
| Server `.env` | App secrets (JWT, DB, API keys) | Never leaves the server |

This means a GitHub Secrets breach gives SSH access but **not** application secrets (which require server filesystem access).

### SSH Key Requirements

- **Algorithm:** Ed25519 (preferred) or RSA 4096
- **Passphrase:** None (GitHub Actions can't enter passphrases interactively)
- **Scope:** Key is added only to the `deploy` user's `authorized_keys`
- **Rotation:** Rotate annually or after team member departures

---

## Container Reference

All container names from `docker-compose.yml`:

| Container Name | Service | Port | Health Check |
|----------------|---------|------|--------------|
| `breyus_nginx` | Nginx gateway | 80, 443 | `nginx -t` |
| `breyus_backend` | NestJS API | 3001 | `curl /health` |
| `breyus_ai_service` | FastAPI AI | 8000 | Python urllib |
| `breyus_mongo` | MongoDB | 27017 | `mongosh ping` |
| `breyus_postgres` | PostgreSQL + pgvector | 5432 | `pg_isready` |
| `breyus_redis` | Redis | 6379 | `redis-cli ping` |
| `breyus_frontend` | React SPA (nginx) | 80 (internal) | `curl /health` |
| `breyus_admin_portal` | Admin SPA (nginx) | 80 (internal) | `curl /health` |

---

## Future: Staging Environment

When a second VPS is added for staging:

1. **GitHub Environments:** Create `staging` and `production` environments
2. **Environment secrets:** Separate `DEPLOY_HOST` per environment
3. **Branch strategy:** `development` → staging, `main` → production
4. **Protection rules:** Require approval for production deploys
5. **Workflow change:** Add environment selection input to deploy workflow

This is a design note — no staging VPS exists yet.

---

## Deployment Tag Convention

| Tag Pattern | Meaning | Created By |
|-------------|---------|------------|
| `deploy-YYYY-MM-DD-<sha7>` | Successful deployment | Deploy workflow |
| `rollback-YYYY-MM-DD-<sha7>` | Rollback to previous state | Rollback workflow |

Tags provide a complete audit trail of what was deployed and when. Use `git log --oneline deploy-2026-03-10-abc1234..HEAD` to see changes since a specific deploy.

---

## Related

- [[operations/DEPLOYMENT]] — Current manual deployment workflow
- [[operations/SERVER_SETUP]] — Server provisioning (includes deploy user setup)
- [[operations/BACKUP_AND_RECOVERY]] — Database backup strategy
- [[MOC-Operations]]
