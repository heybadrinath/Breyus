#!/usr/bin/env bash
# =============================================================================
# Database Backup - PostgreSQL Backup Utility
# =============================================================================
# Creates compressed backups of the AI PostgreSQL database.
# Supports automatic cleanup of old backups.
#
# Usage:
#   ./scripts/db-backup.sh [options]
#
# Options:
#   --output-dir DIR    Directory to store backups (default: AI_NEW/backups)
#   --keep DAYS         Keep backups for N days, delete older (default: 30)
#   --no-compress       Skip gzip compression
#   --tables-only       Backup only data tables (skip schema)
#   --schema-only       Backup only schema (no data)
#   --json              Output JSON for admin portal integration
#   --help              Show this help message
#
# Environment:
#   Requires AI_NEW/.env with PostgreSQL credentials:
#   - POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB
#   - POSTGRES_USER, POSTGRES_PASSWORD
#
# Output:
#   Creates timestamped backup file in output directory
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"
DEFAULT_BACKUP_DIR="$AI_DIR/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default options
OUTPUT_DIR="$DEFAULT_BACKUP_DIR"
KEEP_DAYS=30
COMPRESS=true
TABLES_ONLY=false
SCHEMA_ONLY=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --keep)
            KEEP_DAYS="$2"
            shift 2
            ;;
        --no-compress)
            COMPRESS=false
            shift
            ;;
        --tables-only)
            TABLES_ONLY=true
            shift
            ;;
        --schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --help|-h)
            head -30 "$0" | tail -25
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log() {
    local level="$1"
    local message="$2"

    if [[ "$JSON_OUTPUT" == "false" ]]; then
        case $level in
            INFO)  echo -e "${BLUE}[$level]${NC} $message" ;;
            OK)    echo -e "${GREEN}[$level]${NC} $message" ;;
            WARN)  echo -e "${YELLOW}[$level]${NC} $message" ;;
            ERROR) echo -e "${RED}[$level]${NC} $message" ;;
            *)     echo "[$level] $message" ;;
        esac
    fi
}

output_json() {
    local status="$1"
    local message="$2"
    local details="${3:-{}}"
    echo "{\"status\": \"$status\", \"message\": \"$message\", \"details\": $details, \"timestamp\": \"$(date -Iseconds)\"}"
}

check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    if [[ ! -f "$AI_DIR/.env" ]]; then
        log "ERROR" "Environment file not found: $AI_DIR/.env"
        return 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        log "ERROR" "pg_dump not found. Install PostgreSQL client tools."
        return 1
    fi

    # Load environment
    set -a
    source "$AI_DIR/.env"
    set +a

    # Check required variables
    local missing_vars=()
    [[ -z "${POSTGRES_HOST:-}" ]] && missing_vars+=("POSTGRES_HOST")
    [[ -z "${POSTGRES_DB:-}" ]] && missing_vars+=("POSTGRES_DB")
    [[ -z "${POSTGRES_USER:-}" ]] && missing_vars+=("POSTGRES_USER")
    [[ -z "${POSTGRES_PASSWORD:-}" ]] && missing_vars+=("POSTGRES_PASSWORD")

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    log "OK" "Prerequisites check passed"
    return 0
}

run_backup() {
    log "INFO" "Starting PostgreSQL backup..."

    set -a
    source "$AI_DIR/.env"
    set +a

    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_name="breyus_ai_${timestamp}"

    # Add suffix based on backup type
    [[ "$TABLES_ONLY" == "true" ]] && backup_name="${backup_name}_data"
    [[ "$SCHEMA_ONLY" == "true" ]] && backup_name="${backup_name}_schema"

    local backup_file="$OUTPUT_DIR/${backup_name}.sql"
    [[ "$COMPRESS" == "true" ]] && backup_file="${backup_file}.gz"

    # Build pg_dump command
    local pg_dump_opts=()
    pg_dump_opts+=("-h" "${POSTGRES_HOST}")
    pg_dump_opts+=("-p" "${POSTGRES_PORT:-5432}")
    pg_dump_opts+=("-U" "${POSTGRES_USER}")
    pg_dump_opts+=("-d" "${POSTGRES_DB}")
    pg_dump_opts+=("--no-password")

    [[ "$TABLES_ONLY" == "true" ]] && pg_dump_opts+=("--data-only")
    [[ "$SCHEMA_ONLY" == "true" ]] && pg_dump_opts+=("--schema-only")

    log "INFO" "Backing up database: ${POSTGRES_DB}"
    log "INFO" "Output file: $backup_file"

    # Set password via environment
    export PGPASSWORD="${POSTGRES_PASSWORD}"

    local start_time=$(date +%s)

    if [[ "$COMPRESS" == "true" ]]; then
        if pg_dump "${pg_dump_opts[@]}" | gzip > "$backup_file"; then
            log "OK" "Backup completed with compression"
        else
            log "ERROR" "Backup failed"
            unset PGPASSWORD
            return 1
        fi
    else
        if pg_dump "${pg_dump_opts[@]}" > "$backup_file"; then
            log "OK" "Backup completed"
        else
            log "ERROR" "Backup failed"
            unset PGPASSWORD
            return 1
        fi
    fi

    unset PGPASSWORD

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local file_size=$(du -h "$backup_file" | cut -f1)

    log "INFO" "Backup size: $file_size"
    log "INFO" "Duration: ${duration}s"

    # Return backup info for JSON output
    echo "$backup_file|$file_size|$duration"
}

cleanup_old_backups() {
    if [[ "$KEEP_DAYS" -le 0 ]]; then
        log "INFO" "Backup retention disabled (--keep 0)"
        return 0
    fi

    log "INFO" "Cleaning up backups older than $KEEP_DAYS days..."

    local deleted_count=0

    while IFS= read -r -d '' file; do
        rm -f "$file"
        log "INFO" "Deleted: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$OUTPUT_DIR" -name "breyus_ai_*.sql*" -type f -mtime +"$KEEP_DAYS" -print0 2>/dev/null || true)

    if [[ $deleted_count -gt 0 ]]; then
        log "OK" "Cleaned up $deleted_count old backup(s)"
    else
        log "INFO" "No old backups to clean up"
    fi
}

main() {
    local start_time=$(date +%s)
    local exit_code=0
    local backup_info=""

    log "INFO" "============================================"
    log "INFO" "Database Backup - Started"
    log "INFO" "============================================"

    if ! check_prerequisites; then
        [[ "$JSON_OUTPUT" == "true" ]] && output_json "error" "Prerequisites check failed" "{}"
        exit 1
    fi

    # Run backup and capture info
    backup_info=$(run_backup) || exit_code=1

    if [[ $exit_code -eq 0 ]]; then
        cleanup_old_backups
    fi

    local duration=$(($(date +%s) - start_time))

    log "INFO" "============================================"
    log "INFO" "Backup finished in ${duration}s"
    log "INFO" "============================================"

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            local backup_file=$(echo "$backup_info" | cut -d'|' -f1)
            local file_size=$(echo "$backup_info" | cut -d'|' -f2)
            output_json "success" "Backup completed" "{\"file\": \"$backup_file\", \"size\": \"$file_size\", \"duration_seconds\": $duration}"
        else
            output_json "error" "Backup failed" "{\"duration_seconds\": $duration}"
        fi
    fi

    exit $exit_code
}

main
