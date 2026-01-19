#!/usr/bin/env bash
# =============================================================================
# AI Upload to Drive - Upload Normalized Files (Local Use)
# =============================================================================
# Uploads normalized CSV files from local pipeline/normalized/ to Google Drive
#
# Usage:
#   ./scripts/ai-upload-to-drive.sh [options]
#
# Options:
#   --dry-run       Show what would be uploaded without executing
#   --json          Output JSON for admin portal integration
#   --help          Show this help message
#
# Environment:
#   Requires AI_NEW/.env with Google Drive credentials
#
# Note:
#   This script is typically used on the LOCAL development machine,
#   not on the VPS server.
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"
LOG_FILE="$AI_DIR/logs/upload-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Options
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
            head -22 "$0" | tail -17
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

output_json() {
    local status="$1"
    local message="$2"
    local details="${3:-{}}"
    echo "{\"status\": \"$status\", \"message\": \"$message\", \"details\": $details, \"timestamp\": \"$(date -Iseconds)\"}"
}

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

    # Check for normalized files
    local normalized_dir="$AI_DIR/pipeline/normalized"
    if [[ ! -d "$normalized_dir" ]] || [[ -z "$(ls -A "$normalized_dir"/*.csv 2>/dev/null)" ]]; then
        log "WARN" "No normalized CSV files found in $normalized_dir"
    fi

    log "OK" "Prerequisites check passed"
    return 0
}

run_upload() {
    log "INFO" "Uploading normalized files to Google Drive..."

    set -a
    source "$AI_DIR/.env"
    set +a

    cd "$AI_DIR"

    local cmd="python -m pipeline.scripts.cli upload-to-drive"
    [[ "$DRY_RUN" == "true" ]] && cmd="$cmd --dry-run"

    log "INFO" "Executing: $cmd"

    if $cmd 2>&1 | tee -a "$LOG_FILE"; then
        log "OK" "Upload completed successfully"
        return 0
    else
        log "ERROR" "Upload failed"
        return 1
    fi
}

main() {
    local start_time=$(date +%s)
    local exit_code=0

    log "INFO" "============================================"
    log "INFO" "AI Upload to Drive - Started"
    log "INFO" "============================================"

    if ! check_prerequisites; then
        [[ "$JSON_OUTPUT" == "true" ]] && output_json "error" "Prerequisites check failed" "{}"
        exit 1
    fi

    if ! run_upload; then
        exit_code=1
    fi

    local duration=$(($(date +%s) - start_time))
    log "INFO" "Upload finished in ${duration}s"

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            output_json "success" "Upload completed" "{\"duration_seconds\": $duration}"
        else
            output_json "error" "Upload failed" "{\"duration_seconds\": $duration}"
        fi
    fi

    exit $exit_code
}

main
