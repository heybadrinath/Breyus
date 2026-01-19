# Docker Commands - Quick Reference

**Last Updated:** 2026-01-19

Quick reference for Docker operations during development. For pipeline commands, see **PIPELINE.md**.

---

## Build Optimization (BuildKit)

The AI server Dockerfile uses **BuildKit** features for faster builds. BuildKit provides:
- **Pip cache mounts** - Reuses downloaded packages across builds (~30-60s saved)
- **Multi-stage builds** - Smaller final images (~500MB smaller)
- **CPU-only PyTorch** - Downloads ~200MB instead of ~2GB

### Enable BuildKit

```bash
# Option 1: Set environment variable (recommended)
export DOCKER_BUILDKIT=1

# Option 2: Use per-command prefix
DOCKER_BUILDKIT=1 docker-compose build

# Option 3: Enable globally in Docker daemon config
# Add to ~/.docker/daemon.json (or Docker Desktop settings):
# { "features": { "buildkit": true } }
```

### Build Commands with BuildKit

```bash
# Build with BuildKit caching (FASTEST for rebuilds)
DOCKER_BUILDKIT=1 docker-compose build

# Build specific service
DOCKER_BUILDKIT=1 docker-compose build ai-service

# Build and run in one command
DOCKER_BUILDKIT=1 docker-compose up -d --build

# Force rebuild without cache (clean build)
DOCKER_BUILDKIT=1 docker-compose build --no-cache
```

### Build Time Comparison

| Build Type | Without BuildKit | With BuildKit |
|------------|------------------|---------------|
| Fresh build (no cache) | ~4-5 min | ~2-3 min |
| Rebuild (deps unchanged) | ~4-5 min | ~30 sec |
| Code-only change | ~2-3 min | ~20 sec |

---

## Container Management

### Start/Stop Services

```bash
# Start all services (Postgres + Redis + AI Server)
docker-compose up -d

# Start and rebuild containers (with BuildKit)
DOCKER_BUILDKIT=1 docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart ai-server
docker-compose restart postgres
docker-compose restart redis
```

### Check Status

```bash
# Check container status
docker-compose ps

# Expected output:
# NAME                 IMAGE                COMMAND                  SERVICE     CREATED        STATUS
# breyus_ai_postgres   breyus_ai_postgres   "docker-entrypoint.s…"   postgres    43 hours ago   Up 10 minutes (healthy)
# breyus_ai_redis      redis:7-alpine       "docker-entrypoint.s…"   redis       43 hours ago   Up 10 minutes (healthy)
# breyus_ai_server     ai_new-ai-server     "uvicorn server.main…"   ai-server   43 hours ago   Up 10 minutes (unhealthy)

# Check individual service health
docker-compose ps postgres
docker-compose ps redis
docker-compose ps ai-server
```

---

## Accessing Containers

### AI Server Container

```bash
# Enter AI server container (interactive bash)
docker-compose exec ai-server bash

# You'll see: root@f1f5d1bccaed:/app#

# Run single command without entering
docker-compose exec ai-server python -m pipeline.scripts.cli status

# Exit container
exit
```

### PostgreSQL Container

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d breyus_ai

# You'll see: breyus_ai=#

# Run single SQL query
docker-compose exec postgres psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM companies;"

# Check if Postgres is ready
docker compose exec postgres pg_isready

# Exit PostgreSQL CLI
\q
```

### Redis Container

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# You'll see: 127.0.0.1:6379>

# Run single Redis command
docker-compose exec redis redis-cli KEYS "*"

# Exit Redis CLI
exit
```

---

## Viewing Logs

### Real-Time Logs

```bash
# Follow logs for all services
docker-compose logs -f

# Follow logs for specific service
docker-compose logs -f ai-server
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop following logs: Ctrl+C
```

### Recent Logs

```bash
# Last 50 lines from all services
docker-compose logs --tail=50

# Last 100 lines from AI server
docker-compose logs --tail=100 ai-server

# Last 200 lines from Postgres
docker-compose logs --tail=200 postgres
```

### Save Logs to File

```bash
# Export AI server logs
docker-compose logs ai-server > ai-server-logs.txt

# Export all logs
docker-compose logs > all-logs.txt

# Export logs with timestamps
docker-compose logs -t ai-server > ai-server-logs-timestamped.txt
```

---

## Database Operations

### Apply Migrations

```bash
# Apply AI cache migration to an existing database
docker compose exec -T postgres psql -U postgres -d breyus_ai < shared/db/migrations/001_add_ai_cache_tables.sql
```

### Quick Queries

