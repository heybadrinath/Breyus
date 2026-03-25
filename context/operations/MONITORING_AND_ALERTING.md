---
type: operations-doc
module: operations
tags: [operations, monitoring, alerting, observability]
date: 2026-03-11
---

# Monitoring & Alerting Strategy

> **Last Updated**: March 2026
> **Criticality**: HIGH (Can't Fix What You Can't See)

---

## 1. Monitoring Stack

Breyus uses free-tier tools to keep costs at zero until scale demands paid plans.

| Layer | Tool | Free Tier | Purpose |
|-------|------|-----------|---------|
| **External Uptime** | Better Stack (formerly Uptime Robot) | 10 monitors, 3-min intervals | HTTP endpoint checks from outside |
| **Error Tracking** | Sentry | 5,000 errors/month | Application error capture with stack traces |
| **Infrastructure** | DigitalOcean Monitoring | Free with Droplet | CPU, RAM, disk, bandwidth graphs |
| **Log Aggregation** | Docker JSON logs + rotation | Free (built-in) | Container stdout/stderr logs |
| **Custom Metrics** | `scripts/db-maintenance.sh` | Free (cron-based) | Database health snapshots |

### Why Not Prometheus/Grafana?

For a single-server MVP, the operational overhead of running Prometheus + Grafana (2 more containers, persistent storage, dashboard maintenance) outweighs the benefit. The stack above covers the critical monitoring needs at zero cost. When Breyus scales to multiple servers or needs sub-minute alerting, migrate to Prometheus + Grafana + Loki.

---

## 2. What to Monitor

### 2.1 External Uptime Monitors (Better Stack)

Set up these monitors — they detect outages even when the server itself is unreachable.

| # | Monitor | URL / Check | Interval | Alert After |
|---|---------|-------------|----------|-------------|
| 1 | **API Health** | `https://api.breyus.com/health` | 3 min | 2 failures (6 min) |
| 2 | **Frontend** | `https://breyus.com` | 3 min | 2 failures |
| 3 | **Admin Portal** | `https://admin.breyus.com` | 3 min | 2 failures |
| 4 | **AI Server** | `https://api.breyus.com/ai/health` | 5 min | 3 failures (15 min) |
| 5 | **SSL Certificate** | `breyus.com` (SSL check) | Daily | 14 days before expiry |
| 6 | **SSL Certificate** | `api.breyus.com` (SSL check) | Daily | 14 days before expiry |

**Expected responses:**
- API Health: `200 OK` with `{"statusCode": 200, "message": "OK"}`
- Frontend: `200 OK` (HTML page)
- Admin Portal: `200 OK` (HTML page)
- AI Health: `200 OK` with `{"status": "healthy"}`

### 2.2 Infrastructure Alerts (DigitalOcean)

Configure in DigitalOcean Control Panel → Monitoring → Create Alert Policy.

| Metric | Warning Threshold | Critical Threshold | Duration | Action |
|--------|------------------|-------------------|----------|--------|
| **CPU Usage** | > 80% | > 95% | 5 min sustained | Check for runaway processes |
| **Memory Usage** | > 85% | > 95% | 5 min sustained | Check OOM killer, add swap |
| **Disk Usage** | > 80% | > 90% | Any | Clean logs, expand volume |
| **Bandwidth** | > 80% of plan | > 95% | 1 hour | Investigate traffic spike |

### 2.3 Application-Level Monitoring

These are checked by cron scripts running on the server itself.

