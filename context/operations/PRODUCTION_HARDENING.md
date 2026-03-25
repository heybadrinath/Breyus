---
type: operations-doc
module: operations
tags: [operations, security, hardening]
date: 2026-03-10
---

# Production Hardening Checklist

> **Status:** Pre-production audit findings. All items documented for future implementation.
> **Last Updated:** March 2026
> **Source:** Infrastructure audit cross-referencing `docker-compose.yml`, `nginx/conf.d/default.conf`, `scripts/backup.sh`, and `backend/src/common/storage/` against operations docs.

---

## Priority Legend

| Priority | Meaning | When to Fix |
|----------|---------|-------------|
| **CRITICAL** | Security vulnerability or data loss risk | Before any public traffic |
| **HIGH** | Significant security or reliability gap | Before production launch |
| **MEDIUM** | Best practice improvement | First maintenance window |

---

## CRITICAL Issues

### 1. Database Ports Exposed to Internet

**File:** `docker-compose.yml`
**Issue:** MongoDB (27017), PostgreSQL (5432), and Redis (6379) ports are mapped to the host, making them reachable from the internet.

**Current:**
```yaml
mongo:
  ports:
    - "27017:27017"   # Accessible from internet
postgres:
  ports:
    - "5432:5432"     # Accessible from internet
redis:
  ports:
    - "6379:6379"     # Accessible from internet
```

**Fix:** Replace `ports` with `expose` for all databases. Only services inside the Docker network need access.
```yaml
mongo:
  expose:
    - "27017"         # Internal only
```

**Risk:** Unauthenticated database access from any IP. MongoDB and Redis are especially vulnerable (Redis has no auth configured).

---

### 2. Hardcoded Default Credentials

**File:** `docker-compose.yml`
**Issue:** Database credentials are hardcoded as defaults (`breyus`/`breyus_secret` for MongoDB, `postgres`/`postgres` for PostgreSQL).

**Fix:** Move all credentials to `.env` file with strong generated passwords. Use `${VARIABLE}` references in docker-compose.yml. Generate passwords with `openssl rand -base64 32`.