```bash
# Count records in all tables
docker compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT
  'companies' as table, COUNT(*) as count FROM companies
UNION ALL
SELECT 'trade_records', COUNT(*) FROM trade_records
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'trade_links', COUNT(*) FROM trade_links
UNION ALL
SELECT 'predicted_partners', COUNT(*) FROM predicted_partners;
"

# Check import status
docker compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT status, COUNT(*) as files, SUM(rows_imported) as total_rows
FROM data_import_log
GROUP BY status;
"

# View recent imports
docker compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT file_name, rows_imported, status, completed_at
FROM data_import_log
ORDER BY created_at DESC
LIMIT 200;
"

# Check database size
docker compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT pg_size_pretty(pg_database_size('breyus_ai')) as size;
"

# Check table sizes (largest first)
docker compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT
  relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
"

# Check database activity/status
docker compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT
  datname,
  numbackends AS connections,
  xact_commit,
  xact_rollback,
  blks_hit,
  blks_read,
  tup_returned,
  tup_fetched,
  tup_inserted,
  tup_updated,
  tup_deleted
FROM pg_stat_database
WHERE datname = 'breyus_ai';
"

# List all tables
docker compose exec postgres psql -U postgres -d breyus_ai -c "\dt"

# Describe table structure
docker compose exec postgres psql -U postgres -d breyus_ai -c "\d companies"

# embed list
docker compose exec postgres psql -U postgres -d breyus_ai -c "SELECT count(*) FROM trade_records WHERE product_embedding IS NOT NULL;"
```

### Database Backup

```bash
# Backup database to file
docker-compose exec postgres pg_dump -U postgres breyus_ai > backup.sql

# Backup with timestamp
docker-compose exec postgres pg_dump -U postgres breyus_ai > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup only schema (no data)
docker-compose exec postgres pg_dump -U postgres --schema-only breyus_ai > schema-backup.sql
```

### Database Restore

```bash
# Restore from backup (database must exist)
docker-compose exec -T postgres psql -U postgres -d breyus_ai < backup.sql

# Drop and recreate database before restore
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS breyus_ai;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE breyus_ai;"
docker-compose exec -T postgres psql -U postgres -d breyus_ai < backup.sql
```

---

## Redis Operations

### Check Keys

```bash
# List all keys
docker-compose exec redis redis-cli KEYS "*"

# Count total keys
docker-compose exec redis redis-cli DBSIZE

# Get specific key value
docker-compose exec redis redis-cli GET "job:abc123"

# Delete specific key
docker-compose exec redis redis-cli DEL "job:abc123"

# Flush all keys (DANGEROUS!)
docker-compose exec redis redis-cli FLUSHALL
```

### Check Memory

```bash
# Redis memory stats
docker-compose exec redis redis-cli INFO memory

# Redis server stats
docker-compose exec redis redis-cli INFO server
```

---

## File Operations

### Copy Files to Container

```bash
# Copy file from host to AI server container
docker cp /path/on/host/file.xlsx breyus_ai_server:/app/raw_data/

# Copy directory from host to container
docker cp /path/on/host/folder breyus_ai_server:/app/raw_data/

# Copy to Postgres container
docker cp backup.sql breyus_ai_postgres:/tmp/
```

### Copy Files from Container

```bash
# Copy file from AI server to host
docker cp breyus_ai_server:/app/pipeline/manifest.json ./manifest.json

# Copy entire directory
docker cp breyus_ai_server:/app/pipeline/errors ./errors-backup
```

### View Files in Container

```bash
# List files in AI server container
docker-compose exec ai-server ls -lh /app/raw_data

# Check directory size
docker-compose exec ai-server du -sh /app/raw_data
docker-compose exec ai-server du -sh /app/pipeline/csv

# Find files
docker-compose exec ai-server find /app/raw_data -name "*.xlsx"

# View file content
docker-compose exec ai-server cat /app/pipeline/manifest.json
```

---

## Health Checks

### AI Server Health

```bash
# Check AI server health endpoint
curl -s http://localhost:8000/health | python -m json.tool

# Quick health check (just status code)
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:8000/health
# Should return: 200

# Access API documentation
# Open in browser: http://localhost:8000/docs
```

### Service Health

```bash
# Check all services are healthy
docker-compose ps | grep healthy

# Check if Postgres is accepting connections
docker compose exec postgres pg_isready -U postgres
# Should return: /var/run/postgresql:5432 - accepting connections

# Check if Redis is responding
docker-compose exec redis redis-cli PING
# Should return: PONG
```

---

## Resource Monitoring

### Container Stats

```bash
# Real-time resource usage (all containers)
docker stats

# Stats for specific container
docker stats breyus_ai_server

# One-time stats snapshot
docker stats --no-stream

# Expected output:
# CONTAINER ID   NAME                CPU %     MEM USAGE / LIMIT     MEM %     NET I/O
# f1f5d1bccaed   breyus_ai_server    0.50%     256MiB / 8GiB        3.20%     1.2MB / 800kB
```

### Disk Usage

```bash
# Check Docker disk usage
docker system df

# Detailed disk usage
docker system df -v

# Check volume sizes
docker volume ls
docker volume inspect breyus_ai_postgres_data
```

---

## Cleanup Operations

### Remove Stopped Containers

