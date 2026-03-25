#!/usr/bin/env bash
# =============================================================================
# Breyus Platform Backup Script
# =============================================================================
# Creates backups of MongoDB and PostgreSQL databases.
#
# Backup Strategy:
#   - MongoDB: Versioned backups with timestamps (configurable retention)
#   - PostgreSQL: Single copy (overwrites previous - AI data is regeneratable)
#
# Usage:
#   ./scripts/backup.sh [options]
#
# Options:
#   --mongo-only      Backup only MongoDB
#   --postgres-only   Backup only PostgreSQL
#   --all             Backup both databases (default)
#   --retention DAYS  Keep MongoDB backups for N days (default: 7)
#   --output-dir DIR  Backup directory (default: /data/backups or ./backups)
#   --json            Output JSON for admin portal integration
#   --help            Show this help message
#
# Environment Variables (from docker/.env or environment):
#   MongoDB: MONGO_ROOT_USERNAME, MONGO_ROOT_PASSWORD, MONGO_HOST
#   PostgreSQL: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DB
#
# Storage:
#   Currently: Local Docker volume (/data/backups)
#   Production: Offsite to DigitalOcean Spaces (see backup-offsite.sh)
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default options
BACKUP_MONGO=true
BACKUP_POSTGRES=true
RETENTION_DAYS=7
JSON_OUTPUT=false

# Determine backup directory
# In Docker: /data/backups (mounted volume)
# Local dev: ./backups in project root
if [[ -d "/data/backups" ]]; then
    BACKUP_DIR="/data/backups"
else
    BACKUP_DIR="$PROJECT_ROOT/backups"
fi

# MongoDB connection defaults (can be overridden by environment)
MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-breyus}"
MONGO_USER="${MONGO_ROOT_USERNAME:-breyus}"
MONGO_PASS="${MONGO_ROOT_PASSWORD:-breyus_secret}"

# PostgreSQL connection defaults
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-breyus_ai}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASS="${POSTGRES_PASSWORD:-postgres}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mongo-only)
            BACKUP_MONGO=true
            BACKUP_POSTGRES=false
            shift
            ;;
        --postgres-only)
            BACKUP_MONGO=false
            BACKUP_POSTGRES=true
            shift
            ;;
        --all)
            BACKUP_MONGO=true
            BACKUP_POSTGRES=true
            shift
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --output-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --help|-h)
            head -35 "$0" | tail -30
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log() {
    local level="$1"
    local message="$2"

    if [[ "$JSON_OUTPUT" == "false" ]]; then
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        case $level in
            INFO)  echo -e "${BLUE}[$timestamp][$level]${NC} $message" ;;
            OK)    echo -e "${GREEN}[$timestamp][$level]${NC} $message" ;;
            WARN)  echo -e "${YELLOW}[$timestamp][$level]${NC} $message" ;;
            ERROR) echo -e "${RED}[$timestamp][$level]${NC} $message" ;;
            *)     echo "[$timestamp][$level] $message" ;;
        esac
    fi
}

output_json() {
    local status="$1"
    local message="$2"
    local mongo_file="${3:-null}"
    local postgres_file="${4:-null}"
    local mongo_size="${5:-null}"
    local postgres_size="${6:-null}"
    local duration="${7:-0}"

    cat <<EOF
{
  "status": "$status",
  "message": "$message",
  "timestamp": "$(date -Iseconds)",
  "duration_seconds": $duration,
  "backups": {
    "mongodb": {
      "file": $mongo_file,
      "size": $mongo_size
    },
    "postgresql": {
      "file": $postgres_file,
      "size": $postgres_size
    }
  }
}
EOF
}

# Check if running inside Docker or has access to containers
check_docker_access() {
    if command -v docker &> /dev/null; then
        if docker ps &> /dev/null; then
            return 0
        fi
    fi
    return 1
}

# Create backup directory structure
setup_backup_dir() {
    log "INFO" "Setting up backup directory: $BACKUP_DIR"

    mkdir -p "$BACKUP_DIR/mongodb"
    mkdir -p "$BACKUP_DIR/postgresql"

    log "OK" "Backup directories ready"
}

# Backup MongoDB with versioning
backup_mongodb() {
    log "INFO" "Starting MongoDB backup..."

    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/mongodb/breyus_mongo_${timestamp}.archive"
    local start_time=$(date +%s)

    # Check if we can use docker exec or direct mongodump
    if check_docker_access && docker ps --format '{{.Names}}' | grep -q "breyus_mongo"; then
        log "INFO" "Using Docker exec for MongoDB backup"

        # Run mongodump inside the container
        if docker exec breyus_mongo mongodump \
            --authenticationDatabase admin \
            -u "$MONGO_USER" \
            -p "$MONGO_PASS" \
            --db "$MONGO_DB" \
            --archive="/tmp/backup.archive" \
            --gzip 2>/dev/null; then

            # Copy the backup file out of the container
            docker cp breyus_mongo:/tmp/backup.archive "$backup_file.gz"
            docker exec breyus_mongo rm -f /tmp/backup.archive

            backup_file="$backup_file.gz"
        else
            log "ERROR" "MongoDB backup failed"
            return 1
        fi
    elif command -v mongodump &> /dev/null; then
        log "INFO" "Using local mongodump"

        if mongodump \
            --host "$MONGO_HOST" \
            --port "$MONGO_PORT" \
            --authenticationDatabase admin \
            -u "$MONGO_USER" \
            -p "$MONGO_PASS" \
            --db "$MONGO_DB" \
            --archive="$backup_file" \
            --gzip 2>/dev/null; then

            backup_file="$backup_file.gz"
        else
            log "ERROR" "MongoDB backup failed"
            return 1
        fi
    else
        log "ERROR" "Neither Docker nor mongodump available"
        return 1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local file_size=$(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "unknown")

    log "OK" "MongoDB backup completed: $(basename "$backup_file") ($file_size) in ${duration}s"

    # Return backup info
    echo "$backup_file|$file_size|$duration"
}

