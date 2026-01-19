#!/usr/bin/env bash
# =============================================================================
# AI Manifest Status - Check Pipeline File Status
# =============================================================================
# Displays the current status of the pipeline file manifest from PostgreSQL.
# Shows counts by status, recent files, and any failed files with errors.
#
# Usage:
#   ./scripts/ai-manifest-status.sh [options]
#
# Options:
#   --json          Output JSON for admin portal integration
#   --verbose       Show detailed file information
#   --failed        Show only failed files with error messages
#   --help          Show this help message
#
# Environment:
#   Requires AI_NEW/.env with PostgreSQL credentials
#
# Output:
#   Summary of manifest status including counts and recent activity
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_DIR="$PROJECT_ROOT/AI_NEW"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default options
JSON_OUTPUT=false
VERBOSE=false
FAILED_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --failed)
            FAILED_ONLY=true
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

# Check prerequisites
check_prerequisites() {
    if [[ ! -d "$AI_DIR" ]]; then
        echo -e "${RED}[ERROR]${NC} AI_NEW directory not found: $AI_DIR"
        exit 1
    fi

    if [[ ! -f "$AI_DIR/.env" ]]; then
        echo -e "${RED}[ERROR]${NC} Environment file not found: $AI_DIR/.env"
        exit 1
    fi

    if ! command -v python &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Python not found in PATH"
        exit 1
    fi
}

# Run status check via Python CLI
run_status() {
    set -a
    source "$AI_DIR/.env"
    set +a

    cd "$AI_DIR"

    local cmd="python -m pipeline.scripts.cli manifest-status"
    [[ "$VERBOSE" == "true" ]] && cmd="$cmd --verbose"
    [[ "$FAILED_ONLY" == "true" ]] && cmd="$cmd --failed"

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        # Capture output and wrap in JSON
        local output
        output=$($cmd 2>&1) || true
        local exit_code=$?

        if [[ $exit_code -eq 0 ]]; then
            echo "{\"status\": \"success\", \"output\": $(echo "$output" | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))'), \"timestamp\": \"$(date -Iseconds)\"}"
        else
            echo "{\"status\": \"error\", \"output\": $(echo "$output" | python -c 'import json,sys; print(json.dumps(sys.stdin.read()))'), \"timestamp\": \"$(date -Iseconds)\"}"
        fi
    else
        # Normal output with formatting
        echo -e "${BOLD}${BLUE}============================================${NC}"
        echo -e "${BOLD}${BLUE}   AI Pipeline Manifest Status${NC}"
        echo -e "${BOLD}${BLUE}============================================${NC}"
        echo ""

        $cmd

        echo ""
        echo -e "${CYAN}Timestamp:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    fi
}

# Main execution
main() {
    check_prerequisites
    run_status
}

main
