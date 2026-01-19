#!/usr/bin/env bash
# =============================================================================
# AI Fetch Raw Data - Download from Google Drive
# =============================================================================
# Fetches normalized CSV files from Google Drive to local pipeline/normalized/
#
# Usage:
#   ./scripts/ai-fetch-raw-data.sh [options]
#
# Options:
#   --dry-run       Show what would be downloaded without executing
#   --json          Output JSON for admin portal integration
#   --help          Show this help message
#
# Environment:
#   Requires AI_NEW/.env with Google Drive credentials:
#   - GDRIVE_FOLDER_ID
#   - GDRIVE_CLIENT_ID
#   - GDRIVE_CLIENT_SECRET
#   - GDRIVE_REFRESH_TOKEN
#
# Output:
#   Downloads new normalized files and updates DB manifest
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"
LOG_FILE="$AI_DIR/logs/fetch-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
DRY_RUN=false
JSON_OUTPUT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --help|-h)
            head -25 "$0" | tail -20
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

    echo "{\"status\": \"$status\", \"message\": \"$message\", \"details\": $details, \"timestamp\": \"$(date -Iseconds)\"}"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    if [[ ! -d "$AI_DIR" ]]; then
        log "ERROR" "AI_NEW directory not found: $AI_DIR"
        return 1
    fi

    if [[ ! -f "$AI_DIR/.env" ]]; then
        log "ERROR" "Environment file not found: $AI_DIR/.env"
        return 1
    fi

    if ! command -v python &> /dev/null; then
        log "ERROR" "Python not found in PATH"
        return 1
    fi

    # Check Drive credentials
    set -a
    source "$AI_DIR/.env"
    set +a

    local missing_vars=()
    [[ -z "${GDRIVE_FOLDER_ID:-}" ]] && missing_vars+=("GDRIVE_FOLDER_ID")
    [[ -z "${GDRIVE_CLIENT_ID:-}" ]] && missing_vars+=("GDRIVE_CLIENT_ID")
    [[ -z "${GDRIVE_CLIENT_SECRET:-}" ]] && missing_vars+=("GDRIVE_CLIENT_SECRET")
    [[ -z "${GDRIVE_REFRESH_TOKEN:-}" ]] && missing_vars+=("GDRIVE_REFRESH_TOKEN")

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "ERROR" "Missing Google Drive credentials: ${missing_vars[*]}"
        log "INFO" "Run 'python -m pipeline.scripts.cli drive-auth' to set up credentials"
        return 1
    fi

    log "OK" "Prerequisites check passed"
    return 0
}

# Run fetch
run_fetch() {
    log "INFO" "Fetching normalized data from Google Drive..."

    set -a
    source "$AI_DIR/.env"
    set +a

    cd "$AI_DIR"

    local cmd="python -m pipeline.scripts.cli fetch-from-drive"
    [[ "$DRY_RUN" == "true" ]] && cmd="$cmd --dry-run"

    log "INFO" "Executing: $cmd"

    if $cmd 2>&1 | tee -a "$LOG_FILE"; then
        log "OK" "Fetch completed successfully"
        return 0
    else
        log "ERROR" "Fetch failed"
        return 1
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    local exit_code=0

    log "INFO" "============================================"
    log "INFO" "AI Fetch Raw Data - Started"
    log "INFO" "============================================"

    if ! check_prerequisites; then
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            output_json "error" "Prerequisites check failed" "{}"
        fi
        exit 1
    fi

    if ! run_fetch; then
        exit_code=1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "INFO" "Fetch finished in ${duration}s"

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            output_json "success" "Fetch completed" "{\"duration_seconds\": $duration}"
        else
            output_json "error" "Fetch failed" "{\"duration_seconds\": $duration}"
        fi
    fi

    exit $exit_code
}

main
