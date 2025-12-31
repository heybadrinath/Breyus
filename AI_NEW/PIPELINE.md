# AI Data Pipeline - Command Reference

**Last Updated:** 2025-12-19

## Overview

The data pipeline processes raw Excel files through multiple stages to populate the AI database:

```
Raw Excel → CSV → Normalized → Database → Embeddings → Trade Links → Predictions
```

**All commands must be run from `/app` directory inside Docker container:**
```bash
docker-compose exec ai-server bash
cd /app
python -m pipeline.scripts.cli <command> [options]
```

---

## Directory Structure

```
AI_NEW/
├── raw_data/
│   ├── small/              # Files < 2 MB (auto-organized)
│   ├── medium/             # Files 2-20 MB (auto-organized)
│   ├── large/              # Files > 20 MB (auto-organized)
│   └── *.xlsx              # Unorganized files (will be sorted)
├── pipeline/
│   ├── csv/                # Converted CSV files
│   ├── normalized/         # Schema-ready normalized CSV
│   ├── errors/             # Failed row errors
│   ├── duplicates/         # Duplicate files
│   ├── summaries/          # File metadata JSON
│   ├── scripts/            # Pipeline scripts
│   └── manifest.json       # Pipeline state tracker
└── shared/
    └── db/
        └── schema.sql      # Database schema
```

---

## Commands Reference

### File Organization

#### `organize`
Organize raw Excel files into size-based subdirectories.

**Usage:**
```bash
# Organize all files in raw_data root
python -m pipeline.scripts.cli organize

# Preview without moving files
python -m pipeline.scripts.cli organize --dry-run

# Check current organization status
python -m pipeline.scripts.cli organize --status
```

**Output:**
```
2025-12-19 20:45:03 [INFO] [organize] Starting file organization
2025-12-19 20:45:03 [INFO] [organize] Found 32 file(s) to organize
2025-12-19 20:45:04 [INFO] [organize] 2309 export.xlsx -> small/ (0.02 MB)
2025-12-19 20:45:15 [INFO] [organize] Organization complete: 5 small, 10 medium, 17 large
```

**Categories:**
- Small: < 2 MB (processing time: 1-2 min)
- Medium: 2-20 MB (processing time: 5-30 min)
- Large: > 20 MB (processing time: 30 min - 3 hours)

---

### Single File Processing

#### `convert`
Convert single Excel file to CSV.

**Usage:**
```bash
python -m pipeline.scripts.cli convert "raw_data/2309 export.xlsx"
```

**Output:** Creates CSV files in `pipeline/csv/`

---

#### `normalize`
Normalize CSV to database-ready format.

**Usage:**
```bash
python -m pipeline.scripts.cli normalize "pipeline/csv/2309_export__Export_Records.csv"
```

**Output:** Creates normalized CSV in `pipeline/normalized/`

---

#### `insert`
Insert normalized CSV into database.

**Usage:**
```bash
python -m pipeline.scripts.cli insert "pipeline/normalized/2309_export_normalized.csv"

# With specific mapping type
python -m pipeline.scripts.cli insert "pipeline/normalized/companies.csv" --mapping company_international

# Best-effort insert (row-by-row fallback on failure)
python -m pipeline.scripts.cli insert "pipeline/normalized/companies.csv" --best-effort
```

**Output:** Data inserted into PostgreSQL tables (companies, trade_records, products)

**Best-effort:** If a batch insert fails, rows are retried one-by-one; failures are written to
`pipeline/errors/*_insert_errors.csv` with an `_error` column.

---

#### `run-all`
Run full pipeline for a single file (convert → normalize → insert).

**Usage:**
```bash
# Auto-detects file location (searches root and subdirectories)
python -m pipeline.scripts.cli run-all "2309 export.xlsx"

# With full path
python -m pipeline.scripts.cli run-all "raw_data/small/2309 export.xlsx"

# With mapping override
python -m pipeline.scripts.cli run-all "companies.xlsx" --mapping company_international

# Best-effort insert
python -m pipeline.scripts.cli run-all "companies.xlsx" --best-effort
```

