#!/usr/bin/env bash
# =============================================================================
# Database Restore - PostgreSQL Restore Utility
# =============================================================================
# Restores a PostgreSQL database from a backup file created by db-backup.sh.
# Supports both compressed (.gz) and uncompressed (.sql) backup files.
#
# Usage:
#   ./scripts/db-restore.sh <backup-file> [options]
#
# Arguments:
#   backup-file         Path to backup file (.sql or .sql.gz)
#
# Options:
#   --drop-existing     Drop existing tables before restore (DANGEROUS)
#   --dry-run           Show what would be done without executing
#   --json              Output JSON for admin portal integration
#   --help              Show this help message
#
# Environment:
#   Requires AI_NEW/.env with PostgreSQL credentials
#
# WARNING:
#   This operation will OVERWRITE existing data! Use with caution.
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Default options
BACKUP_FILE=""
DROP_EXISTING=false
DRY_RUN=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --drop-existing)
            DROP_EXISTING=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
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
        -*)
            echo "Unknown option: $1"
            exit 1
            ;;
        *)
            if [[ -z "$BACKUP_FILE" ]]; then
                BACKUP_FILE="$1"
            else
                echo "Error: Multiple backup files specified"
                exit 1
            fi
            shift
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

    # Check backup file specified
    if [[ -z "$BACKUP_FILE" ]]; then
        log "ERROR" "No backup file specified"
        log "INFO" "Usage: $0 <backup-file> [options]"
        return 1
    fi

    # Check backup file exists
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log "ERROR" "Backup file not found: $BACKUP_FILE"
        return 1
    fi

    # Check file extension
    if [[ ! "$BACKUP_FILE" =~ \.(sql|sql\.gz)$ ]]; then
        log "ERROR" "Invalid backup file format. Expected .sql or .sql.gz"
        return 1
    fi

    if [[ ! -f "$AI_DIR/.env" ]]; then
        log "ERROR" "Environment file not found: $AI_DIR/.env"
        return 1
    fi

    if ! command -v psql &> /dev/null; then
        log "ERROR" "psql not found. Install PostgreSQL client tools."
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

    log "OK" "Prerequisites check passed"
    return 0
}

confirm_restore() {
    if [[ "$JSON_OUTPUT" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi

    echo ""
    echo -e "${BOLD}${YELLOW}WARNING: Database Restore${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo -e "Database: ${BOLD}${POSTGRES_DB}${NC}"
    echo -e "Host: ${BOLD}${POSTGRES_HOST}${NC}"
    echo -e "Backup file: ${BOLD}$(basename "$BACKUP_FILE")${NC}"

    if [[ "$DROP_EXISTING" == "true" ]]; then
        echo -e "${RED}${BOLD}DROP EXISTING TABLES: YES${NC}"
    fi

    echo ""
    echo -e "${YELLOW}This will OVERWRITE existing data!${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r response

    if [[ "$response" != "yes" ]]; then
        log "INFO" "Restore cancelled by user"
        exit 0
    fi
}

run_restore() {
    log "INFO" "Starting database restore..."

    set -a
    source "$AI_DIR/.env"
    set +a

    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "INFO" "Backup file: $(basename "$BACKUP_FILE") ($file_size)"
    log "INFO" "Target database: ${POSTGRES_DB} @ ${POSTGRES_HOST}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would restore from: $BACKUP_FILE"
        log "INFO" "[DRY RUN] To database: ${POSTGRES_DB}"
        [[ "$DROP_EXISTING" == "true" ]] && log "INFO" "[DRY RUN] Would drop existing tables first"
        return 0
    fi

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    local psql_opts=()
    psql_opts+=("-h" "${POSTGRES_HOST}")
    psql_opts+=("-p" "${POSTGRES_PORT:-5432}")
    psql_opts+=("-U" "${POSTGRES_USER}")
    psql_opts+=("-d" "${POSTGRES_DB}")
    psql_opts+=("--no-password")
    psql_opts+=("-v" "ON_ERROR_STOP=1")

    local start_time=$(date +%s)

    # Drop existing tables if requested
    if [[ "$DROP_EXISTING" == "true" ]]; then
        log "WARN" "Dropping existing tables..."

        # Get list of tables and drop them
        local drop_sql="DO \$\$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END \$\$;"

        if ! echo "$drop_sql" | psql "${psql_opts[@]}" > /dev/null 2>&1; then
            log "ERROR" "Failed to drop existing tables"
            unset PGPASSWORD
            return 1
        fi

        log "OK" "Existing tables dropped"
    fi

    # Restore from backup
    log "INFO" "Restoring database..."

    local restore_status=0
    if [[ "$BACKUP_FILE" =~ \.gz$ ]]; then
        if gunzip -c "$BACKUP_FILE" | psql "${psql_opts[@]}" > /dev/null 2>&1; then
            log "OK" "Restore completed (from compressed backup)"
        else
            log "ERROR" "Restore failed"
            restore_status=1
        fi
    else
        if psql "${psql_opts[@]}" < "$BACKUP_FILE" > /dev/null 2>&1; then
            log "OK" "Restore completed"
        else
            log "ERROR" "Restore failed"
            restore_status=1
        fi
    fi

    unset PGPASSWORD

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "INFO" "Duration: ${duration}s"

    # Return restore info for JSON output
    echo "$duration|$restore_status"
    return $restore_status
}

main() {
    local start_time=$(date +%s)
    local exit_code=0

    log "INFO" "============================================"
    log "INFO" "Database Restore - Started"
    log "INFO" "============================================"

    if ! check_prerequisites; then
        [[ "$JSON_OUTPUT" == "true" ]] && output_json "error" "Prerequisites check failed" "{}"
        exit 1
    fi

    confirm_restore

    local restore_info
    restore_info=$(run_restore) || exit_code=1

    local duration=$(($(date +%s) - start_time))

    log "INFO" "============================================"
    log "INFO" "Restore finished in ${duration}s"
    log "INFO" "============================================"

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            output_json "success" "Restore completed" "{\"backup_file\": \"$(basename "$BACKUP_FILE")\", \"duration_seconds\": $duration}"
        else
            output_json "error" "Restore failed" "{\"backup_file\": \"$(basename "$BACKUP_FILE")\", \"duration_seconds\": $duration}"
        fi
    fi

    exit $exit_code
}

main
