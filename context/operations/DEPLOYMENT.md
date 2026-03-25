---
type: operations-doc
module: operations
tags: [operations, deployment]
---

# Breyus Deployment Architecture & Flow

This document outlines the agreed-upon architecture, explaining how code flows from your computer to the users, where files live, and how services communicate.

## Infrastructure Overview

| Component | Provider | Location | Monthly Cost |
|-----------|----------|----------|--------------|
| **VPS** | DigitalOcean Droplet | Singapore | $112 |
| **Object Storage** | DigitalOcean Spaces | Singapore | $5 |
| **Total** | | | **$117** |

## 1. High-Level Topology

```mermaid
graph TD
    User((User Browser<br/>India/South Asia))
    Admin((Admin Browser))

    subgraph "DigitalOcean Singapore (Docker Host)"
        subgraph "Public Interface"
            Nginx[Nginx Gateway<br/>(SSL Termination + Static UI)]
        end

        Frontend[Frontend Static Build<br/>(React/CRA)<br/>breyus.com]
        AdminPortal[Admin Portal Static Build<br/>(React/Vite)<br/>admin.breyus.com]

        subgraph "Private Docker Network"
            Backend[Backend API<br/>(NestJS)]
            AI[AI Service<br/>(Python/FastAPI)]
            Postgres[(Postgres<br/>AI DB)]
            Mongo[(MongoDB<br/>Main DB)]
            Redis[(Redis<br/>Cache)]
        end
    end

    subgraph "DigitalOcean Spaces (S3-Compatible)"
        Spaces[breyus-files<br/>/uploads/ /backups/ /ai-data/]
    end

    User -->|HTTPS ~50-80ms| Nginx
    Admin -->|HTTPS| Nginx
    Nginx -->|Serves UI| Frontend
    Nginx -->|Serves Admin UI| AdminPortal
    User -->|HTTPS /api| Nginx
    Admin -->|HTTPS /api| Nginx
    Nginx -->|HTTP :3001| Backend
    Backend -->|HTTP :8000| AI
    Backend -->|TCP| Mongo
    Backend -->|TCP| Redis
    AI -->|TCP| Postgres
    AI -->|S3 API| Spaces
    Backend -->|S3 API| Spaces
```

---

## 2. Directory & Repo Structure

We treat your project as a **Monorepo**. The root folder `Breyus/` contains everything.

```text
Breyus/
├── frontend/             # Built on VPS; static build served by Nginx (breyus.com)
│   └── package.json
├── admin-portal/         # Admin Portal - Built on VPS (admin.breyus.com)
│   ├── package.json      # Vite + React + shadcn/ui
│   └── src/
├── backend/              # Dockerized Node.js app
│   ├── Dockerfile        # Instructions to build Backend
│   └── src/
├── AI_NEW/               # Dockerized Python app
│   ├── Dockerfile        # Instructions to build AI
│   └── pipeline/
├── nginx/                # Gateway Config
│   └── nginx.conf        # Rules for routing traffic (frontend + admin + api)
├── scripts/              # Deployment/ops scripts (per-service)
├── docker-compose.yml      # THE MASTER PLAN (single compose file for all environments)
└── .env                  # Production config on server (not committed)
```

---

## 3. The "Docker Flow" (Service by Service)

### A. The Frontend (Static Build)
-   **Role**: React SPA served by Nginx at `https://breyus.com`.
-   **Build Process (on VPS)**:
    1.  Run `npm ci` in `frontend/`.
    2.  Run `npm run build` to generate `frontend/build`.
-   **Runtime**: Nginx serves `frontend/build` from `/usr/share/nginx/html`.
-   **Environment**: `REACT_APP_BACKEND_URL=https://api.breyus.com` at build time.

### A.1 The Admin Portal (Static Build)
-   **Role**: React SPA for platform administration, served by Nginx at `https://admin.breyus.com`.
-   **Build Process (on VPS)**:
    1.  Run `npm ci` in `admin-portal/`.
    2.  Run `npm run build` to generate `admin-portal/dist`.
