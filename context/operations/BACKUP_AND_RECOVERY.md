---
type: operations-doc
module: operations
tags: [operations, backup_and_recovery]
date: 2026-03-10
---

# Breyus Backup & Recovery Strategy

> **Last Updated**: March 2026
> **Criticality**: HIGH (Primary Data Safety Net)

---

## 1. Strategy Overview

### Recovery Objectives

| Metric | MongoDB (Main DB) | PostgreSQL (AI DB) | File Storage (Spaces) |
|--------|-------------------|--------------------|-----------------------|
| **RPO** (max data loss) | ≤ 24 hours | ≤ 7 days | Near-zero (versioned) |
| **RTO** (max downtime) | ≤ 2 hours | ≤ 4 hours | ≤ 1 hour |

**RPO rationale:** MongoDB holds trades, negotiations, and KYC — 24h max loss is acceptable for MVP, daily backups achieve this. PostgreSQL AI data is regeneratable from the pipeline (days, not hours), so 7-day RPO with weekly backups is acceptable.

### Backup Schedule

| Database | Backup Type | Frequency | Retention | Rationale |
|----------|-------------|-----------|-----------|-----------|
| **MongoDB** (main data) | Versioned, timestamped archives | **Daily** (02:00 UTC) | 14 days (configurable) | User data, trades, companies — critical. Daily achieves 24h RPO |
| **PostgreSQL** (AI data) | Versioned, timestamped archives | **Weekly** (Sunday 03:00 UTC) | 4 copies (28 days) | AI data is regeneratable but re-embedding 30GB+ takes days |
| **Redis** (cache) | None | N/A | N/A | Ephemeral by design — OTPs (10-min TTL), job status (15-min TTL). No backup needed |

### Storage & Offsite

**Local:** Backups stored in Docker volume (`breyus_backup_data`) at `/data/backups`.

**Offsite (MANDATORY for production):** After each backup, automatically upload to **DigitalOcean Spaces** (`breyus-files/backups/`). Local-only backups provide zero protection against disk failure.

