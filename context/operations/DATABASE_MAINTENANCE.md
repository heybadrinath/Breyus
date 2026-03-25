---
type: operations-doc
module: operations
tags: [operations, database, maintenance, mongodb, postgresql, redis]
date: 2026-03-11
---

# Database Maintenance Runbook

> **Last Updated**: March 2026
> **Criticality**: HIGH (Prevents Performance Degradation)

---

## 1. MongoDB Maintenance

### 1.1 Index Audit (Monthly)

Unused indexes waste RAM and slow writes. Audit monthly.

```bash
# List all indexes per collection
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.getCollectionNames().forEach(c => { print('--- ' + c + ' ---'); db[c].getIndexes().forEach(i => printjson(i)) })"

# Check index usage stats (identifies unused indexes)
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.getCollectionNames().forEach(c => { print('--- ' + c + ' ---'); db[c].aggregate([{\$indexStats: {}}]).forEach(s => print(s.name + ': ' + s.accesses.ops + ' ops since ' + s.accesses.since)) })"
```

**Action:** Drop indexes with 0 ops over 30+ days (except `_id` and unique constraints):
```bash
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.collectionName.dropIndex('index_name')"
```

### 1.2 Collection Stats (Weekly)

Monitor collection growth to catch unexpected bloat.

```bash
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "
    db.getCollectionNames().forEach(c => {
      const s = db[c].stats();
      print(c + ' | docs: ' + s.count + ' | size: ' + (s.size/1024/1024).toFixed(1) + 'MB | indexes: ' + (s.totalIndexSize/1024/1024).toFixed(1) + 'MB');
    })
  "
```

**Baseline (record after first production deploy):**

| Collection | Expected Docs (Year 1) | Watch Threshold |
|------------|----------------------|-----------------|
| `users` | < 5,000 | > 10,000 |
| `trades` | < 20,000 | > 50,000 |
| `products` | < 10,000 | > 25,000 |
| `messages` | < 100,000 | > 500,000 |
| `adminactivitylogs` | < 50,000 | > 200,000 |
| `blogposts` | < 500 | > 2,000 |

### 1.3 Slow Query Detection

Enable profiling to find queries taking > 100ms:

```bash
# Enable profiling (level 1 = slow queries only)
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.setProfilingLevel(1, { slowms: 100 })"

# Review slow queries
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.system.profile.find().sort({ts: -1}).limit(10).forEach(printjson)"

# Disable profiling when done (adds overhead)
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.setProfilingLevel(0)"
```

**Common fixes for slow queries:**
1. Missing index → Create compound index matching query pattern
2. Unselective query → Add filters to reduce scan range
3. Large `$in` arrays → Restructure query or use `$lookup`

### 1.4 Connection Pool Monitoring

```bash
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval "db.serverStatus().connections"
```

**Alert thresholds:**
- `current` > 80% of `available` → Investigate connection leaks
- Mongoose default pool: 100 connections. If `current` consistently > 80, increase pool or investigate.

### 1.5 Compaction (Quarterly)

After bulk deletes (e.g., chat message archival), reclaim disk space:

```bash
# Compact a specific collection (blocks writes on that collection)
docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin breyus \
  --eval "db.runCommand({ compact: 'messages' })"
```

**Warning:** Compaction locks the collection for writes. Run during low-traffic windows only.

---

## 2. PostgreSQL Maintenance (AI Database)

### 2.1 VACUUM & ANALYZE Schedule

PostgreSQL accumulates dead tuples from updates/deletes. VACUUM reclaims space; ANALYZE updates query planner statistics.

```bash
# Manual VACUUM ANALYZE on high-churn tables
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai \
  -c "VACUUM ANALYZE trade_records;"

docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai \
  -c "VACUUM ANALYZE predicted_partners;"

# Full VACUUM (reclaims disk space, locks table — weekly during maintenance)
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai \
  -c "VACUUM FULL ANALYZE;"
```