**Output:**
```
2025-12-19 20:45:16 [INFO] [run-all] Starting full pipeline for: 2309 export.xlsx
2025-12-19 20:45:17 [INFO] [run-all] Converting to CSV...
2025-12-19 20:45:18 [INFO] [run-all] Created 1 CSV file(s)
2025-12-19 20:45:19 [INFO] [run-all] Normalizing data...
2025-12-19 20:45:20 [INFO] [run-all] Normalized to: 2309_export_normalized.csv
2025-12-19 20:45:21 [INFO] [run-all] Inserting to database...
2025-12-19 20:45:25 [INFO] [run-all] Status: completed, Rows inserted: 123
2025-12-19 20:45:25 [INFO] [run-all] Pipeline complete!
```

---

### Batch Processing

#### `convert-all`
Convert all Excel files to CSV, with optional size filtering.

**Usage:**
```bash
# Convert all files (auto-organizes first)
python -m pipeline.scripts.cli convert-all

# Convert only small files
python -m pipeline.scripts.cli convert-all --size small

# Convert only medium files
python -m pipeline.scripts.cli convert-all --size medium

# Convert only large files
python -m pipeline.scripts.cli convert-all --size large

# Skip auto-organization (if already organized)
python -m pipeline.scripts.cli convert-all --size small --skip-organize
```

**Size Options:** `all` (default), `small`, `medium`, `large`

---

#### `normalize-all`
Normalize all CSV files in `pipeline/csv/`.

**Usage:**
```bash
python -m pipeline.scripts.cli normalize-all
```

**Output:** Normalized CSVs in `pipeline/normalized/`

---

#### `run-all-pending`
Process all files through full pipeline, with optional size filtering.

**Usage:**
```bash
# Process all files (auto-organizes first)
python -m pipeline.scripts.cli run-all-pending

# Process only small files (recommended first step)
python -m pipeline.scripts.cli run-all-pending --size small

# Process only medium files
python -m pipeline.scripts.cli run-all-pending --size medium

# Process only large files (run in background)
nohup python -m pipeline.scripts.cli run-all-pending --size large > /app/large.log 2>&1 &

# Skip auto-organization
python -m pipeline.scripts.cli run-all-pending --size small --skip-organize

# Best-effort inserts
python -m pipeline.scripts.cli run-all-pending --size small --best-effort
```

**Output:**
```
2025-12-19 20:45:15 [INFO] [run-all-pending] Auto-organizing files by size before processing
2025-12-19 20:45:15 [INFO] [run-all-pending] Processing files from category: small
2025-12-19 20:45:15 [INFO] [run-all-pending] Found 5 file(s) to process
2025-12-19 20:45:16 [INFO] [run-all-pending] [1/5] Processing 2309 export.xlsx...
2025-12-19 20:45:25 [INFO] [run-all-pending] 2309 export.xlsx complete: 123 rows inserted
2025-12-19 20:48:30 [INFO] [run-all-pending] Processing complete: 5 succeeded, 0 failed, 2,345 total rows
```

---

### Vector Embeddings

#### `embed`
Generate vector embeddings for database records.

**Usage:**
```bash
# Embed all companies without vectors
python -m pipeline.scripts.cli embed --table companies

# Embed all trade records without vectors
python -m pipeline.scripts.cli embed --table trade_records

# Embed all products without vectors
python -m pipeline.scripts.cli embed --table products

# Custom batch size
python -m pipeline.scripts.cli embed --table companies --batch-size 50

# Custom embedding model
python -m pipeline.scripts.cli embed --table companies --model "sentence-transformers/all-mpnet-base-v2"
```

**Tables:** `companies`, `trade_records`, `products`

**Default Model:** `sentence-transformers/all-MiniLM-L12-v2` (384 dimensions)

---

### Derived Data

#### `build-links`
Aggregate trade_records into trade_links table (company relationships).

**Usage:**
```bash
# Build all trade links
python -m pipeline.scripts.cli build-links

# Limit to first N records (for testing)
python -m pipeline.scripts.cli build-links --limit 1000
```

**Output:** Populates `trade_links` table with aggregated trade relationships

---

#### `compute-predictions`
Generate predicted trade partners using AI algorithms.

**Usage:**
```bash
# Compute predictions for all companies
python -m pipeline.scripts.cli compute-predictions

# Limit to top N companies (for testing)
python -m pipeline.scripts.cli compute-predictions --limit 500
```