-   **Runtime**: Nginx serves `admin/dist` from `/usr/share/nginx/admin`.
-   **Environment**: `VITE_API_URL=https://api.breyus.com` at build time.
-   **Features Provided**:
    - User & Company management (KYC verification, account suspension)
    - Trade oversight and dispute resolution
    - AI pipeline monitoring and database operations
    - System health monitoring, logs viewer, alerts
    - Content management (commodities, Incoterms, countries)
    - GDPR compliance tools (data export, deletion requests)
-   **Tech Stack**: Vite + React + TypeScript + shadcn/ui + TailwindCSS
-   **Access Control**: Admin-only access (role-based authentication)

### B. The Backend
-   **Role**: Main logic, Authentication, WebSocket.
-   **Dockerfile Location**: `backend/Dockerfile`
-   **Build Process**:
    1.  Start with `node:20` image.
    2.  Copy `package.json` & install dependencies.
    3.  Copy source code (`backend/.`).
    4.  Run `npm run build` ==> creates `dist/`.
    5.  Command: `node dist/main`.
-   **Environment**: Needs `MONGODB_URI`, `REDIS_URL`.

### C. The AI Service
-   **Role**: Long-running jobs, Embeddings, Inference.
-   **Dockerfile Location**: `AI_NEW/Dockerfile`
-   **Build Process**:
    1.  Start with `python:3.11-slim` image.
    2.  Install system libs (like `libpq-dev`).
    3.  Install `requirements.txt`.
    4.  Copy source code (`AI_NEW/.`).
    5.  Command: `uvicorn server.main:app`.
-   **Environment**: Needs `POSTGRES_HOST`, `DATABASE_URL`.

### D. The Orchestrator (`docker-compose.yml`)
This file lives at the **Root**. It links everything together. It stops you from running 5 separate `docker run` commands.

**How it looks (simplified):**
```yaml
services:
  # 1. The Gateway
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"] # Open to the world
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/build:/usr/share/nginx/html:ro
      - ./admin-portal/dist:/usr/share/nginx/admin:ro
    depends_on:
      - backend

  # 2. Main API
  backend:
    build: ./backend  # <-- Points to backend folder
    expose: ["3001"]  # Only visible inside Docker network
    environment:
      - MONGODB_URI=mongodb://mongo:27017/breyus # 'mongo' is the service name below
      - AI_SERVICE_URL=http://ai-service:8000    # 'ai-service' is the name below
      # S3/Object Storage credentials (passed from .env)
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_REGION=${S3_REGION}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET=${S3_BUCKET}
      - DOCKER_HOST=tcp://docker-socket-proxy:2375  # Docker API via proxy (no socket mount)
    # No volume mount needed - uses S3 API for file storage
    depends_on:
      - docker-socket-proxy

  # 3. AI Engine
  ai-service:
    build: ./AI_NEW   # <-- Points to AI folder
    expose: ["8000"]
    environment:
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_REGION=${S3_REGION}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET=${S3_BUCKET}
    volumes:
      - ./AI_NEW/raw_data:/app/raw_data # Local folder for processing (temp files)

  # 4. Databases (Pinned Versions — never use :latest in production)
  mongo:
    image: mongo:7.0
  postgres:
    image: postgres:15
  redis:
    image: redis:7-alpine

  # 5. Docker Socket Proxy (Security — filters Docker API access)
  docker-socket-proxy:
    image: tecnativa/docker-socket-proxy
    environment:
      CONTAINERS: 1    # Allow container list/inspect/stats/logs
      POST: 1          # Allow restart/stop/start
      IMAGES: 0        # Block image operations
      EXEC: 0          # Block exec into containers
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Nginx notes:**
- `breyus.com` serves the static build from `/usr/share/nginx/html`.
- `admin.breyus.com` serves the admin portal from `/usr/share/nginx/admin`.
- `api.breyus.com` proxies to `http://backend:3001` with WebSocket upgrades enabled.

---

## 4. How Services "Talk" (Linking)
In Docker Compose, **Service Names are Hostnames**.

1.  **Backend -> MongoDB**:
    -   Inside the backend code/env, you use `mongodb://mongo:27017`.
    -   Docker magic resolves `mongo` to the internal IP of the database container.

2.  **Backend -> AI Service**:
    -   Backend calls `http://ai-service:8000/predict`.
    -   Only the backend needs to reach the AI. The outside world cannot hit the AI service directly (secure!).