**Risk:** If ports are exposed (Issue #1), these default credentials are trivially guessable.

---

### 3. Redis Has No Authentication

**File:** `docker-compose.yml`
**Issue:** Redis container has no `requirepass` configured. Any container (or external actor if ports are exposed) can read/write Redis data.

**Current:** Redis stores OTP codes for login verification.

**Fix:** Add `command: redis-server --requirepass ${REDIS_PASSWORD}` to the Redis service. Update `REDIS_URL` to `redis://:${REDIS_PASSWORD}@redis:6379`.

**Risk:** OTP bypass — attacker could read OTP codes from Redis and complete authentication without email access.

---

### 4. Docker Socket Mount (Privilege Escalation)

**File:** `docker-compose.yml` (line 186), `backend/src/admin/system/health.service.ts`
**Issue:** The Docker socket is mounted into the backend container via `/var/run/docker.sock:/var/run/docker.sock:ro`. The `health.service.ts` runs 8 shell commands (`docker ps`, `docker stats`, `docker inspect`, `docker logs`, `docker restart`, `docker stop`, `docker start`) via `child_process.exec()` with string interpolation — both a privilege escalation risk and a shell injection vector.

**Decision:** Replace with **dockerode (Node.js Docker SDK) + Tecnativa docker-socket-proxy**.

**Risk:** Container compromise → full host compromise. Shell injection via unsanitized container names → arbitrary command execution on host.

#### Migration Architecture

```
Backend (dockerode)  ──HTTP:2375──▶  docker-socket-proxy  ──filtered──▶  /var/run/docker.sock  ──▶  Docker Daemon
                                     (Tecnativa)
                                     Whitelist: containers, info
                                     Block: exec, images, volumes, networks, secrets
```

#### Step 1: docker-compose.yml Changes (3 edits)

**Add** new service (`docker-socket-proxy`):
```yaml
# Docker Socket Proxy - Filters Docker API access for health monitoring
docker-socket-proxy:
  image: tecnativa/docker-socket-proxy:latest
  container_name: breyus_docker_proxy
  restart: unless-stopped
  environment:
    CONTAINERS: 1       # GET /containers/* (list, inspect, stats, logs)
    INFO: 1             # GET /info (Docker engine info)
    POST: 1             # POST /containers/*/restart|stop|start (admin actions)
    EXEC: 0             # Block exec into containers
    IMAGES: 0           # Block image operations
    NETWORKS: 0         # Block network operations
    VOLUMES: 0          # Block volume operations
    SERVICES: 0         # Block swarm service operations
    NODES: 0            # Block swarm node operations
    BUILD: 0            # Block image builds
    COMMIT: 0           # Block container commits
    SECRETS: 0          # Block secrets
    CONFIGS: 0          # Block configs
    PLUGINS: 0          # Block plugin operations
    SWARM: 0            # Block swarm operations
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  networks:
    - breyus_network
  deploy:
    resources:
      limits:
        cpus: '0.25'
        memory: 128M
```

**Remove** from `backend` service volumes:
```yaml
# DELETE this line:
- /var/run/docker.sock:/var/run/docker.sock:ro
```

**Add** to `backend` service:
```yaml
environment:
  - DOCKER_HOST=tcp://docker-socket-proxy:2375
depends_on:
  docker-socket-proxy:
    condition: service_started
```

#### Step 2: Install npm Dependencies

```bash
cd backend
npm install dockerode
npm install -D @types/dockerode
```

#### Step 3: Refactor health.service.ts — Command-to-Method Mapping

Replace all 8 `execAsync('docker ...')` calls with dockerode methods:

| # | Current Shell Command | Line | dockerode Replacement |
|---|---|---|---|
| 1 | `docker ps -a --format "{{.Names}}\|{{.Status}}\|{{.Image}}"` | 519 | `docker.listContainers({ all: true })` → map `.Names[0]`, `.Status`, `.Image` |
| 2 | `docker stats ${name} --no-stream --format "{{.CPUPerc}}\|{{.MemUsage}}"` | 598 | `container.stats({ stream: false })` → manual CPU% and memory calc (see notes) |
| 3 | `docker inspect ${name} --format "{{.RestartCount}}"` | 852 | `container.inspect()` → `.RestartCount` |
| 4 | `docker logs --tail N --timestamps ${name} 2>&1` | 960 | `container.logs({ tail: N, timestamps: true, stdout: true, stderr: true })` → Buffer demux |
| 5 | `docker inspect ${name} --format '{{json .}}'` | 1083 | `container.inspect()` → returns full JSON object |
| 6 | `docker restart ${name}` | 989 | `container.restart()` |
| 7 | `docker stop ${name}` | 1012 | `container.stop()` |
| 8 | `docker start ${name}` | 1035 | `container.start()` |

#### Step 4: Implementation Notes

**Initialization:**
```typescript
import Docker from 'dockerode';
// Reads DOCKER_HOST env var automatically
const docker = new Docker();
```

**CPU% Calculation** (from `container.stats({ stream: false })`):
```typescript
const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
const cpuCount = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;
const cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100;
```

**Memory Calculation:**
```typescript
const memUsage = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
const memLimit = stats.memory_stats.limit;
const memPercent = (memUsage / memLimit) * 100;
```

**Log Demuxing** — Docker multiplexes stdout/stderr into a single stream with 8-byte headers:
```typescript
const logBuffer = await container.logs({ tail: 100, timestamps: true, stdout: true, stderr: true });
// dockerode returns a Buffer with multiplexed streams
// Use docker-modem's demuxStream or parse manually:
// Bytes 0: stream type (1=stdout, 2=stderr), Bytes 4-7: frame size (big-endian uint32)
const logString = logBuffer.toString('utf8').replace(/[\x00-\x08]/g, ''); // Strip header bytes
```

**Container Name Resolution:**
```typescript
// docker.listContainers() returns names with leading '/', e.g. '/breyus_backend'
const name = containerInfo.Names[0].replace(/^\//, '');
```

**What stays as execAsync:** System commands (`df -h`, `curl`, `pg_isready`, `openssl s_client`) are NOT Docker commands and remain as `execAsync`. Only Docker CLI calls are replaced.

**Input validation:** Container name sanitization (`/^[a-zA-Z0-9_.-]+$/` regex check) is still needed even with dockerode — prevents directory traversal in the container name parameter.

#### Step 5: Verification

After migration, verify with these commands:
```bash
# 1. Proxy is running and filtering
docker exec breyus_docker_proxy wget -qO- http://localhost:2375/containers/json | head -1

# 2. Backend has no socket access
docker inspect breyus_backend | grep -i "docker.sock"  # Should return nothing

# 3. Blocked endpoints return 403
docker exec breyus_backend curl -s http://docker-socket-proxy:2375/images/json  # Should fail

# 4. Health endpoint still works
curl -s http://localhost:3001/admin/system/health | jq '.data.docker'

# 5. Container management works (restart/stop/start via POST)
curl -X POST http://docker-socket-proxy:2375/containers/breyus_redis/restart
```

---

### 5. No S3 Object Versioning

**File:** DigitalOcean Spaces configuration (external)
**Issue:** Trade documents (SCO, ICPO, SPA, BoL), KYC documents, and product images on S3 have no versioning. Accidental deletion or overwrite is permanent.

**Decision:** Enable S3 versioning on the `breyus-files` bucket.

**Fix:**
```bash
aws s3api put-bucket-versioning \
  --bucket breyus-files \
  --versioning-configuration Status=Enabled \
  --endpoint-url https://sgp1.digitaloceanspaces.com
```

Add a lifecycle rule to expire non-current versions after 90 days to control storage costs:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket breyus-files \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "expire-old-versions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": { "NoncurrentDays": 90 },
      "Filter": { "Prefix": "" }
    }]
  }' \
  --endpoint-url https://sgp1.digitaloceanspaces.com