**Automated schedule (add to crontab):**
```cron
# Daily VACUUM ANALYZE on high-churn tables (05:00 UTC)
0 5 * * * docker exec breyus_postgres psql -U postgres -d breyus_ai -c "VACUUM ANALYZE trade_records; VACUUM ANALYZE predicted_partners;" >> /var/log/breyus_pg_vacuum.log 2>&1

# Weekly VACUUM FULL (Sunday 05:00 UTC, after backups)
0 5 * * 0 docker exec breyus_postgres psql -U postgres -d breyus_ai -c "VACUUM FULL ANALYZE;" >> /var/log/breyus_pg_vacuum_full.log 2>&1
```

### 2.2 Table Bloat Detection (Monthly)

```bash
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai -c "
  SELECT relname, n_live_tup, n_dead_tup,
         CASE WHEN n_live_tup > 0
              THEN round(100.0 * n_dead_tup / n_live_tup, 1)
              ELSE 0 END AS dead_pct
  FROM pg_stat_user_tables
  ORDER BY n_dead_tup DESC;"
```

**Action:** If `dead_pct` > 20% for any table, run `VACUUM FULL` on that table.

### 2.3 pgvector Index Maintenance

Vector indexes degrade after significant data changes. Re-index after bulk embedding operations.

```bash
# Check index size and health
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai -c "
  SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) AS size
  FROM pg_stat_user_indexes
  WHERE indexrelname LIKE '%embedding%' OR indexrelname LIKE '%vector%';"

# Reindex vector indexes (after bulk data changes)
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai \
  -c "REINDEX INDEX CONCURRENTLY idx_trade_records_embedding;"
```

**When to reindex:** After loading > 10% new embeddings or after any bulk delete/update.

### 2.4 Connection Monitoring

```bash
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai -c "
  SELECT count(*) AS active_connections,
         (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
  FROM pg_stat_activity
  WHERE state = 'active';"
```

**Alert:** If `active_connections` > 80% of `max_connections`, investigate connection pooling.

### 2.5 Extension Updates (Quarterly)

```bash
# Check installed extension versions
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai \
  -c "SELECT extname, extversion FROM pg_extension;"

# Update extensions (after upgrading PostgreSQL image)
docker exec breyus_postgres psql -U "$POSTGRES_USER" -d breyus_ai \
  -c "ALTER EXTENSION vector UPDATE; ALTER EXTENSION postgis UPDATE;"
```

---

## 3. Redis Maintenance

### 3.1 Memory Usage

```bash
docker exec breyus_redis redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human|mem_fragmentation_ratio"
```

**Healthy values:**
- `mem_fragmentation_ratio` between 1.0 and 1.5 (> 2.0 = fragmentation issue)
- `used_memory` well below `maxmemory` (if set)

### 3.2 Key Audit (Monthly)

Ensure no unbounded key growth (all keys should have TTLs):

```bash
# Count keys by prefix pattern
docker exec breyus_redis redis-cli --scan --pattern "otp:*" | wc -l
docker exec breyus_redis redis-cli --scan --pattern "session:*" | wc -l
docker exec breyus_redis redis-cli --scan --pattern "analysis:*" | wc -l

# Find keys without TTL (potential memory leak)
docker exec breyus_redis redis-cli --scan | while read key; do
  ttl=$(docker exec breyus_redis redis-cli TTL "$key")
  if [ "$ttl" = "-1" ]; then echo "NO TTL: $key"; fi
done
```

**Action:** All Breyus keys should have TTLs. If keys without TTL are found, investigate the code path that created them.

### 3.3 Persistence Check

If AOF or RDB is enabled (check `redis.conf`):

```bash
docker exec breyus_redis redis-cli INFO persistence | grep -E "rdb_last_save_time|aof_enabled|aof_last_rewrite_status"
```

