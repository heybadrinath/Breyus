#!/usr/bin/env bash
# =============================================================================
# AI Database Migrate - Apply Schema Migrations
# =============================================================================
# Applies SQL schema files to the PostgreSQL database.
# Runs migration scripts from AI_NEW/shared/db/ directory.
#
# Usage:
#   ./scripts/ai-db-migrate.sh [options]
#
# Options:
#   --schema-only       Only run schema.sql (tables, indexes)
#   --file FILE         Run a specific SQL file
#   --dry-run           Show what would be done without executing
#   --force             Skip confirmation prompt
#   --json              Output JSON for admin portal integration
#   --help              Show this help message
#
# Environment:
#   Requires AI_NEW/.env with PostgreSQL credentials
#
# Migration Files:
#   - AI_NEW/shared/db/schema.sql - Main schema (tables, indexes)
#   - AI_NEW/shared/db/*.sql - Additional migrations
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"
SCHEMA_DIR="$AI_DIR/shared/db"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Default options
SCHEMA_ONLY=false
SPECIFIC_FILE=""
DRY_RUN=false
FORCE=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        --file)
            SPECIFIC_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
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

    if [[ ! -d "$SCHEMA_DIR" ]]; then
        log "ERROR" "Schema directory not found: $SCHEMA_DIR"
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

    # Check if specific file exists
    if [[ -n "$SPECIFIC_FILE" ]]; then
        if [[ ! -f "$SPECIFIC_FILE" ]]; then
            # Try relative to schema dir
            if [[ -f "$SCHEMA_DIR/$SPECIFIC_FILE" ]]; then
                SPECIFIC_FILE="$SCHEMA_DIR/$SPECIFIC_FILE"
            else
                log "ERROR" "SQL file not found: $SPECIFIC_FILE"
                return 1
            fi
        fi
    fi

    log "OK" "Prerequisites check passed"
    return 0
}

get_migration_files() {
    local files=()

    if [[ -n "$SPECIFIC_FILE" ]]; then
        files+=("$SPECIFIC_FILE")
    elif [[ "$SCHEMA_ONLY" == "true" ]]; then
        if [[ -f "$SCHEMA_DIR/schema.sql" ]]; then
            files+=("$SCHEMA_DIR/schema.sql")
        fi
    else
        # Run schema.sql first, then any other SQL files
        if [[ -f "$SCHEMA_DIR/schema.sql" ]]; then
            files+=("$SCHEMA_DIR/schema.sql")
        fi

        # Add other SQL files (excluding schema.sql)
        while IFS= read -r -d '' file; do
            if [[ "$(basename "$file")" != "schema.sql" ]]; then
                files+=("$file")
            fi
        done < <(find "$SCHEMA_DIR" -maxdepth 1 -name "*.sql" -type f -print0 2>/dev/null | sort -z)
    fi

    echo "${files[@]}"
}

confirm_migration() {
    if [[ "$JSON_OUTPUT" == "true" ]] || [[ "$DRY_RUN" == "true" ]] || [[ "$FORCE" == "true" ]]; then
        return 0
    fi

    local files
    read -ra files <<< "$(get_migration_files)"

    echo ""
    echo -e "${BOLD}${YELLOW}Database Migration${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo -e "Database: ${BOLD}${POSTGRES_DB}${NC}"
    echo -e "Host: ${BOLD}${POSTGRES_HOST}${NC}"
    echo ""
    echo -e "Files to apply:"
    for file in "${files[@]}"; do
        echo -e "  - $(basename "$file")"
    done
    echo ""
    read -p "Continue with migration? (yes/no): " -r response

    if [[ "$response" != "yes" ]]; then
        log "INFO" "Migration cancelled by user"
        exit 0
    fi
}

run_migration() {
    log "INFO" "Starting database migration..."

    set -a
    source "$AI_DIR/.env"
    set +a

    local files
    read -ra files <<< "$(get_migration_files)"

    if [[ ${#files[@]} -eq 0 ]]; then
        log "WARN" "No migration files found"
        return 0
    fi

    log "INFO" "Found ${#files[@]} migration file(s)"

    export PGPASSWORD="${POSTGRES_PASSWORD}"

    local psql_opts=()
    psql_opts+=("-h" "${POSTGRES_HOST}")
    psql_opts+=("-p" "${POSTGRES_PORT:-5432}")
    psql_opts+=("-U" "${POSTGRES_USER}")
    psql_opts+=("-d" "${POSTGRES_DB}")
    psql_opts+=("--no-password")

    local start_time=$(date +%s)
    local success_count=0
    local fail_count=0
    local failed_files=()

    for file in "${files[@]}"; do
        local filename=$(basename "$file")

        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "[DRY RUN] Would apply: $filename"
            ((success_count++))
            continue
        fi

        log "INFO" "Applying: $filename"

        if psql "${psql_opts[@]}" -f "$file" > /dev/null 2>&1; then
            log "OK" "Applied: $filename"
            ((success_count++))
        else
            log "ERROR" "Failed: $filename"
            ((fail_count++))
            failed_files+=("$filename")
        fi
    done

    unset PGPASSWORD

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "INFO" "Duration: ${duration}s"
    log "INFO" "Results: $success_count succeeded, $fail_count failed"

    # Return migration info for JSON output
    local failed_json="[]"
    if [[ ${#failed_files[@]} -gt 0 ]]; then
        failed_json=$(printf '%s\n' "${failed_files[@]}" | jq -R . | jq -s .)
    fi
    echo "$success_count|$fail_count|$duration|$failed_json"

    [[ $fail_count -gt 0 ]] && return 1
    return 0
}

main() {
    local start_time=$(date +%s)
    local exit_code=0

    log "INFO" "============================================"
    log "INFO" "AI Database Migration - Started"
    log "INFO" "============================================"

    if ! check_prerequisites; then
        [[ "$JSON_OUTPUT" == "true" ]] && output_json "error" "Prerequisites check failed" "{}"
        exit 1
    fi

    confirm_migration

    local migration_info
    migration_info=$(run_migration) || exit_code=1

    local duration=$(($(date +%s) - start_time))

    log "INFO" "============================================"
    log "INFO" "Migration finished in ${duration}s"
    log "INFO" "============================================"

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        local success_count=$(echo "$migration_info" | cut -d'|' -f1)
        local fail_count=$(echo "$migration_info" | cut -d'|' -f2)
        local failed_files=$(echo "$migration_info" | cut -d'|' -f4)

        if [[ $exit_code -eq 0 ]]; then
            output_json "success" "Migration completed" "{\"files_applied\": $success_count, \"files_failed\": $fail_count, \"duration_seconds\": $duration}"
        else
            output_json "error" "Migration failed" "{\"files_applied\": $success_count, \"files_failed\": $fail_count, \"failed_files\": $failed_files, \"duration_seconds\": $duration}"
        fi
    fi

    exit $exit_code
}

main