| Check | Script/Command | Frequency | Alert Trigger |
|-------|---------------|-----------|---------------|
| **All containers running** | `docker ps --format '{{.Names}}: {{.Status}}'` | Every 5 min | Any container not "Up" |
| **MongoDB connections** | See [[operations/DATABASE_MAINTENANCE#1.4]] | Hourly | > 80% of pool |
| **MongoDB backup freshness** | Check file timestamp in `/data/backups/mongodb/` | Daily at 04:00 | No backup in last 26 hours |
| **PostgreSQL dead tuples** | See [[operations/DATABASE_MAINTENANCE#2.2]] | Weekly | dead_pct > 20% |
| **Disk space** | `df -h /data` | Every 30 min | > 80% used |
| **Redis memory** | `docker exec breyus_redis redis-cli INFO memory` | Hourly | > 200MB |

**Container health check script** (add to cron every 5 minutes):

```bash
#!/bin/bash
# scripts/check-containers.sh
EXPECTED="breyus_backend breyus_frontend breyus_admin breyus_mongo breyus_redis breyus_nginx"

for container in $EXPECTED; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "ALERT: Container $container is not running" | \
      mail -s "Breyus Container Alert: $container DOWN" ops@breyus.com
  fi
done
```

```cron
# Container health check every 5 minutes
*/5 * * * * /opt/app/scripts/check-containers.sh 2>&1
```

---

## 3. Alert Routing

### Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| **P1 — Critical** | Service is down or data loss risk | < 15 min | All containers down, API unreachable, backup failure |
| **P2 — High** | Service degraded but functional | < 1 hour | High CPU (>95%), disk >90%, single container down |
| **P3 — Warning** | Potential issue, not yet impactful | < 4 hours | CPU >80%, disk >80%, slow queries |
| **P4 — Info** | Routine notification | Next business day | SSL renewal success, backup completion |

### Notification Channels

| Severity | Channel | Recipients |
|----------|---------|------------|
| **P1** | Email + SMS (Better Stack) | All team members |
| **P2** | Email (Better Stack + DO) | Primary on-call |
| **P3** | Email (DO alerts) | Primary on-call |
| **P4** | Log file only | N/A (review weekly) |

**Better Stack webhook configuration:**
1. Create account at betterstack.com
2. Add monitors from Section 2.1
3. Configure alert contacts (email + SMS for P1)
4. Set up on-call schedule (if team > 1 person)

---

## 4. Dashboard Setup

### DigitalOcean Monitoring Dashboard

1. Navigate to DigitalOcean Control Panel → Monitoring
2. Create dashboard "Breyus Production"
3. Add graphs:
   - CPU Utilization (% over time)
   - Memory Utilization (% over time)
   - Disk I/O (read/write bytes)
   - Bandwidth (inbound/outbound)
   - Disk Usage (% full)
4. Set time range to 24 hours by default

### Custom Status Page (Optional)

For external status visibility, use Better Stack's free status page:
- URL: `status.breyus.com` (CNAME to Better Stack)
- Shows: API, Frontend, Admin Portal uptime
- Auto-updates based on monitor status

---

## 5. Log Aggregation Strategy

### Current: Docker JSON Logs

All container logs are captured by Docker's JSON log driver with rotation configured in [[operations/PRODUCTION_HARDENING#10]]:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```

**Viewing logs:**
```bash
# Last 100 lines from backend
docker logs --tail 100 breyus_backend

# Follow logs in real-time
docker logs -f breyus_backend

# Filter for errors
docker logs breyus_backend 2>&1 | grep -i "error\|exception\|fatal"

# Logs from specific time range
docker logs --since "2026-03-11T00:00:00" --until "2026-03-11T06:00:00" breyus_backend
```

### Future: Loki + Grafana (When Scaling)

When Breyus moves to multiple servers or needs log search across containers:

1. Add Loki container for log ingestion
2. Add Promtail sidecar for log shipping
3. Add Grafana for log visualization + dashboards
4. Estimated overhead: ~512MB RAM, ~2GB disk

**Trigger for migration:** When debugging requires searching logs across > 3 containers simultaneously, or when the team grows to > 3 developers.

---

## 6. Sentry Error Tracking Setup

### Backend (NestJS)

```bash
cd backend
npm install @sentry/nestjs
```

```typescript
// src/main.ts — add before app.listen()
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions for performance
});
```

### Frontend (React)

```bash
cd frontend
npm install @sentry/react
```

```typescript
// src/index.tsx — add before ReactDOM.render()
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### AI Server (FastAPI)

```bash
pip install sentry-sdk[fastapi]
```

```python
# server/main.py — add at startup
import sentry_sdk
sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=0.1)
```

**Free tier limit:** 5,000 errors/month. Set `tracesSampleRate: 0.1` to avoid exhausting the quota on performance traces.

---

## Related

- [[operations/INCIDENT_RESPONSE]] — What to do when alerts fire
- [[operations/DATABASE_MAINTENANCE]] — Database-specific monitoring
- [[operations/PRODUCTION_HARDENING]] — Security and reliability baseline
- [[operations/CAPACITY_PLANNING]] — When to scale up
- [[MOC-Operations]]
