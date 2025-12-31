# Breyus AI Raw Data Update Plan (Drive + DB Manifest + Purge Policy)

Status: planned (not implemented yet)
Owner: TBD
Last updated: 2025-12-30

## Summary
This document defines how the Breyus AI data pipeline will:
1) Pull raw files from Google Drive (or local),
2) Process them into CSV/normalized and seed into PostgreSQL,
3) Track processing state in a DB-backed manifest (source of truth),
4) Optionally purge local raw/csv/normalized files after a full successful run,
5) Prevent re-processing of already handled files, even if a file is updated.

This is intended to support production usage where local disk should remain
lightweight while the database remains the authoritative storage.

Key goals:
- Keep Git clones and servers lean (no raw data in git).
- Track processed/purged files centrally (DB manifest).
- Make pipeline runs repeatable and safe.
- Avoid reprocessing already handled files, even if updated.

## Current Pipeline (as-is)
The existing pipeline expects raw Excel files under `AI_NEW/raw_data/` and runs:

Raw XLSX -> CSV -> Normalized CSV -> PostgreSQL -> (embeddings, links, predictions)

Deduping is handled at insert time using `data_import_log` (file hash of CSV),
so re-running the pipeline does not duplicate data, but it can still reprocess
files if they appear again unless an external manifest is used.

## Proposed Flow (Drive-backed, env-driven)
### High-level flow
1) (Drive mode) Download supported files into `AI_NEW/raw_data/` as staging.
2) Run the pipeline commands (organize + run-all-pending).
3) At the end of the pipeline script, purge raw + csv + normalized for all
   successfully processed files (keep errors/duplicates).
4) Update the DB manifest and JSON manifest accordingly.

### Incremental updates (important)
- New file in Drive (new file_id) => download and process.
- Updated file in Drive (same file_id, new md5) => **SKIP** (do not treat as new).
- Local files (source_id = filename) => if filename already processed, **SKIP**
  even if the content changes.
- Manual override (optional future flag): allow a forced reprocess by ignoring
  skip rules.

### Skip rule summary
- If a file exists in the manifest with status in:
  processed, inserted, purged, skipped, failed
  => skip processing for that file.
- This applies even if the file's content hash changes later.

## Data Source Modes
The pipeline entrypoint will respect a source selector:

- `RAW_DATA_SOURCE=local`
  - Use local `AI_NEW/raw_data/` as-is.
  - No Drive calls.

- `RAW_DATA_SOURCE=drive`
  - Auto-download files from Drive into `AI_NEW/raw_data/` staging.
  - Drive folder is in "My Drive" (not Shared Drive).

## Supported File Types
The Drive sync will only download known supported types:
- Excel: `.xlsx`, `.xlsm`
- Delimited text: `.csv`, `.tsv` (only after CSV/TSV ingest is explicitly added)

All other file types are ignored (not downloaded).

## Drive Auth (Personal Gmail, OAuth)
API keys cannot access private Drive files. OAuth is required.

Planned auth model:
- One-time OAuth login on a local machine to obtain a refresh token.
- Store credentials and refresh token in `.env`.
- Use the refresh token on the deployment server (no re-login needed).
  - The auth helper prints the refresh token for manual copy into `.env`.

Planned env vars:
- `RAW_DATA_SOURCE=drive|local`
- `GDRIVE_FOLDER_ID=<folder id>`
- `GDRIVE_CLIENT_ID=<oauth client id>`
- `GDRIVE_CLIENT_SECRET=<oauth client secret>`
- `GDRIVE_REFRESH_TOKEN=<refresh token>`

## Manifest System of Record
### Source of truth
- PostgreSQL is the source of truth.
- `pipeline/manifest.json` is a local cache and fallback when DB is unavailable.
- If DB is down, pipeline reads/writes JSON.
- When DB is back, JSON is compared to DB and any missing entries are inserted.
  No overwrites of DB rows are performed.

### DB table (suggested)
Table name: `pipeline_file_manifest`

Columns (proposed):
- `id` (pk)
- `source_type` (local|drive)
- `source_id` (drive file_id or local filename)
- `file_name`
- `raw_hash`
- `csv_hash`
- `normalized_hash`
- `status` (downloaded|converted|normalized|inserted|processed|failed|skipped|purged)
- `rows_inserted`
- `rows_failed`
- `processed_at`
- `purged_at`
- `purge_reason`
- `last_seen_at`
- `size_bytes`
- `local_raw_path`
- `local_csv_path`
- `local_normalized_path`
- `error_message`

Suggested indexes:
- Unique index on (`source_type`, `source_id`)
- Index on `status`
- Index on `processed_at`

### Status lifecycle
Example states:
- downloaded -> converted -> normalized -> inserted -> processed
- failed (any stage)
- skipped (manifest says do not process)
- purged (files deleted after success)

### JSON manifest behavior
The JSON manifest mirrors the DB schema as closely as possible:
- Stored at: `AI_NEW/pipeline/manifest.json`
- Updated alongside DB writes when DB is reachable
- Used as fallback when DB is not reachable
- Synced into DB (insert-only) when DB becomes reachable again

## Purge Behavior (post-run cleanup)
Purging is **not** automatic per file during processing. It is run at the end
of the full pipeline script.

Purge command criteria:
- Status is `processed` OR `inserted` with `rows_failed == 0`
- Delete local files:
  - `AI_NEW/raw_data/` (raw)
  - `AI_NEW/pipeline/csv/`
  - `AI_NEW/pipeline/normalized/`
- Update manifest:
  - `status = purged`
  - `purged_at = now()`
  - `purge_reason = "<reason>"`
  - Clear local file paths if desired

Keep for audit/debug:
- `AI_NEW/pipeline/errors/`
- `AI_NEW/pipeline/duplicates/`

## Production Script Flow
### Master script (run on restart or git pull)
Pseudo-flow:
1) Check `PIPELINE_ENABLED` flag.
2) If disabled, exit.
3) Run pipeline script in full.
4) Run purge command with reason "post-run cleanup".

### Pipeline script (example)
1) Organize files by size:
   - `python -m pipeline.scripts.cli organize`
2) Process all pending:
   - `python -m pipeline.scripts.cli run-all-pending --size all`
3) Purge completed:
   - `python -m pipeline.scripts.cli purge --status processed --reason "post-run cleanup"`

## File Identity Rules
### Drive
- `source_id = file_id`
- Updated file (same file_id) is always skipped
- md5 change is recorded but does not trigger processing

### Local
- `source_id = filename`
- Same filename is always skipped, regardless of content changes
- New filename is treated as a new file

## Dedupe Strategy
- Whole-file dedupe uses `data_import_log` by CSV hash.
- This is a secondary safety net; the manifest skip rule is the primary control.
- No row-level dedupe is planned at this stage.

## Cleanup and Storage Notes
- Raw data is staging only (safe to delete after success).
- CSV/normalized are retained until the explicit purge command runs.
- Errors/duplicates always retained.
- Large files (~100MB XLSX -> 200MB CSV/normalized) are supported by streaming.

## Implementation Checklist (planned)
- [ ] Add DB table `pipeline_file_manifest`
- [ ] Add manifest read/write helpers (DB + JSON fallback)
- [ ] Add JSON-to-DB sync for missing entries
- [ ] Add skip logic using manifest for both Drive and local modes
- [ ] Add purge command (raw + csv + normalized)
- [ ] Add Drive sync with file type whitelist
- [ ] Add pipeline script examples to docs
- [ ] Update docs and requirements

---
This is a planning document only. No code changes have been made yet.
