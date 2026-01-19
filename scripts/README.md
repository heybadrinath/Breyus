# Scripts Overview

This folder contains operational scripts for managing the Breyus platform on VPS.
Scripts can be called by the admin portal or manually on the server.

## Safety Notes
- Treat all scripts as privileged. Expose only allowlisted operations to the UI.
- Return structured output (JSON via `--json`) when wiring to the admin portal.
- Enforce strict parameter validation for anything user-supplied.

---

## AI Data Pipeline Scripts

### ai-full-pipeline.sh
**Status:** Implemented

Runs the complete AI data sync pipeline on VPS:
1. Fetch normalized files from Google Drive
2. Insert into PostgreSQL database
3. Retry any failed files

```bash
./scripts/ai-full-pipeline.sh [options]

Options:
  --skip-fetch    Skip Google Drive fetch step
  --skip-retry    Skip retry step for failed files
  --dry-run       Show what would be done without executing
  --json          Output JSON for admin portal integration
  --help          Show help message
```

**Environment:** Requires `AI_NEW/.env` with PostgreSQL and Google Drive credentials.

---

### ai-fetch-raw-data.sh
**Status:** Implemented

Fetches normalized CSV files from Google Drive to local `pipeline/normalized/` directory.

```bash
./scripts/ai-fetch-raw-data.sh [options]

Options:
  --dry-run       Show what would be downloaded without executing
  --json          Output JSON for admin portal integration
  --help          Show help message
```

**Environment:** Requires `AI_NEW/.env` with Google Drive credentials:
- `GDRIVE_FOLDER_ID`
- `GDRIVE_CLIENT_ID`
- `GDRIVE_CLIENT_SECRET`
- `GDRIVE_REFRESH_TOKEN`

---

### ai-upload-to-drive.sh
**Status:** Implemented (Local Use)

Uploads normalized CSV files from local `pipeline/normalized/` to Google Drive.
Typically used on the LOCAL development machine after running `run-all-pending`.

```bash
./scripts/ai-upload-to-drive.sh [options]

Options:
  --dry-run       Show what would be uploaded without executing
  --json          Output JSON for admin portal integration
  --help          Show help message
```

**Note:** This script is intended for local development machine, not VPS.

---

### ai-manifest-status.sh
**Status:** Implemented

Displays the current status of the pipeline file manifest from PostgreSQL.
Shows file counts by status, recent files, and any failed files with errors.

```bash
./scripts/ai-manifest-status.sh [options]

Options:
  --verbose       Show detailed file information
  --failed        Show only failed files with error messages
  --json          Output JSON for admin portal integration
  --help          Show help message
```

---

### ai-db-migrate.sh
**Status:** Implemented

Applies SQL schema files to the PostgreSQL database.
Runs migration scripts from `AI_NEW/shared/db/` directory.

```bash
./scripts/ai-db-migrate.sh [options]

Options:
  --schema-only   Only run schema.sql (tables, indexes)
  --file FILE     Run a specific SQL file
  --dry-run       Show what would be done without executing
  --force         Skip confirmation prompt
  --json          Output JSON for admin portal integration
  --help          Show help message
```

**Migration Files:**
- `AI_NEW/shared/db/schema.sql` - Main schema (tables, indexes)
- `AI_NEW/shared/db/*.sql` - Additional migrations

---

## Database Scripts

### db-backup.sh
**Status:** Implemented

Creates compressed backups of the AI PostgreSQL database.
Supports automatic cleanup of old backups.

```bash
./scripts/db-backup.sh [options]

Options:
  --output-dir DIR    Directory to store backups (default: AI_NEW/backups)
  --keep DAYS         Keep backups for N days, delete older (default: 30)
  --no-compress       Skip gzip compression
  --tables-only       Backup only data tables (skip schema)
  --schema-only       Backup only schema (no data)
  --json              Output JSON for admin portal integration
  --help              Show help message
```

**Output:** Creates timestamped backup file like `breyus_ai_20240106-143000.sql.gz`

---

### db-restore.sh
**Status:** Implemented

Restores a PostgreSQL database from a backup file created by `db-backup.sh`.
Supports both compressed (.gz) and uncompressed (.sql) backup files.

```bash
./scripts/db-restore.sh <backup-file> [options]

Arguments:
  backup-file         Path to backup file (.sql or .sql.gz)

Options:
  --drop-existing     Drop existing tables before restore (DANGEROUS)
  --dry-run           Show what would be done without executing
  --json              Output JSON for admin portal integration
  --help              Show help message
```

**WARNING:** This operation will OVERWRITE existing data! Use with caution.

---

## Typical VPS Workflows

### Initial Setup
```bash
# 1. Apply database schema
./scripts/ai-db-migrate.sh

# 2. Verify manifest status
./scripts/ai-manifest-status.sh
```

### Regular Data Sync
```bash
# Full sync: fetch from Drive + insert + retry
./scripts/ai-full-pipeline.sh

# Or step by step:
./scripts/ai-fetch-raw-data.sh
# (then use Python CLI for insert)
```

### Backup Before Major Changes
```bash
# Create backup
./scripts/db-backup.sh

# Restore if needed
./scripts/db-restore.sh AI_NEW/backups/breyus_ai_*.sql.gz
```

### Check Pipeline Status
```bash
# Quick status check
./scripts/ai-manifest-status.sh

# Detailed with failed files
./scripts/ai-manifest-status.sh --verbose --failed
```

---

## JSON Output for Admin Portal

All implemented scripts support `--json` flag for admin portal integration:

```bash
./scripts/ai-full-pipeline.sh --json
```

Output format:
```json
{
  "status": "success",
  "message": "Pipeline completed successfully",
  "details": { "duration_seconds": 45 },
  "timestamp": "2024-01-06T14:30:00+00:00",
  "log_file": "/path/to/log"
}
```

---

## Local Development Machine Scripts

For the **local machine** (not VPS):

```bash
# After running the full local pipeline
python -m pipeline.scripts.cli run-all-pending

# Upload new normalized files to Google Drive
./scripts/ai-upload-to-drive.sh

# Preview what would be uploaded
./scripts/ai-upload-to-drive.sh --dry-run
```