**Output:** Populates `predicted_partners` table with AI-generated partner recommendations

---

### Status & Monitoring

#### `status`
Show pipeline status summary.

**Usage:**
```bash
python -m pipeline.scripts.cli status
```

**Output:**
```
Manifest version: 1.1
Total files: 48
Files by status: {'csv': 32, 'normalized': 16}
```

---

#### `list`
List all files tracked in manifest.

**Usage:**
```bash
# List all files
python -m pipeline.scripts.cli list

# Filter by status
python -m pipeline.scripts.cli list --status csv
python -m pipeline.scripts.cli list --status normalized
python -m pipeline.scripts.cli list --status in_db
python -m pipeline.scripts.cli list --status embedded
```

**Output:**
```
2309 export.xlsx :: csv mapping=deals hash=d55e191...
23 import sample 2309.xlsx :: normalized mapping=deals hash=ab3aa3e...
```

---

#### `types`
Show available data type mappings.

**Usage:**
```bash
python -m pipeline.scripts.cli types
```

**Output:** Lists available mappings (companies, deals, products, etc.)

---

### Error Handling

#### `retry-errors`
Retry processing failed rows from error files.

**Usage:**
```bash
python -m pipeline.scripts.cli retry-errors

# Best-effort insert (row-by-row fallback on failure)
python -m pipeline.scripts.cli retry-errors --best-effort
```

**Output:** Attempts to reprocess rows in `pipeline/errors/*.csv`

---

#### `reconcile-duplicates`
Reconcile duplicate files at row level.

**Usage:**
```bash
python -m pipeline.scripts.cli reconcile-duplicates
```

**Output:** Processes files in `pipeline/duplicates/` to insert unique rows

---

### Database Management

#### `reset`
Clear pipeline outputs and/or truncate database tables.

**Usage:**
```bash
# Dry run (show what would be deleted)
python -m pipeline.scripts.cli reset --dry-run

# Reset everything (requires confirmation)
python -m pipeline.scripts.cli reset --yes

# Reset only files, keep database
python -m pipeline.scripts.cli reset --yes --skip-db

# Reset only database, keep files
python -m pipeline.scripts.cli reset --yes --skip-files

# Reset specific tables only
python -m pipeline.scripts.cli reset --yes --tables companies,trade_records
```

**⚠️ WARNING:** This is destructive. Use `--dry-run` first!

---

## Common Workflows

### Workflow 1: Quick Test (Small Files)

```bash
cd /app

# Step 1: Organize files
python -m pipeline.scripts.cli organize

# Step 2: Process small files only (~5-10 minutes)
python -m pipeline.scripts.cli run-all-pending --size small

# Step 3: Check results
python -m pipeline.scripts.cli status
```

### Workflow 2: Process Everything

```bash
cd /app

# Step 1: Process small files (fast validation)
python -m pipeline.scripts.cli run-all-pending --size small

# Step 2: Process medium files
python -m pipeline.scripts.cli run-all-pending --size medium --skip-organize

# Step 3: Process large files in background
nohup python -m pipeline.scripts.cli run-all-pending --size large --skip-organize > /app/large.log 2>&1 &

# Monitor progress
tail -f /app/large.log
```

### Workflow 3: Process Single File

```bash
cd /app

# Just provide the filename - auto-detects location
python -m pipeline.scripts.cli run-all "indian importer exporter data final.xlsx"
```

### Workflow 4: Generate Embeddings & Predictions

```bash
cd /app

# After data is inserted, generate embeddings
python -m pipeline.scripts.cli embed --table companies
python -m pipeline.scripts.cli embed --table trade_records
python -m pipeline.scripts.cli embed --table products

# Build trade relationships
python -m pipeline.scripts.cli build-links

# Generate partner predictions
python -m pipeline.scripts.cli compute-predictions
```

### Workflow 5: Monitor Database Growth

```bash
# Check database record counts
docker-compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM trade_records) as trade_records,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM trade_links) as trade_links,
  (SELECT COUNT(*) FROM predicted_partners) as predicted_partners;
"

# Check import status
docker-compose exec postgres psql -U postgres -d breyus_ai -c "
SELECT status, COUNT(*) as file_count, SUM(rows_imported) as total_rows
FROM data_import_log
GROUP BY status
ORDER BY status;
"
```