# Backup PostgreSQL (single copy - overwrites previous)
backup_postgresql() {
    log "INFO" "Starting PostgreSQL backup (single copy mode)..."

    local backup_file="$BACKUP_DIR/postgresql/breyus_postgres_latest.sql.gz"
    local temp_file="$BACKUP_DIR/postgresql/breyus_postgres_latest.sql.gz.tmp"
    local start_time=$(date +%s)

    # Remove old temp file if exists
    rm -f "$temp_file"

    # Check if we can use docker exec or direct pg_dump
    if check_docker_access && docker ps --format '{{.Names}}' | grep -q "breyus_postgres"; then
        log "INFO" "Using Docker exec for PostgreSQL backup"

        # Run pg_dump inside the container
        if docker exec -e PGPASSWORD="$POSTGRES_PASS" breyus_postgres \
            pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$temp_file"; then

            # Atomic move to final location
            mv "$temp_file" "$backup_file"
        else
            rm -f "$temp_file"
            log "ERROR" "PostgreSQL backup failed"
            return 1
        fi
    elif command -v pg_dump &> /dev/null; then
        log "INFO" "Using local pg_dump"

        export PGPASSWORD="$POSTGRES_PASS"
        if pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$temp_file"; then
            mv "$temp_file" "$backup_file"
        else
            rm -f "$temp_file"
            unset PGPASSWORD
            log "ERROR" "PostgreSQL backup failed"
            return 1
        fi
        unset PGPASSWORD
    else
        log "ERROR" "Neither Docker nor pg_dump available"
        return 1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local file_size=$(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "unknown")

    # Record backup timestamp
    echo "$(date -Iseconds)" > "$BACKUP_DIR/postgresql/last_backup.txt"

    log "OK" "PostgreSQL backup completed: $(basename "$backup_file") ($file_size) in ${duration}s"

    # Return backup info
    echo "$backup_file|$file_size|$duration"
}

# Cleanup old MongoDB backups
cleanup_old_backups() {
    if [[ "$RETENTION_DAYS" -le 0 ]]; then
        log "INFO" "Backup retention disabled (--retention 0)"
        return 0
    fi

    log "INFO" "Cleaning up MongoDB backups older than $RETENTION_DAYS days..."

    local deleted_count=0

    # Find and delete old MongoDB backups
    while IFS= read -r -d '' file; do
        rm -f "$file"
        log "INFO" "Deleted: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR/mongodb" -name "breyus_mongo_*.archive*" -type f -mtime +"$RETENTION_DAYS" -print0 2>/dev/null || true)

    if [[ $deleted_count -gt 0 ]]; then
        log "OK" "Cleaned up $deleted_count old MongoDB backup(s)"
    else
        log "INFO" "No old backups to clean up"
    fi
}

# Main function
main() {
    local start_time=$(date +%s)
    local exit_code=0
    local mongo_info=""
    local postgres_info=""

    log "INFO" "============================================"
    log "INFO" "Breyus Backup - Started"
    log "INFO" "============================================"
    log "INFO" "Backup directory: $BACKUP_DIR"
    log "INFO" "MongoDB backup: $BACKUP_MONGO"
    log "INFO" "PostgreSQL backup: $BACKUP_POSTGRES"
    log "INFO" "Retention: $RETENTION_DAYS days"
    log "INFO" "============================================"

    # Setup directories
    setup_backup_dir

    # Run MongoDB backup
    if [[ "$BACKUP_MONGO" == "true" ]]; then
        mongo_info=$(backup_mongodb) || exit_code=1
    fi

    # Run PostgreSQL backup
    if [[ "$BACKUP_POSTGRES" == "true" ]]; then
        postgres_info=$(backup_postgresql) || exit_code=1
    fi

    # Cleanup old MongoDB backups
    if [[ "$BACKUP_MONGO" == "true" && $exit_code -eq 0 ]]; then
        cleanup_old_backups
    fi

    local duration=$(($(date +%s) - start_time))

    log "INFO" "============================================"
    if [[ $exit_code -eq 0 ]]; then
        log "OK" "Backup completed successfully in ${duration}s"
    else
        log "ERROR" "Backup completed with errors in ${duration}s"
    fi
    log "INFO" "============================================"

    # JSON output for admin portal
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        local mongo_file="null"
        local mongo_size="null"
        local postgres_file="null"
        local postgres_size="null"

        if [[ -n "$mongo_info" ]]; then
            mongo_file="\"$(echo "$mongo_info" | cut -d'|' -f1)\""
            mongo_size="\"$(echo "$mongo_info" | cut -d'|' -f2)\""
        fi

        if [[ -n "$postgres_info" ]]; then
            postgres_file="\"$(echo "$postgres_info" | cut -d'|' -f1)\""
            postgres_size="\"$(echo "$postgres_info" | cut -d'|' -f2)\""
        fi

        if [[ $exit_code -eq 0 ]]; then
            output_json "success" "Backup completed successfully" "$mongo_file" "$postgres_file" "$mongo_size" "$postgres_size" "$duration"
        else
            output_json "error" "Backup completed with errors" "$mongo_file" "$postgres_file" "$mongo_size" "$postgres_size" "$duration"
        fi
    fi

    exit $exit_code
}

main
