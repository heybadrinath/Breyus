---
type: operations-doc
module: operations
tags: [operations, security, secrets]
date: 2026-03-11
---

# Secret Management

> **Purpose:** How secrets are stored, rotated, and protected across the Breyus platform.
> **Last Updated:** March 2026

---

## Secret Inventory

| Secret | Storage Location | Used By | Rotation Frequency |
|--------|-----------------|---------|-------------------|
| `JWT_SECRET_KEY` | Server `.env` | Backend (auth) | Every 6 months or after team change |
| `COOKIE_SECRET` | Server `.env` | Backend (session cookies) | Every 6 months |
| `MONGO_ROOT_PASSWORD` | Server `.env` | MongoDB, backup scripts | Every 12 months |
| `POSTGRES_PASSWORD` | Server `.env` | PostgreSQL, AI service | Every 12 months |
| `REDIS_PASSWORD` | Server `.env` | Redis, backend | Every 12 months |
| `SENDINBLUE_API_KEY` | Server `.env` | Backend (email) | When compromised |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Server `.env` | Backend, AI (Spaces) | Every 12 months |
| `AI_API_KEY` | Server `.env` | Backend → AI service auth | Every 6 months |
| `ANTHROPIC_API_KEY` | AI `.env` | AI service (Claude API) | When compromised |
| `GOOGLE_API_KEY` | AI `.env` | AI service (Gemini API) | When compromised |
| `GDRIVE_CLIENT_SECRET` | Server `.env` | AI pipeline (data sync) | When compromised |
| `GDRIVE_REFRESH_TOKEN` | Server `.env` | AI pipeline (data sync) | When revoked |
| `DEPLOY_SSH_KEY` | GitHub Secrets | CI/CD pipeline | Every 12 months or team change |
| Admin passwords | MongoDB collection | Admin portal auth | Every 6 months |

---

## Current Storage Method

**All secrets are stored in `.env` files on the server disk** (`/opt/app/.env`).

**Security measures:**
- `.env` is in `.gitignore` — never committed to Git
- File permissions: `chmod 640 /opt/app/.env` (root:deploy)
- Only the `deploy` user and root can read it
- GitHub Secrets stores only SSH deploy credentials

**Known limitations:**
- Secrets are stored as plain text on disk
- No encryption at rest (relies on server disk encryption / DO volume encryption)
- No audit trail for who accessed or changed secrets
- No automated rotation

---

## Generating Strong Secrets

Always use cryptographically secure random generation:

```bash
# Generate a 32-byte random string (for JWT, cookie secrets)
openssl rand -base64 32

# Generate a URL-safe random string
openssl rand -hex 32

# Generate a strong database password (no special chars that break shells)
openssl rand -base64 24 | tr -d '/+='
```

**Never use:**
- Dictionary words, company names, or guessable patterns
- The same secret for multiple purposes
- Default values from documentation or examples

---

## Rotation Procedure

### JWT_SECRET_KEY Rotation

**Impact:** All active sessions will be invalidated. Users must re-login.

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update .env
ssh deploy@<server-ip>
cd /opt/app
# Edit .env: JWT_SECRET_KEY=<new-value>
nano .env

# 3. Restart backend (sessions invalidated)
docker compose restart backend

# 4. Verify: attempt login
curl -X POST https://api.breyus.com/login -d '{"email":"test@example.com",...}'
```

**Best practice:** Rotate during low-traffic hours. Notify active admin users.

### Database Password Rotation

**Impact:** Requires coordinated update across `.env` and database.

```bash
# 1. Generate new password
NEW_PASS=$(openssl rand -base64 24 | tr -d '/+=')

# 2. Update password in the database FIRST
# MongoDB:
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval "db.changeUserPassword('$MONGO_ROOT_USERNAME', '$NEW_PASS')"

# 3. Update .env with new password
nano /opt/app/.env  # Update MONGO_ROOT_PASSWORD

# 4. Restart services that use this password
docker compose restart backend

# 5. Verify connectivity
docker compose logs --tail=20 backend | grep -i "mongo"
```

### API Key Rotation (Claude, Gemini, Sendinblue)

1. Generate new key in the provider's dashboard
2. Update `.env` on server
3. Restart the relevant service
4. Verify the old key is revoked in the provider dashboard
5. Test the feature that uses the key

---

## Compromise Response

If a secret is suspected to be compromised:

### Immediate Actions (within 15 minutes)

1. **Rotate the compromised secret** using the procedures above
2. **Check access logs** for unauthorized usage:
   ```bash
   # Backend access logs
   docker compose logs --since=24h backend | grep -E "401|403|suspicious"
   # SSH access logs
   cat /var/log/auth.log | grep -E "Accepted|Failed" | tail -50
   ```
3. **Revoke external API keys** if cloud provider keys compromised
4. **Force logout all users** if JWT secret compromised:
   ```bash
   # Clear all admin sessions
   docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
     --authenticationDatabase admin breyus \
     --eval "db.adminsessions.deleteMany({})"
   ```

### Investigation (within 24 hours)

1. How was the secret exposed? (log leak, git commit, unauthorized access)
2. What data could have been accessed with this secret?
3. What preventive measures should be added?
4. Document in `context/changelog/` as a security incident

---

## Future Improvements

When the platform scales beyond MVP:

1. **DigitalOcean 1-Click Vault** or **HashiCorp Vault** for encrypted secret storage
2. **Automated rotation** via cron jobs for database passwords
3. **Secret scanning** in CI (GitHub Advanced Security or `gitleaks`)
4. **Environment-specific secrets** (dev vs staging vs production)
5. **Audit logging** for secret access (who read `.env` and when)

---

## Related

- [[operations/PRODUCTION_HARDENING]] — Infrastructure security
- [[operations/PRODUCTION_CODE_CHECKLIST]] — Code-level security
- [[operations/SERVER_SETUP]] — Server provisioning (where secrets are first created)
- [[operations/INCIDENT_RESPONSE]] — What to do when compromised
- [[MOC-Operations]]