**File Storage (Spaces):** Trade documents, KYC docs, and product images are stored on DigitalOcean Spaces with S3 versioning enabled (see [[operations/PRODUCTION_HARDENING#5. No S3 Object Versioning]]). Spaces provides built-in redundancy. No separate backup needed, but enable versioning for accidental deletion protection.

---

## 2. Backup Script: `scripts/backup.sh`

The backup script is production-ready and supports both Docker exec and local CLI modes.

### Usage

```bash
# Backup both databases (default)
./scripts/backup.sh

# MongoDB only
./scripts/backup.sh --mongo-only

# PostgreSQL only
./scripts/backup.sh --postgres-only

# Custom retention (keep 30 days of MongoDB backups)
./scripts/backup.sh --retention 30

# Custom output directory
./scripts/backup.sh --output-dir /path/to/backups

# JSON output (for admin portal integration)
./scripts/backup.sh --json
```

### How It Works

**MongoDB backup:**
1. Detects if Docker is available and `breyus_mongo` container is running
2. Runs `mongodump` inside the container with authentication:
   ```bash
   docker exec breyus_mongo mongodump \
       --authenticationDatabase admin \
       -u "$MONGO_USER" -p "$MONGO_PASS" \
       --db breyus --archive="/tmp/backup.archive" --gzip
   ```
3. Copies the archive out of the container to `$BACKUP_DIR/mongodb/breyus_mongo_YYYYMMDD-HHMMSS.archive.gz`
4. Cleans up temp file inside container
5. Runs retention cleanup (deletes backups older than `--retention` days)

**PostgreSQL backup:**
1. Runs `pg_dump` inside `breyus_postgres` with password via environment:
   ```bash
   docker exec -e PGPASSWORD="$POSTGRES_PASS" breyus_postgres \
       pg_dump -U "$POSTGRES_USER" -d breyus_ai | gzip > temp_file
   ```
2. Atomic swap: writes to `.tmp` file, then `mv` to `breyus_postgres_latest.sql.gz`
3. Records timestamp to `last_backup.txt`

### Environment Variables

The script reads these from the environment (with defaults matching `docker-compose.yml`):

| Variable | Default | Used For |
|----------|---------|----------|
| `MONGO_ROOT_USERNAME` | `${MONGO_ROOT_USERNAME}` | MongoDB auth (set in `.env`) |
| `MONGO_ROOT_PASSWORD` | `${MONGO_ROOT_PASSWORD}` | MongoDB auth (set in `.env`) |
| `MONGO_DB` | `breyus` | Database name |
| `POSTGRES_USER` | `${POSTGRES_USER}` | PostgreSQL auth (set in `.env`) |
| `POSTGRES_PASSWORD` | `${POSTGRES_PASSWORD}` | PostgreSQL auth (set in `.env`) |
| `POSTGRES_DB` | `breyus_ai` | Database name |

> **Security:** Never hardcode credentials in docs or scripts. All passwords come from `.env` on the server. Generate strong passwords with `openssl rand -base64 32`.

### Automation (Cron Job)

Run `crontab -e` as root on the **host server** (not inside a container):

```cron
# MongoDB: DAILY at 02:00 AM UTC (achieves 24h RPO)
0 2 * * * /opt/app/scripts/backup.sh --mongo-only --retention 14 >> /var/log/breyus_backup_mongo.log 2>&1

# PostgreSQL (AI): WEEKLY on Sunday at 03:00 AM UTC (achieves 7-day RPO)
0 3 * * 0 /opt/app/scripts/backup.sh --postgres-only >> /var/log/breyus_backup_ai.log 2>&1

# Offsite upload: Daily at 04:00 AM UTC (after backups complete)
0 4 * * * /opt/app/scripts/backup-offsite.sh >> /var/log/breyus_backup_offsite.log 2>&1
```

**`scripts/backup-offsite.sh`** (create this):
```bash
#!/bin/bash
# Upload latest backups to DigitalOcean Spaces
DO_ENDPOINT="https://sgp1.digitaloceanspaces.com"
BACKUP_DIR="/data/backups"

# Sync MongoDB backups (last 14 days)
aws s3 sync "$BACKUP_DIR/mongodb/" "s3://breyus-files/backups/mongodb/" \
  --endpoint-url "$DO_ENDPOINT" --delete

# Sync PostgreSQL backups (last 4 copies)
aws s3 sync "$BACKUP_DIR/postgresql/" "s3://breyus-files/backups/postgresql/" \
  --endpoint-url "$DO_ENDPOINT" --delete

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') Offsite sync complete" >> /var/log/breyus_backup_offsite.log
```

### Backup Directory Structure

```
/data/backups/                              # Docker volume (breyus_backup_data)
├── mongodb/
│   ├── breyus_mongo_20260311-020000.archive.gz
│   ├── breyus_mongo_20260310-020000.archive.gz
│   └── ...                                 # Retention: 14 days (daily)
└── postgresql/
    ├── breyus_postgres_20260309-030000.sql.gz
    ├── breyus_postgres_20260302-030000.sql.gz
    └── ...                                 # Retention: 4 copies (weekly)
```

---

## 3. Disaster Recovery

**Scenario**: Server is lost. You have provisioned a new server (see [[operations/SERVER_SETUP]]) and need to restore data.

### Step 1: Stop the Application

```bash
cd /opt/app
docker compose down
```

### Step 2: Restore MongoDB

```bash
# Start only the database
docker compose up -d mongo

# Wait for it to be healthy
docker compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Restore from backup (--drop clears existing data first)
docker cp /data/backups/mongodb/breyus_mongo_YYYYMMDD-HHMMSS.archive.gz breyus_mongo:/tmp/restore.archive.gz
docker exec breyus_mongo mongorestore \
    --authenticationDatabase admin \
    -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
    --archive=/tmp/restore.archive.gz \
    --gzip --drop

# Clean up
docker exec breyus_mongo rm /tmp/restore.archive.gz
```

### Step 3: Restore PostgreSQL

Use the dedicated restore script:

```bash
# Start only the database
docker compose up -d postgres

# Restore using the script (interactive confirmation)
./scripts/db-restore.sh /data/backups/postgresql/breyus_postgres_latest.sql.gz

# Or with --drop-existing to wipe tables first
./scripts/db-restore.sh /data/backups/postgresql/breyus_postgres_latest.sql.gz --drop-existing
```

The restore script (`scripts/db-restore.sh`) supports:
- Compressed (`.sql.gz`) and uncompressed (`.sql`) files
- `--drop-existing` to clear tables before restore
- `--dry-run` to preview without executing
- `--json` for admin portal integration
- Interactive confirmation prompt (skipped in JSON mode)

### Step 4: Verify & Restart

```bash
# Start all services
docker compose up -d

# Verify MongoDB data
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin breyus --eval "db.users.countDocuments({})"

# Verify PostgreSQL data
docker exec breyus_postgres psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM trade_records;"

# Check all containers are healthy
docker ps
```

---

## 4. Offsite Backup (DigitalOcean Spaces)

For production, backups should be uploaded to DigitalOcean Spaces after creation:

```bash
# Upload MongoDB backup to Spaces
aws s3 cp /data/backups/mongodb/breyus_mongo_YYYYMMDD-HHMMSS.archive.gz \
    s3://breyus-files/backups/mongodb/ \
    --endpoint-url https://sgp1.digitaloceanspaces.com

# Upload PostgreSQL backup to Spaces
aws s3 cp /data/backups/postgresql/breyus_postgres_latest.sql.gz \
    s3://breyus-files/backups/postgresql/ \
    --endpoint-url https://sgp1.digitaloceanspaces.com
```

This can be added to the cron job after the backup command.

---

## 5. Large AI Database Considerations

The PostgreSQL AI database can be 30-40 GB:

- **Backup time**: 30-60 minutes for `pg_dump` of 40 GB
- **Compressed size**: ~5-8 GB (gzip compression)
- **Restore time**: 30-60 minutes (streaming decompression, no temp file needed)
- **Disk space**: ~32 GB for 4 weekly copies (compressed)
- **Risk**: Docker exec is local, so timeouts are not a concern

### Why Weekly (Not Daily) for PostgreSQL?

AI data is **regeneratable** from the data pipeline:
1. Raw trade CSVs are stored in Google Drive
2. Pipeline scripts normalize and load data
3. Embeddings can be regenerated (takes days for 30GB+)

Weekly backups with 4-copy retention balance storage cost against recovery speed. Regenerating from scratch takes days; restoring from a weekly backup takes under an hour.

> **Previous policy was monthly with single-copy overwrite** — changed to weekly with 4 copies because a corrupted single backup meant zero fallback. 4 copies provide 28 days of recovery points.

---

## 6. Available Scripts

| Script | Purpose | Docker Containers Used |
|--------|---------|------------------------|
| `scripts/backup.sh` | MongoDB + PostgreSQL backup | `breyus_mongo`, `breyus_postgres` |
| `scripts/db-backup.sh` | PostgreSQL-only backup | `breyus_postgres` |
| `scripts/db-restore.sh` | PostgreSQL restore | `breyus_postgres` (via `psql`) |

---

## 7. Backup Monitoring & Alerting

**Backups that aren't monitored aren't backups.** If a cron job fails silently, you won't know until you need to restore.

### Log Monitoring

Check backup logs daily (or automate with a simple script):
```bash
# Check if today's MongoDB backup exists
TODAY=$(date +%Y%m%d)
if ! ls /data/backups/mongodb/breyus_mongo_${TODAY}* 1>/dev/null 2>&1; then
  echo "ALERT: MongoDB backup missing for $TODAY" | mail -s "Breyus Backup Alert" ops@breyus.com
fi
```

### Key Alerts to Configure

| Alert | Trigger | Action |
|-------|---------|--------|
| MongoDB backup missing | No new file in `/data/backups/mongodb/` for >26 hours | Investigate cron, disk space |
| PostgreSQL backup missing | No new file in `/data/backups/postgresql/` for >8 days | Investigate cron, disk space |
| Offsite sync failed | `backup-offsite.sh` exit code ≠ 0 | Check Spaces credentials, network |
| Backup disk >80% full | `/data/backups` usage >80% | Reduce retention or expand volume |

### Admin Portal Integration

The Admin Portal (`admin.breyus.com`) Database Operations page can trigger manual backups and show backup status via `scripts/backup.sh --json`.

---

## 8. Backup Verification Procedures

**Monthly restore test** — verify backups are actually restorable:

### MongoDB Verification (Monthly)

```bash
# 1. Pick the oldest retained backup
BACKUP_FILE=$(ls -t /data/backups/mongodb/ | tail -1)

# 2. Restore to a temporary database (NOT the production one)
docker exec breyus_mongo mongorestore \
  --authenticationDatabase admin \
  -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --archive=/tmp/test_restore.archive.gz --gzip \
  --nsFrom="breyus.*" --nsTo="breyus_test.*"

# 3. Verify record counts
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus_test \
  --eval "db.getCollectionNames().forEach(c => print(c + ': ' + db[c].countDocuments({})))"

# 4. Drop test database
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --eval "db.getSiblingDB('breyus_test').dropDatabase()"
```

### PostgreSQL Verification (Quarterly)

```bash
# 1. Pick a backup file
BACKUP_FILE=$(ls -t /data/backups/postgresql/ | head -1)

# 2. Create temporary test database
docker exec breyus_postgres psql -U "$POSTGRES_USER" -c "CREATE DATABASE breyus_ai_test;"

# 3. Restore to test database
gunzip -c "/data/backups/postgresql/$BACKUP_FILE" | \
  docker exec -i breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai_test

# 4. Verify key tables
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai_test \
  -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"

# 5. Drop test database
docker exec breyus_postgres psql -U "$POSTGRES_USER" -c "DROP DATABASE breyus_ai_test;"
```

### Verification Log

Record results in the Admin Portal or a simple log file:
```
2026-03-15 MongoDB restore test: PASS (users: 1,847, trades: 5,203, products: 2,156)
2026-03-15 PostgreSQL restore test: PASS (trade_records: 4,500,000, companies: 130,620)
```

---

## Related

- [[operations/SERVER_SETUP]] — Server provisioning
- [[operations/DEPLOYMENT]] — Deployment architecture
- [[operations/CAPACITY_PLANNING]] — Storage projections
- [[operations/SECRET_MANAGEMENT]] — Secret rotation and storage
- [[operations/INCIDENT_RESPONSE]] — What to do when things break
- [[MOC-Operations]]