```bash
# Remove all stopped containers
docker container prune -f

# Remove all unused images
docker image prune -a -f

# Remove all unused volumes
docker volume prune -f

# Clean everything unused
docker system prune -a -f --volumes
```

### Reset Specific Service

```bash
# Reset AI server (rebuild)
docker-compose stop ai-server
docker-compose rm -f ai-server
docker-compose up -d ai-server

# Reset database (DESTROYS DATA!)
docker-compose stop postgres
docker volume rm breyus_ai_postgres_data
docker-compose up -d postgres
```

### Complete Reset

```bash
# NUCLEAR OPTION - Removes everything
docker-compose down -v
docker system prune -a -f --volumes
docker-compose up -d --build

# Wait for services to start
sleep 30

# Verify health
curl http://localhost:8000/health
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check container logs for errors
docker-compose logs ai-server

# Check if port is already in use
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000

# Try rebuilding
docker-compose down
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check if Postgres is running
docker-compose ps postgres

# Check Postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1;"

# Restart Postgres
docker-compose restart postgres
```

### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Free up space
docker system prune -a -f --volumes

# Check volume sizes
docker volume ls -q | xargs docker volume inspect | grep -A 5 Name
```

### Container Stuck/Frozen

```bash
# Force stop container
docker-compose kill ai-server

# Force remove
docker-compose rm -f ai-server

# Restart
docker-compose up -d ai-server
```

### Network Issues

```bash
# Recreate network
docker-compose down
docker network prune -f
docker-compose up -d

# List networks
docker network ls

# Inspect network
docker network inspect breyus_ai_network
```

---

## Development Workflows

### Quick Restart After Code Changes

```bash
# Restart AI server only (fast)
docker-compose restart ai-server

# Rebuild AI server (if dependencies changed)
docker-compose up -d --build ai-server

# Watch logs after restart
docker-compose logs -f ai-server
```

### Reset Database for Testing

```bash
# Enter container and run reset
docker-compose exec ai-server bash
cd /app
python -m pipeline.scripts.cli reset --yes --skip-files

# Or one-liner from host
docker-compose exec ai-server python -m pipeline.scripts.cli reset --yes --skip-files
```

### Check Environment Variables

```bash
# View all env vars in AI server
docker-compose exec ai-server env

# Check specific env var
docker-compose exec ai-server env | grep POSTGRES
docker-compose exec ai-server env | grep REDIS

# Check .env file is loaded
docker-compose config
```

### Update Docker Compose File

```bash
# After editing docker-compose.yml, validate it
docker-compose config

# Apply changes (recreate containers)
docker-compose up -d

# Force recreate even if no changes detected
docker-compose up -d --force-recreate
```

---

## Port Access

### Service Ports (from Host)

```bash
# AI Server
curl http://localhost:8000/health

# PostgreSQL
psql -h localhost -p 5432 -U postgres -d breyus_ai

# Redis
redis-cli -h localhost -p 6379

# Check if ports are open
# Windows:
netstat -ano | findstr :8000
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Linux/Mac:
lsof -i :8000
lsof -i :5432
lsof -i :6379
```

---

## Quick Command Reference

```bash
# === BUILD (with BuildKit) ===
DOCKER_BUILDKIT=1 docker-compose build            # Build with caching (fast)
DOCKER_BUILDKIT=1 docker-compose build ai-service # Build AI service only

# === START/STOP ===
docker-compose up -d                              # Start all
DOCKER_BUILDKIT=1 docker-compose up -d --build    # Build + Start all
docker-compose down                               # Stop all
docker-compose restart                            # Restart all
docker-compose down -v                            # Stop + remove volumes

# === ACCESS ===
docker-compose exec ai-server bash                # Enter AI server
docker-compose exec postgres psql -U postgres -d breyus_ai  # Enter Postgres
docker-compose exec redis redis-cli               # Enter Redis

# === LOGS ===
docker-compose logs -f ai-server                  # Follow AI server logs
docker-compose logs --tail=100 postgres           # Last 100 Postgres logs

# === STATUS ===
docker-compose ps                                 # Container status
docker stats                                      # Resource usage
curl http://localhost:8000/health                 # AI server health

# === DATABASE ===
docker-compose exec postgres psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM companies;"

# === CLEANUP ===
docker system prune -a -f                         # Clean unused resources
docker-compose down -v && docker-compose up -d --build  # Full reset

# === COPY FILES ===
docker cp file.xlsx breyus_ai_server:/app/raw_data/     # Host → Container
docker cp breyus_ai_server:/app/manifest.json ./        # Container → Host
```

---

## Related Documentation

- **PIPELINE.md** - Complete pipeline command reference
- **QUICKSTART.md** - Initial setup guide
- **AI_TASKS.md** - Implementation status

---

**Quick Start:**

```bash
docker-compose up -d
docker-compose logs -f ai-server
docker-compose exec ai-server bash
```

**Quick Stop:**

```bash
docker-compose down
```

**Quick Reset:**

```bash
docker-compose down -v
DOCKER_BUILDKIT=1 docker-compose up -d --build
```
