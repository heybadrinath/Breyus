#!/usr/bin/env bash
# =============================================================================
# Breyus Log Rotation Script
# =============================================================================
# Rotates and manages Docker container logs.
#
# What it does:
#   1. Truncates Docker container log files to reduce disk usage
#   2. Creates archived copies before truncation (optional)
#   3. Works with all Breyus containers
#
# Usage:
#   ./scripts/rotate-logs.sh [options]
#
# Options:
#   --container NAME  Rotate logs for specific container only
#   --all             Rotate logs for all Breyus containers (default)
#   --archive         Create timestamped archive before truncating
#   --max-size SIZE   Only rotate logs larger than SIZE (e.g., 100M, 1G)
#   --retention DAYS  Keep archived logs for N days (default: 7)
#   --output-dir DIR  Archive directory (default: /data/logs or ./logs)
#   --json            Output JSON for admin portal integration
#   --dry-run         Show what would be done without doing it
#   --help            Show this help message
#
# Note: Docker's native log rotation via daemon.json is preferred for production.
#       This script is for manual cleanup and on-demand rotation.
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
ROTATE_ALL=true
SPECIFIC_CONTAINER=""
CREATE_ARCHIVE=true
MAX_SIZE_BYTES=0  # 0 means no size check, rotate all
RETENTION_DAYS=7
JSON_OUTPUT=false
DRY_RUN=false

# Breyus container prefix
CONTAINER_PREFIX="breyus_"

# Determine log archive directory
if [[ -d "/data/logs" ]]; then
    LOG_ARCHIVE_DIR="/data/logs"
else
    LOG_ARCHIVE_DIR="$PROJECT_ROOT/logs/archived"
fi

# Parse size to bytes
parse_size() {
    local size="$1"
    local number="${size%[KMGkmg]*}"
    local unit="${size##*[0-9]}"

    case "${unit^^}" in
        K) echo $((number * 1024)) ;;
        M) echo $((number * 1024 * 1024)) ;;
        G) echo $((number * 1024 * 1024 * 1024)) ;;
        *) echo "$number" ;;
    esac
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --container)
            ROTATE_ALL=false
            SPECIFIC_CONTAINER="$2"
            shift 2
            ;;
        --all)
            ROTATE_ALL=true
            shift
            ;;
        --archive)
            CREATE_ARCHIVE=true
            shift
            ;;
        --no-archive)
            CREATE_ARCHIVE=false
            shift
            ;;
        --max-size)
            MAX_SIZE_BYTES=$(parse_size "$2")
            shift 2
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --output-dir)
            LOG_ARCHIVE_DIR="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
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

# Check Docker access
check_docker() {
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed or not in PATH"
        return 1
    fi

    if ! docker ps &> /dev/null; then
        log "ERROR" "Cannot connect to Docker daemon. Are you root or in docker group?"
        return 1
    fi

    return 0
}

# Get container log file path
get_log_path() {
    local container="$1"
    docker inspect --format='{{.LogPath}}' "$container" 2>/dev/null || echo ""
}

# Get log file size in bytes
get_log_size() {
    local log_path="$1"
    if [[ -f "$log_path" ]]; then
        stat -f%z "$log_path" 2>/dev/null || stat -c%s "$log_path" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Human readable size
human_size() {
    local bytes="$1"
    if [[ $bytes -ge 1073741824 ]]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc)G"
    elif [[ $bytes -ge 1048576 ]]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc)M"
    elif [[ $bytes -ge 1024 ]]; then
        echo "$(echo "scale=2; $bytes/1024" | bc)K"
    else
        echo "${bytes}B"
    fi
}

# Rotate logs for a container
rotate_container_logs() {
    local container="$1"
    local log_path=$(get_log_path "$container")

    if [[ -z "$log_path" || ! -f "$log_path" ]]; then
        log "WARN" "No log file found for $container"
        return 0
    fi

    local log_size=$(get_log_size "$log_path")
    local log_size_human=$(human_size "$log_size")

    # Check if log exceeds max size threshold
    if [[ $MAX_SIZE_BYTES -gt 0 && $log_size -lt $MAX_SIZE_BYTES ]]; then
        log "INFO" "Skipping $container (${log_size_human} < threshold)"
        return 0
    fi

    log "INFO" "Processing $container (${log_size_human})"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY-RUN] Would rotate $container log"
        echo "$container|$log_size_human|dry-run"
        return 0
    fi

    # Create archive if requested
    if [[ "$CREATE_ARCHIVE" == "true" ]]; then
        mkdir -p "$LOG_ARCHIVE_DIR"
        local timestamp=$(date +%Y%m%d-%H%M%S)
        local archive_file="$LOG_ARCHIVE_DIR/${container}_${timestamp}.log.gz"

        log "INFO" "Archiving to $(basename "$archive_file")"
        if gzip -c "$log_path" > "$archive_file"; then
            local archive_size=$(human_size $(get_log_size "$archive_file"))
            log "OK" "Archived: $(basename "$archive_file") ($archive_size)"
        else
            log "WARN" "Failed to create archive, continuing with truncation"
        fi
    fi

    # Truncate the log file
    # Docker expects the file to exist, so we truncate rather than delete
    if truncate -s 0 "$log_path" 2>/dev/null || cat /dev/null > "$log_path" 2>/dev/null; then
        log "OK" "Truncated log for $container (freed ${log_size_human})"
        echo "$container|$log_size_human|rotated"
        return 0
    else
        log "ERROR" "Failed to truncate log for $container (permission denied?)"
        echo "$container|$log_size_human|failed"
        return 1
    fi
}

