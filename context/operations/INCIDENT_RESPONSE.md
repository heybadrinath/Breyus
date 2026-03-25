---
type: operations-doc
module: operations
tags: [operations, incident-response, security]
date: 2026-03-11
---

# Incident Response Runbook

> **Purpose:** What to do when production breaks. Step-by-step procedures for common failure scenarios.
> **Last Updated:** March 2026

---

## Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| **SEV-1** | Platform down, all users affected | < 15 minutes | Server unreachable, DB corruption |
| **SEV-2** | Major feature broken, many users affected | < 1 hour | Trade creation failing, auth broken |
| **SEV-3** | Minor feature broken, workaround exists | < 4 hours | AI analysis slow, email delays |
| **SEV-4** | Cosmetic/low-impact issue | Next business day | UI glitch, log noise |

---

## Communication Template

When an incident occurs, post this to the team channel:

```
INCIDENT: [SEV-X] Brief description
IMPACT: What users are experiencing
STATUS: Investigating / Identified / Fixing / Resolved
ETA: Unknown / ~X minutes
LEAD: [Your name]
```

Update every 15 minutes for SEV-1, every 30 minutes for SEV-2.

---

## Common Scenarios

### 1. Server Unreachable (SEV-1)

**Symptoms:** `breyus.com` not loading, SSH timeout, external monitor alerts.

**Steps:**
1. Check DigitalOcean console — is the droplet running?
   - If stopped → Power on via DO console
   - If running but unreachable → Open DO console (browser-based terminal)
2. Check if Docker is running: `systemctl status docker`
3. Check disk space: `df -h` — if full, see Scenario #4
4. Check if containers are up: `docker ps`
5. If all containers are down: `cd /opt/app && docker compose up -d`
6. Verify: `curl http://localhost:3001/health`

**Escalation:** If DO console also unreachable → contact DigitalOcean support (https://cloud.digitalocean.com/support)

---

### 2. Container Crash Loop (SEV-2)

**Symptoms:** Service intermittently available, `docker ps` shows container restarting.

**Steps:**
1. Identify crashing container: `docker ps -a | grep -E "Restarting|Exited"`
2. Check logs: `docker compose logs --tail=100 <service>`
3. Common causes:
   - **OOM Kill:** `docker inspect <container> | grep -i oom` → Increase memory limit or add swap
   - **Config error:** Check `.env` file for missing/wrong values
   - **Port conflict:** `ss -tlnp | grep <port>`
4. Fix the issue, then restart: `docker compose up -d <service>`

---

### 3. Database Connection Failure (SEV-1)

**Symptoms:** API returns 500 errors, "Connection refused" in backend logs.

**Steps:**
1. Check DB container: `docker ps | grep mongo` (or `postgres`, `redis`)
2. If stopped: `docker compose up -d mongo`
3. Check logs: `docker compose logs --tail=50 mongo`
4. Test connectivity from backend:
   ```bash
   docker exec breyus_backend node -e "
     const mongoose = require('mongoose');
     mongoose.connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(e => console.error(e));
   "
   ```
5. If data corruption suspected → restore from backup: see [[operations/BACKUP_AND_RECOVERY#3. Disaster Recovery]]

---

### 4. Disk Full (SEV-1)

**Symptoms:** Containers crashing, writes failing, "No space left on device" errors.

**Steps:**
1. Check disk: `df -h`
2. Find large consumers: `du -sh /var/lib/docker/* | sort -rh | head`
3. Quick fixes (in order of safety):
   ```bash
   # Clean Docker build cache (safe)
   docker builder prune -f

   # Remove unused images (safe)
   docker image prune -f

   # Clean old logs (safe, if log rotation wasn't configured)
   truncate -s 0 /var/lib/docker/containers/*/*-json.log

   # Remove stopped containers (safe)
   docker container prune -f
   ```
4. **Prevention:** Configure log rotation (see [[operations/PRODUCTION_HARDENING#10. Docker Log Rotation Missing]])

---

### 5. SSL Certificate Expired (SEV-2)

**Symptoms:** Browser shows "connection not secure", HTTPS errors.

**Steps:**
1. Check cert expiry: `openssl s_client -connect breyus.com:443 2>/dev/null | openssl x509 -noout -dates`
2. Renew: `certbot renew`
3. Reload Nginx: `docker exec breyus_nginx nginx -s reload`
4. **Prevention:** Verify certbot timer is running: `systemctl list-timers | grep certbot`

---

### 6. AI Service Down (SEV-3)

**Symptoms:** AI search returns errors, market analysis jobs fail.

**Steps:**
1. Check container: `docker ps | grep ai`
2. Check logs: `docker compose logs --tail=50 ai-service`
3. Common issues:
   - **Model load failure:** Check if enough RAM, restart container
   - **PostgreSQL down:** Fix DB first (Scenario #3)
   - **External API (Claude/Gemini) failure:** Check API key validity, check status pages
4. Restart: `docker compose restart ai-service`
5. Wait 3-5 minutes for model to load, then test: `curl http://localhost:8000/health`

---

### 7. High Memory / CPU Usage (SEV-3)

**Symptoms:** Slow responses, monitoring alerts.

**Steps:**
1. Check system: `htop` or `docker stats`
2. Identify the offender: `docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"`
3. If a single container is spiking:
   - Backend memory leak → `docker compose restart backend`
   - AI service → Normal during model load, wait 5 minutes
   - MongoDB → Check for missing indexes, slow queries
4. If system-wide → Consider upgrading droplet

---

## Post-Incident

After every SEV-1 or SEV-2 incident:

1. **Document:** Create entry in `context/changelog/` with what happened and fix
2. **Root cause:** Identify why it happened (not just the symptoms)
3. **Prevention:** Add monitoring/alerting to catch it earlier next time
4. **Update runbook:** If this scenario isn't covered above, add it

---

## Useful Commands Quick Reference

```bash
# Overall health
docker ps -a
docker stats --no-stream
df -h
free -h

# Service logs
docker compose logs --tail=100 backend
docker compose logs --tail=100 -f ai-service

# Restart specific service
docker compose restart backend

# Restart everything
docker compose down && docker compose up -d

# Check external connectivity
curl -sf https://api.breyus.com/health
curl -sf https://breyus.com
```

---

## Related

- [[operations/BACKUP_AND_RECOVERY]] — Restore procedures
- [[operations/PRODUCTION_HARDENING]] — Prevention checklist
- [[operations/DEPLOYMENT]] — Rollback procedures
- [[operations/SERVER_SETUP]] — Full server rebuild
- [[MOC-Operations]]