---

## Pipeline States

Files progress through these states (tracked in `pipeline/manifest.json`):

1. **raw** - Excel file in `raw_data/`
2. **csv** - Converted to CSV in `pipeline/csv/`
3. **normalized** - Normalized in `pipeline/normalized/`
4. **summarized** - Metadata generated in `pipeline/summaries/`
5. **pending_db_insert** - Queued for database insertion
6. **in_db** - Data inserted into PostgreSQL
7. **embedded** - Vector embeddings generated

**Side paths:**
- **skipped_duplicate** - Duplicate file moved to `pipeline/duplicates/`
- **error** - Failed rows in `pipeline/errors/`

---

## Database Tables

| Table | Purpose | Populated By |
|-------|---------|--------------|
| `companies` | Company/entity records | `insert` command |
| `trade_records` | Import/export transactions | `insert` command |
| `products` | Product catalog | `insert` command |
| `trade_links` | Aggregated company relationships | `build-links` command |
| `predicted_partners` | AI-generated partner recommendations | `compute-predictions` command |
| `data_import_log` | Import audit trail | `insert` command (auto) |

---

## Logging Format

All commands output timestamped logs:

```
YYYY-MM-DD HH:MM:SS [LEVEL] [script-name] message
```

**Levels:**
- `[INFO]` - Normal operation
- `[WARNING]` - Non-critical issues
- `[ERROR]` - Critical errors

**Example:**
```
2025-12-19 20:45:03 [INFO] [organize] Starting file organization
2025-12-19 20:45:15 [INFO] [organize] Organization complete: 5 small, 10 medium, 17 large
2025-12-19 20:45:16 [INFO] [run-all-pending] Processing files from category: small
2025-12-19 20:45:25 [INFO] [run-all] Pipeline complete!
```

---

## Environment Configuration

Size thresholds can be customized in `.env`:

```env
SIZE_THRESHOLD_SMALL_MB=2     # Default: 2 MB
SIZE_THRESHOLD_MEDIUM_MB=20   # Default: 20 MB
```

---

## Quick Command Reference

```bash
# === FILE ORGANIZATION ===
python -m pipeline.scripts.cli organize                           # Organize files
python -m pipeline.scripts.cli organize --status                  # Check status

# === BATCH PROCESSING ===
python -m pipeline.scripts.cli run-all-pending --size small       # Small files
python -m pipeline.scripts.cli run-all-pending --size medium      # Medium files
python -m pipeline.scripts.cli run-all-pending --size large       # Large files

# === SINGLE FILE ===
python -m pipeline.scripts.cli run-all "filename.xlsx"            # Auto-detects location

# === EMBEDDINGS & PREDICTIONS ===
python -m pipeline.scripts.cli embed --table companies            # Generate embeddings
python -m pipeline.scripts.cli build-links                        # Build relationships
python -m pipeline.scripts.cli compute-predictions                # Generate predictions

# === MONITORING ===
python -m pipeline.scripts.cli status                             # Pipeline status
python -m pipeline.scripts.cli list                               # List all files
```

---

## Troubleshooting

### Check if file is organized
```bash
python -m pipeline.scripts.cli organize --status
```

### Find a file
```bash
# Inside container
find /app/raw_data -name "filename.xlsx"
```

### Check database connection
```bash
docker-compose exec postgres pg_isready
```

### View manifest details
```bash
cat /app/pipeline/manifest.json | head -50
```

### Clear everything and start fresh
```bash
python -m pipeline.scripts.cli reset --dry-run  # Preview
python -m pipeline.scripts.cli reset --yes      # Execute (with confirmation)
```

---

## Related Documentation

- **QUICKSTART.md** - Initial setup and installation
- **FILE_ORGANIZATION_GUIDE.md** - Detailed organization system guide
- **DOCKER_COMMANDS.md** - Docker-specific commands
- **AI_TASKS.md** - Implementation status tracker

---

**Ready to process data? Start here:**

```bash
docker-compose exec ai-server bash
cd /app
python -m pipeline.scripts.cli organize
python -m pipeline.scripts.cli run-all-pending --size small
```