3.  **Nginx -> Frontend Static Build**:
    -   Nginx serves `https://breyus.com` from `/usr/share/nginx/html`.
    -   The folder is a bind mount to `frontend/build` on the VPS.

4.  **Nginx -> Admin Portal Static Build**:
    -   Nginx serves `https://admin.breyus.com` from `/usr/share/nginx/admin`.
    -   The folder is a bind mount to `admin/dist` on the VPS.

5.  **Nginx -> Backend**:
    -   Nginx config says: `proxy_pass http://backend:3001;`
    -   When a user hits `api.breyus.com` (or `/api`), Nginx forwards it to the `backend` container.
    -   WebSocket upgrades pass through to Socket.IO namespaces (`/inbox`, `/trade`).

6.  **Backend -> Docker Daemon** (via proxy):
    -   Backend uses `dockerode` (Node.js SDK) to call `http://docker-socket-proxy:2375`.
    -   The Tecnativa proxy filters API requests — only container list/inspect/stats/logs/restart/stop/start are allowed.
    -   The backend container has NO direct Docker socket mount. See [[operations/PRODUCTION_HARDENING#4. Docker Socket Mount (Privilege Escalation)]] for migration details.

---

## 5. detailed Developer Workflow (The Process)

This section describes exactly what you need to do in your day-to-day work.

### A. Local Development (Standard Mode)
Run services locally to build features fast.
1.  **Frontend**: Run `npm start` in `frontend/`. Access at `http://localhost:3000`.
2.  **Backend**: Run `npm run start:dev` in `backend/`. Access at `http://localhost:3001`.
    *   Ensure your local `.env` points to local Mongo/Redis.
3.  **AI Service**: Run `python -m server.main` (or Uvicorn) in `AI_NEW`.
    *   Useful when developing new pipelines.

### B. Deployment Pipeline (releasing to Prod)
When you are ready to ship.

#### Scenario 1: Frontend Changes Only
1.  **Action**: Modify React components/pages.
2.  **Commit**: `git commit -am "Update landing page"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh deploy@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run frontend build script: `./scripts/deploy-frontend.sh`
    *   **Verification**: Load `https://breyus.com` and confirm assets updated.

#### Scenario 1.1: Admin Portal Changes Only
1.  **Action**: Modify admin portal components/pages.
2.  **Commit**: `git commit -am "Update admin dashboard"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh deploy@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run admin build script: `./scripts/deploy-admin.sh`
    *   **Verification**: Load `https://admin.breyus.com` and confirm assets updated.

#### Scenario 2: Backend / AI Changes
1.  **Action**: Modify NestJS logic or Python scripts.
2.  **Commit**: `git commit -am "Fix API logic"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh deploy@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run backend/AI deploy script: `./scripts/deploy-backend.sh`
    *   **Verification**: Check logs with `docker compose logs -f --tail=100 backend`

### C. Managing Secrets (.env)
**Never commit `.env` files to GitHub.**
-   **Local**: Edit `.env` in your project folders.
-   **Production**:
    1.  SSH into server.
    2.  Edit file: `nano /opt/app/.env`
    3.  Update the variable (e.g., `NEW_API_KEY=xyz`).
    4.  Restart containers: `docker compose up -d` (backend deploy scripts do this too).

### D. Required Files Checklist
To make this work, we will create these files in the next step:
1.  `docker-compose.yml`: The map defined in Section 3.
2.  `nginx/nginx.conf`: The rules for the Gateway (frontend, admin, api routing).
3.  `scripts/`: Deployment/ops scripts (frontend, admin, backend, AI, data jobs).
4.  `backend/Dockerfile`: (Already exists, we'll verify it).
5.  `AI_NEW/Dockerfile`: (Already exists, we'll verify it).
6.  `admin/`: Admin portal React app (Vite + shadcn/ui).

## 6. Where the Data Lives (Persistence)

-   **Databases**: We use **Docker Volumes**. Even if you destroy the containers, the volume `mongo_data` and `postgres_data` persist on the server disk (320 GB NVMe SSD).
-   **Files (PDFs/CSVs/Images)**: These live on **DigitalOcean Spaces** (S3-compatible).
    -   Application accesses via S3 API (not filesystem mount).
    -   Uses `@aws-sdk/client-s3` in Node.js backend.
    -   If the server explodes, your files are safe in Object Storage.
    -   Single bucket: `breyus-files` with folder structure:
        -   `/uploads/`: Trade documents, product images, test reports, KYC documents
        -   `/backups/`: Database backups (MongoDB + PostgreSQL)
        -   `/ai-data/`: AI pipeline files

### Object Storage Configuration

**Environment Variables (in `.env`):**
```env
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_REGION=sgp1
S3_ACCESS_KEY=<your-digitalocean-access-key>
S3_SECRET_KEY=<your-digitalocean-secret-key>
S3_BUCKET=breyus-files
```

**File URL Pattern:**
```
https://sgp1.digitaloceanspaces.com/breyus-files/uploads/trade-documents/{tradeId}/sco.pdf
https://sgp1.digitaloceanspaces.com/breyus-files/uploads/product-images/{productId}/image-1.jpg
```

---

## 7. CI/CD Pipeline (Planned)

> **Status:** Documented, not yet implemented
> **Full specification:** [[operations/CI_CD_PIPELINE]]

The manual SSH deployment workflow described in Section 5 above will be automated using **GitHub Actions**:

- **CI checks** run automatically on pull requests (lint + build per service)
- **Deploys** trigger automatically when PRs merge to `main`, with selective service rebuilds
- **Rollbacks** are available via manual workflow dispatch with deploy tag selection
- **Health checks** verify container status and HTTP endpoints after every deploy

Once implemented, the manual workflow in Section 5 becomes the **fallback procedure** for cases where GitHub Actions is unavailable or the pipeline needs to be bypassed.

**Prerequisites:** A `deploy` user must be set up on the server (see [[operations/SERVER_SETUP#Phase 2.5: Deploy User Setup]]).

---

## 8. Rollback Procedure

If a deploy causes issues, roll back to the previous working state:

### Quick Rollback (< 2 minutes)
```bash
ssh deploy@<ip>
cd /opt/app

# 1. Find the last known-good deploy tag
git tag -l 'deploy-*' --sort=-creatordate | head -5

# 2. Checkout the target tag
git checkout deploy-YYYY-MM-DD-<sha>

# 3. Rebuild and restart affected services
docker compose build backend ai-service
docker compose up -d backend ai-service

# 4. Verify health
docker ps
curl -sf http://localhost:3001/health
```

### Pre-Deploy Checklist
Before every deploy:
- [ ] Backup database (or verify today's automated backup exists)
- [ ] Note the current deploy tag: `git describe --tags --abbrev=0`
- [ ] Verify disk space: `df -h` (need room for Docker builds)

---

## 9. Zero-Downtime Deployment Strategy

Currently, `docker compose up -d` causes brief downtime (container restart). For MVP with low traffic, this is acceptable. For production with active users:

### Phase 1: Graceful Restarts (Current — Minimal Effort)
- Deploy during low-traffic windows (02:00-04:00 UTC)
- Nginx buffers requests during backend restart (~5-10 seconds)
- WebSocket connections will drop — frontend should auto-reconnect

### Phase 2: Rolling Updates (When Traffic Justifies)
- Scale backend to 2 replicas: `docker compose up -d --scale backend=2`
- Use Nginx upstream health checks to route around restarting containers
- Requires: Nginx upstream config changes, Docker Compose `deploy.replicas`

### Phase 3: Blue-Green (10k+ Users)
- Requires DigitalOcean Load Balancer ($12/mo)
- Deploy to new containers, switch traffic at LB level
- Instant rollback by switching back

### WebSocket Reconnection During Deploys
Active WebSocket connections (trade updates, messaging) will drop during container restarts. The frontend Socket.IO client should handle this:
```typescript
// Socket.IO auto-reconnects by default with exponential backoff
// Ensure reconnection is enabled in socket.service.ts
const socket = io(url, { reconnection: true, reconnectionDelay: 1000 });
```

---

## Related
- [[operations/SERVER_SETUP]]
- [[operations/BACKUP_AND_RECOVERY]]
- [[operations/CAPACITY_PLANNING]]
- [[operations/DIGITALOCEAN_HOSTING_BREAKDOWN]]
- [[operations/CI_CD_PIPELINE]]
- [[operations/INCIDENT_RESPONSE]]
- [[MOC-Operations]]