```

**Risk:** Permanent data loss on accidental delete/overwrite. Trade documents are legally significant and may be required for dispute resolution.

---

## HIGH Issues

### 6. Missing HSTS Header

**File:** `nginx/conf.d/default.conf`
**Issue:** No `Strict-Transport-Security` header. Browsers may allow HTTP downgrade attacks on first visit.

**Fix:** Add to the HTTPS server block:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Risk:** Man-in-the-middle attacks on first connection (before HTTPS redirect).

---

### 7. Missing Content Security Policy

**File:** `nginx/conf.d/default.conf`
**Issue:** No `Content-Security-Policy` header. XSS attacks have wider impact without CSP restrictions.

**Fix:** Start with a report-only policy, then enforce:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://sgp1.digitaloceanspaces.com; connect-src 'self' wss://api.breyus.com" always;
```

**Risk:** XSS payloads can load external scripts, exfiltrate data, or hijack sessions without CSP boundaries.

---

### 8. Login Rate Limit Zone Unused

**File:** `nginx/conf.d/default.conf`
**Issue:** `limit_req_zone` for `login_limit` (5 requests/minute) is defined but never applied to any `location` block. The `/login` endpoint has no rate limiting.

**Fix:** Apply the zone to login endpoints:
```nginx
location /api/login {
    limit_req zone=login_limit burst=3 nodelay;
    proxy_pass http://backend_api;
}
```

**Risk:** Credential brute-force attacks. 5r/m limit exists in config but isn't protecting anything.

---

## MEDIUM Issues

### 9. Upload Cache Headers for Sensitive Documents

**File:** `nginx/conf.d/default.conf`
**Issue:** S3-proxied uploads are served with `Cache-Control: public, immutable`. This includes KYC documents (passports, tax certificates) which should never be publicly cached.

**Fix:** Differentiate cache headers by path:
```nginx
# Product images — public cache is fine
location ~* /uploads/product-images/ {
    add_header Cache-Control "public, max-age=86400";
}

# KYC and trade documents — no caching
location ~* /uploads/(kyc-documents|trade-documents)/ {
    add_header Cache-Control "private, no-store";
}
```

**Risk:** Sensitive identity documents cached in CDN/proxy layers accessible to others.

---

### 10. Docker Log Rotation Missing

**File:** `docker-compose.yml`
**Issue:** No `logging` configuration on containers. Docker defaults to unlimited JSON file logging, which can fill the 320 GB disk over time.

**Fix:** Add to each service (or set as default in Docker daemon config):
```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "5"
```

Or set globally in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

**Risk:** Disk exhaustion → all containers crash. Particularly risky with verbose AI service logs.

---

### 11. AI Service Health Check Start Period

**File:** `docker-compose.yml`
**Issue:** `start_period: 120s` for the AI service may be too short. Loading sentence-transformer embedding models can take 2-3 minutes on cold start, especially with limited RAM.

**Fix:** Increase to `start_period: 300s` and add retries:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 300s
```

**Risk:** Container marked unhealthy during legitimate startup → restart loop → service never comes up.

---

### 12. Missing Permissions-Policy Header

**File:** `nginx/conf.d/default.conf`
**Issue:** No `Permissions-Policy` header to restrict browser feature access (camera, microphone, geolocation).

**Fix:**
```nginx
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

**Risk:** Low — but good practice. Prevents compromised JS from accessing hardware APIs.

---

### 13. Stale Code Comment

**File:** `scripts/backup.sh` (line 29)
**Issue:** ~~Comment still references "Hetzner Storage Box" from pre-migration.~~ **FIXED** (2026-03-11) — Updated to reference DigitalOcean Spaces.

**Status:** Resolved.

---

## NEW: Additional Hardening Items (Added March 2026)

### 14. SSH Hardening — `OPEN`

**Priority:** HIGH
**Issue:** SERVER_SETUP configures UFW but doesn't harden SSH itself. Root login, password auth, and default port remain enabled.

**Fix:** Add to `/etc/ssh/sshd_config`:
```bash
# Disable root login (use deploy user instead)
PermitRootLogin no

# Disable password authentication (key-only)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Optional: Change SSH port (reduces automated scans)
# Port 2222

# Limit login attempts
MaxAuthTries 3
LoginGraceTime 30
```