**Note:** For Breyus, Redis is ephemeral (OTPs, job status). Persistence is optional. If enabled, verify it's working; if not, that's fine.

---

## 4. Automated Maintenance Script

Create `scripts/db-maintenance.sh` for scheduled maintenance:

```bash
#!/bin/bash
# Database maintenance — run weekly via cron
# Usage: ./scripts/db-maintenance.sh [--mongo] [--postgres] [--redis] [--all]

set -euo pipefail
LOG="/var/log/breyus_db_maintenance.log"
echo "=== DB Maintenance $(date -u '+%Y-%m-%d %H:%M UTC') ===" >> "$LOG"

run_mongo() {
  echo "[MongoDB] Collection stats:" >> "$LOG"
  docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin breyus --quiet \
    --eval "db.getCollectionNames().forEach(c => { const s = db[c].stats(); print(c + ': ' + s.count + ' docs, ' + (s.size/1024/1024).toFixed(1) + 'MB') })" >> "$LOG" 2>&1

  echo "[MongoDB] Connection count:" >> "$LOG"
  docker exec breyus_mongo mongosh -u "$MONGO_ROOT_USERNAME" -p "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin --quiet \
    --eval "const c = db.serverStatus().connections; print('current: ' + c.current + '/' + c.available)" >> "$LOG" 2>&1
}

run_postgres() {
  echo "[PostgreSQL] VACUUM ANALYZE:" >> "$LOG"
  docker exec breyus_postgres psql -U postgres -d breyus_ai \
    -c "VACUUM ANALYZE;" >> "$LOG" 2>&1

  echo "[PostgreSQL] Table stats:" >> "$LOG"
  docker exec breyus_postgres psql -U postgres -d breyus_ai \
    -c "SELECT relname, n_live_tup, n_dead_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" >> "$LOG" 2>&1
}

run_redis() {
  echo "[Redis] Memory:" >> "$LOG"
  docker exec breyus_redis redis-cli INFO memory | grep "used_memory_human" >> "$LOG" 2>&1

  echo "[Redis] Key count:" >> "$LOG"
  docker exec breyus_redis redis-cli DBSIZE >> "$LOG" 2>&1
}

case "${1:---all}" in
  --mongo) run_mongo ;;
  --postgres) run_postgres ;;
  --redis) run_redis ;;
  --all) run_mongo; run_postgres; run_redis ;;
esac

echo "=== Maintenance complete ===" >> "$LOG"
```

**Cron schedule:**
```cron
# Weekly maintenance report (Monday 06:00 UTC)
0 6 * * 1 /opt/app/scripts/db-maintenance.sh --all >> /var/log/breyus_db_maintenance.log 2>&1
```

---

## 5. Performance Baselines

Record these values after production deploy. Deviations indicate issues.

| Metric | "Normal" Range | Investigate If |
|--------|---------------|----------------|
| MongoDB `current` connections | 5–30 | > 80 |
| MongoDB avg query time | < 50ms | > 200ms |
| MongoDB total index size | < 500MB | > 2GB |
| PostgreSQL `n_dead_tup` ratio | < 10% | > 20% |
| PostgreSQL active connections | 2–10 | > 40 |
| PostgreSQL embedding index size | 1–5GB | > 15GB |
| Redis `used_memory` | < 50MB | > 200MB |
| Redis `mem_fragmentation_ratio` | 1.0–1.5 | > 2.0 |

**Note:** These are estimates for Year 1 at MVP scale (< 5,000 users). Update baselines quarterly as usage patterns emerge.

---

## Related

- [[operations/BACKUP_AND_RECOVERY]] — Backup strategy and restore procedures
- [[operations/CAPACITY_PLANNING]] — Storage and scaling projections
- [[operations/MONITORING_AND_ALERTING]] — Unified monitoring strategy
- [[operations/PRODUCTION_HARDENING]] — Security and reliability hardening
- [[MOC-Operations]]