# Cleanup old archived logs
cleanup_old_archives() {
    if [[ "$RETENTION_DAYS" -le 0 ]]; then
        log "INFO" "Archive retention disabled"
        return 0
    fi

    if [[ ! -d "$LOG_ARCHIVE_DIR" ]]; then
        return 0
    fi

    log "INFO" "Cleaning up archives older than $RETENTION_DAYS days..."

    local deleted_count=0
    while IFS= read -r -d '' file; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "[DRY-RUN] Would delete: $(basename "$file")"
        else
            rm -f "$file"
            log "INFO" "Deleted: $(basename "$file")"
        fi
        ((deleted_count++))
    done < <(find "$LOG_ARCHIVE_DIR" -name "*.log.gz" -type f -mtime +"$RETENTION_DAYS" -print0 2>/dev/null || true)

    if [[ $deleted_count -gt 0 ]]; then
        log "OK" "Cleaned up $deleted_count old archive(s)"
    else
        log "INFO" "No old archives to clean up"
    fi
}

# Get list of Breyus containers
get_breyus_containers() {
    docker ps --format '{{.Names}}' | grep "^${CONTAINER_PREFIX}" | sort
}

# Main function
main() {
    local start_time=$(date +%s)
    local exit_code=0
    local rotated_count=0
    local failed_count=0
    local total_freed=0
    local results=()

    log "INFO" "============================================"
    log "INFO" "Breyus Log Rotation - Started"
    if [[ "$DRY_RUN" == "true" ]]; then
        log "WARN" "DRY-RUN MODE - No changes will be made"
    fi
    log "INFO" "============================================"

    # Check Docker access
    if ! check_docker; then
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo '{"status": "error", "message": "Docker not accessible"}'
        fi
        exit 1
    fi

    # Get containers to process
    local containers=()
    if [[ "$ROTATE_ALL" == "true" ]]; then
        while IFS= read -r container; do
            containers+=("$container")
        done < <(get_breyus_containers)
    else
        if [[ -n "$SPECIFIC_CONTAINER" ]]; then
            containers+=("$SPECIFIC_CONTAINER")
        fi
    fi

    if [[ ${#containers[@]} -eq 0 ]]; then
        log "WARN" "No Breyus containers found"
        if [[ "$JSON_OUTPUT" == "true" ]]; then
            echo '{"status": "warning", "message": "No containers found", "containers_processed": 0}'
        fi
        exit 0
    fi

    log "INFO" "Found ${#containers[@]} container(s) to process"
    log "INFO" "Archive directory: $LOG_ARCHIVE_DIR"
    log "INFO" "============================================"

    # Process each container
    for container in "${containers[@]}"; do
        local result
        if result=$(rotate_container_logs "$container"); then
            if [[ -n "$result" ]]; then
                results+=("$result")
                if [[ "$result" == *"|rotated" ]]; then
                    ((rotated_count++))
                fi
            fi
        else
            ((failed_count++))
            exit_code=1
        fi
    done

    # Cleanup old archives
    cleanup_old_archives

    local duration=$(($(date +%s) - start_time))

    log "INFO" "============================================"
    log "INFO" "Rotation Summary:"
    log "INFO" "  Containers processed: ${#containers[@]}"
    log "INFO" "  Logs rotated: $rotated_count"
    log "INFO" "  Failed: $failed_count"
    log "INFO" "  Duration: ${duration}s"
    log "INFO" "============================================"

    # JSON output for admin portal
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        local status="success"
        [[ $failed_count -gt 0 ]] && status="partial"
        [[ $failed_count -eq ${#containers[@]} ]] && status="error"

        cat <<EOF
{
  "status": "$status",
  "message": "Log rotation completed",
  "timestamp": "$(date -Iseconds)",
  "duration_seconds": $duration,
  "summary": {
    "containers_processed": ${#containers[@]},
    "logs_rotated": $rotated_count,
    "failed": $failed_count
  },
  "details": [
$(for i in "${!results[@]}"; do
    IFS='|' read -r name size status <<< "${results[$i]}"
    echo "    {\"container\": \"$name\", \"size\": \"$size\", \"status\": \"$status\"}$( [[ $i -lt $((${#results[@]}-1)) ]] && echo ",")"
done)
  ]
}
EOF
    fi

    exit $exit_code
}

main