Then restart SSH:
```bash
systemctl restart sshd
```

**Install fail2ban** for brute-force protection:
```bash
apt install fail2ban -y
systemctl enable fail2ban

# Create jail config
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

systemctl restart fail2ban
```

**Risk:** Without this, automated SSH scanners attempt thousands of passwords daily against the server.

---

### 15. TLS Version Enforcement — `OPEN`

**Priority:** MEDIUM
**Issue:** Nginx doesn't explicitly enforce minimum TLS version. TLS 1.0 and 1.1 are deprecated and vulnerable.

**Fix:** Add to Nginx HTTPS server block:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
```

**Risk:** TLS 1.0/1.1 have known vulnerabilities (BEAST, POODLE). Modern browsers don't need them.

---

### 16. Docker Daemon Security — `OPEN`

**Priority:** MEDIUM
**Issue:** No Docker daemon-level security configuration.

**Fix:** Add to `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  },
  "no-new-privileges": true,
  "live-restore": true,
  "userns-remap": "default"
}
```

**Notes:**
- `no-new-privileges`: Prevents container processes from gaining additional privileges
- `live-restore`: Keeps containers running during Docker daemon restarts
- `userns-remap`: Maps container root to non-root on host (test thoroughly — may break volume permissions)
- Log rotation is also addressed in Issue #10 but daemon-level config is the cleaner approach

---

### 17. Docker + UFW Interaction (CRITICAL) — `OPEN`

**Priority:** CRITICAL
**Issue:** Docker manipulates iptables directly, **bypassing UFW rules entirely**. This means the UFW rules in [[operations/SERVER_SETUP]] may not actually protect database ports (27017, 5432, 6379). Even with `ufw deny` rules, Docker-published ports can be accessible from the internet.

**Fix:** Two approaches:

**Option A (Recommended): Don't publish database ports** — use `expose` instead of `ports` in docker-compose.yml (already covered in Issue #1).

**Option B: Configure Docker to respect UFW:**
```bash
# Add to /etc/docker/daemon.json
{
  "iptables": false
}
# Then manually add DOCKER-USER chain rules
iptables -I DOCKER-USER -i eth0 -j DROP
iptables -I DOCKER-USER -i eth0 -p tcp --dport 80 -j ACCEPT
iptables -I DOCKER-USER -i eth0 -p tcp --dport 443 -j ACCEPT
```

**Caution:** Option B is complex and error-prone. Option A (not publishing database ports) is strongly preferred.

**Risk:** Database ports accessible from the internet despite UFW rules — combined with Issue #2 (default credentials), this is a data breach vector.

---

### 18. Automatic Security Updates — `OPEN`

**Priority:** HIGH
**Issue:** No `unattended-upgrades` configured. Security patches for OS packages are not applied automatically.

**Fix:**
```bash
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

Verify configuration in `/etc/apt/apt.conf.d/50unattended-upgrades`:
```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
```

**Risk:** Known OS vulnerabilities remain unpatched until manual intervention.

---

## Verification Checklist

After implementing fixes, verify each item:

- [ ] `nmap -p 27017,5432,6379 <server-ip>` — all ports should be closed/filtered
- [ ] `docker exec breyus_redis redis-cli PING` — should require auth
- [ ] `curl -sI https://breyus.com | grep Strict-Transport` — HSTS header present
- [ ] `curl -sI https://breyus.com | grep Content-Security` — CSP header present
- [ ] `docker logs breyus_ai_service 2>&1 | tail -1` — verify log rotation working
- [ ] S3 versioning: upload, overwrite, verify old version retrievable
- [ ] `docker inspect breyus_backend | grep -i socket` — no socket mount
- [ ] Login brute-force test: 6 rapid requests should get 429
- [ ] `ssh root@<server-ip>` — should be denied (PermitRootLogin no)
- [ ] `ssh -o PasswordAuthentication=yes deploy@<server-ip>` — should be denied (key-only)
- [ ] `fail2ban-client status sshd` — shows active bans
- [ ] `openssl s_client -connect breyus.com:443 -tls1` — should fail (TLS 1.0 disabled)
- [ ] `openssl s_client -connect breyus.com:443 -tls1_2` — should succeed
- [ ] `nmap -p 27017,5432,6379 <server-ip>` — all ports closed (Docker+UFW fix verified)

---

## Related

- [[operations/SERVER_SETUP]] — Server provisioning
- [[operations/DEPLOYMENT]] — Deployment architecture
- [[operations/BACKUP_AND_RECOVERY]] — Backup strategy
- [[operations/CI_CD_PIPELINE]] — CI/CD automation
- [[MOC-Operations]]
