#!/usr/bin/env bash
# =============================================================================
# AI Full Pipeline - VPS Data Sync
# =============================================================================
# Runs the complete AI data sync pipeline:
# 1. Fetch normalized files from Google Drive
# 2. Insert into PostgreSQL database
# 3. Retry any failed files
#
# Usage:
#   ./scripts/ai-full-pipeline.sh [options]
#
# Options:
#   --skip-fetch    Skip Google Drive fetch step
#   --skip-retry    Skip retry step for failed files
#   --dry-run       Show what would be done without executing
#   --help          Show this help message
#
# Environment:
#   Requires AI_NEW/.env with PostgreSQL and Google Drive credentials
#
# Output:
#   Returns JSON status for admin portal integration
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"
LOG_FILE="$AI_DIR/logs/pipeline-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_FETCH=false
SKIP_RETRY=false
DRY_RUN=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-fetch)
            SKIP_FETCH=true
            shift
            ;;
        --skip-retry)
            SKIP_RETRY=true
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
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"

    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

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

# JSON output function
output_json() {
    local status="$1"
    local message="$2"
    local details="${3:-{}}"

    echo "{\"status\": \"$status\", \"message\": \"$message\", \"details\": $details, \"timestamp\": \"$(date -Iseconds)\", \"log_file\": \"$LOG_FILE\"}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Check AI_NEW directory exists
    if [[ ! -d "$AI_DIR" ]]; then
        log "ERROR" "AI_NEW directory not found: $AI_DIR"
        return 1
    fi

    # Check .env file exists
    if [[ ! -f "$AI_DIR/.env" ]]; then
        log "ERROR" "Environment file not found: $AI_DIR/.env"
        return 1
    fi

    # Check Python is available
    if ! command -v python &> /dev/null; then
        log "ERROR" "Python not found in PATH"
        return 1
    fi

    # Check required environment variables (load .env first)
    set -a
    source "$AI_DIR/.env"
    set +a

    local missing_vars=()
    [[ -z "${POSTGRES_HOST:-}" ]] && missing_vars+=("POSTGRES_HOST")
    [[ -z "${POSTGRES_DB:-}" ]] && missing_vars+=("POSTGRES_DB")
    [[ -z "${GDRIVE_FOLDER_ID:-}" ]] && missing_vars+=("GDRIVE_FOLDER_ID")
    [[ -z "${GDRIVE_REFRESH_TOKEN:-}" ]] && missing_vars+=("GDRIVE_REFRESH_TOKEN")

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi

    log "OK" "Prerequisites check passed"
    return 0
}

# Main pipeline execution
run_pipeline() {
    log "INFO" "Starting AI full pipeline..."
    log "INFO" "Options: skip-fetch=$SKIP_FETCH, skip-retry=$SKIP_RETRY, dry-run=$DRY_RUN"

    # Load environment
    set -a
    source "$AI_DIR/.env"
    set +a

    cd "$AI_DIR"

    # Build command
    local cmd="python -m pipeline.scripts.cli vps-sync"
    [[ "$SKIP_FETCH" == "true" ]] && cmd="$cmd --skip-fetch"
    [[ "$SKIP_RETRY" == "true" ]] && cmd="$cmd --skip-retry"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would execute: $cmd"
        return 0
    fi

    # Execute pipeline
    log "INFO" "Executing: $cmd"

    if $cmd 2>&1 | tee -a "$LOG_FILE"; then
        log "OK" "Pipeline completed successfully"
        return 0
    else
        log "ERROR" "Pipeline failed"
        return 1
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    local exit_code=0

    log "INFO" "============================================"
    log "INFO" "AI Full Pipeline - Started"
    log "INFO" "============================================"

    # Check prerequisites
    if ! check_prerequisites; then
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            output_json "error" "Prerequisites check failed" "{}"
        fi
        exit 1
    fi

    # Run pipeline
    if ! run_pipeline; then
        exit_code=1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "INFO" "============================================"
    log "INFO" "Pipeline finished in ${duration}s"
    log "INFO" "============================================"

    # JSON output for admin portal
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            output_json "success" "Pipeline completed successfully" "{\"duration_seconds\": $duration}"
        else
            output_json "error" "Pipeline failed" "{\"duration_seconds\": $duration}"
        fi
    fi

    exit $exit_code
}

# Run main
main
