"""
VPS Sync Orchestration Script

Full orchestration for VPS: fetch from Drive, insert to DB, retry failed.

Usage:
    python -m pipeline.scripts.vps_sync [--skip-fetch] [--skip-retry]

This script:
1. Fetches new normalized files from Google Drive
2. Inserts downloaded files into PostgreSQL
3. Retries previously failed files

This is the single command you run on VPS to sync all data.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List

from .drive_fetch import run_fetch
from .insert import insert_file, InsertResult
from .manifest_db import (
    list_pending_files,
    list_failed_files,
    update_manifest_status,
    get_manifest_summary,
    ManifestEntry,
)
from .utils import log

# Default normalized directory
PIPELINE_DIR = Path(__file__).resolve().parent.parent
NORMALIZED_DIR = PIPELINE_DIR / "normalized"


def insert_pending_files() -> dict:
    """
    Insert all files with status 'downloaded' into the database.

    Returns:
        Dict with insert statistics
    """
    stats = {
        "total": 0,
        "inserted": 0,
        "failed": 0,
        "errors": [],
    }

    pending = list_pending_files()
    stats["total"] = len(pending)

    if not pending:
        log("INFO", "No pending files to insert", "vps_sync")
        return stats

    print(f"\n--- Inserting {len(pending)} pending files ---")

    for i, entry in enumerate(pending, 1):
        file_name = entry.file_name
        local_path = Path(entry.local_path) if entry.local_path else NORMALIZED_DIR / file_name

        print(f"\n[{i}/{len(pending)}] {file_name}")

        if not local_path.exists():
            print(f"  ERROR: File not found at {local_path}")
            update_manifest_status(
                source_id=entry.source_id,
                source_type=entry.source_type,
                status="failed",
                error_message=f"File not found: {local_path}",
            )
            stats["failed"] += 1
            stats["errors"].append({"file": file_name, "error": "File not found"})
            continue

        try:
            # Update status to 'inserting'
            update_manifest_status(
                source_id=entry.source_id,
                source_type=entry.source_type,
                status="inserting",
            )

            # Run the existing insert logic
            result: InsertResult = insert_file(
                csv_path=local_path,
                mapping=None,  # Auto-detect
                best_effort=True,  # Row-by-row fallback
            )

            # Update manifest based on result
            if result.duplicate:
                update_manifest_status(
                    source_id=entry.source_id,
                    source_type=entry.source_type,
                    status="inserted",
                    rows_inserted=0,
                    rows_failed=0,
                    error_message="Duplicate file (already in data_import_log)",
                )
                print(f"  Skipped (duplicate)")
                stats["inserted"] += 1

            elif result.error:
                update_manifest_status(
                    source_id=entry.source_id,
                    source_type=entry.source_type,
                    status="failed",
                    rows_inserted=result.rows_inserted,
                    rows_failed=result.rows_failed,
                    error_message=result.error,
                )
                print(f"  FAILED: {result.error}")
                stats["failed"] += 1
                stats["errors"].append({"file": file_name, "error": result.error})

            else:
                update_manifest_status(
                    source_id=entry.source_id,
                    source_type=entry.source_type,
                    status="inserted",
                    rows_inserted=result.rows_inserted,
                    rows_failed=result.rows_failed,
                    target_table=result.note if result.note and result.note.startswith("table=") else None,
                )
                print(f"  Inserted: {result.rows_inserted} rows")
                if result.rows_failed > 0:
                    print(f"  Failed rows: {result.rows_failed}")
                stats["inserted"] += 1

        except Exception as e:
            error_msg = str(e)
            update_manifest_status(
                source_id=entry.source_id,
                source_type=entry.source_type,
                status="failed",
                error_message=error_msg,
            )
            print(f"  ERROR: {error_msg}")
            stats["failed"] += 1
            stats["errors"].append({"file": file_name, "error": error_msg})

    return stats


def retry_failed_files() -> dict:
    """
    Retry all files with status 'failed'.

    Returns:
        Dict with retry statistics
    """
    stats = {
        "total": 0,
        "retried": 0,
        "still_failed": 0,
        "errors": [],
    }

    failed = list_failed_files()
    stats["total"] = len(failed)

    if not failed:
        log("INFO", "No failed files to retry", "vps_sync")
        return stats

    print(f"\n--- Retrying {len(failed)} failed files ---")

    for i, entry in enumerate(failed, 1):
        file_name = entry.file_name
        local_path = Path(entry.local_path) if entry.local_path else NORMALIZED_DIR / file_name

        print(f"\n[{i}/{len(failed)}] {file_name}")
        print(f"  Previous error: {entry.error_message or 'Unknown'}")

        if not local_path.exists():
            print(f"  ERROR: File not found at {local_path}")
            stats["still_failed"] += 1
            stats["errors"].append({"file": file_name, "error": "File not found"})
            continue

        try:
            # Update status to 'inserting'
            update_manifest_status(
                source_id=entry.source_id,
                source_type=entry.source_type,
                status="inserting",
                error_message=None,  # Clear previous error
            )

            # Retry with best-effort
            result: InsertResult = insert_file(
                csv_path=local_path,
                mapping=None,
                best_effort=True,
            )

            if result.error:
                update_manifest_status(
                    source_id=entry.source_id,
                    source_type=entry.source_type,
                    status="failed",
                    rows_inserted=result.rows_inserted,
                    rows_failed=result.rows_failed,
                    error_message=result.error,
                )
                print(f"  Still failed: {result.error}")
                stats["still_failed"] += 1
                stats["errors"].append({"file": file_name, "error": result.error})
            else:
                update_manifest_status(
                    source_id=entry.source_id,
                    source_type=entry.source_type,
                    status="inserted",
                    rows_inserted=result.rows_inserted,
                    rows_failed=result.rows_failed,
                )
                print(f"  Retry successful: {result.rows_inserted} rows")
                stats["retried"] += 1

        except Exception as e:
            error_msg = str(e)
            update_manifest_status(
                source_id=entry.source_id,
                source_type=entry.source_type,
                status="failed",
                error_message=error_msg,
            )
            print(f"  ERROR: {error_msg}")
            stats["still_failed"] += 1
            stats["errors"].append({"file": file_name, "error": error_msg})

    return stats


def print_summary():
    """Print manifest summary."""
    summary = get_manifest_summary()

    print("\n" + "=" * 60)
    print("Manifest Summary")
    print("=" * 60)
    print(f"Total files tracked:    {summary['total_files']}")
    print(f"Total rows inserted:    {summary['total_rows_inserted']}")
    print(f"Total rows failed:      {summary['total_rows_failed']}")
    print("\nBy status:")
    for status, count in sorted(summary["by_status"].items()):
        print(f"  {status}: {count}")


def run_sync(
    skip_fetch: bool = False,
    skip_retry: bool = False,
) -> int:
    """
    Main sync flow.

    Args:
        skip_fetch: Skip the Drive fetch step
        skip_retry: Skip the retry step

    Returns:
        Exit code (0 for success, 1 for errors)
    """
    print("=" * 60)
    print("VPS Sync - Full Pipeline")
    print("=" * 60)

    has_errors = False

    # Step 1: Fetch from Drive
    if not skip_fetch:
        print("\n" + "=" * 60)
        print("STEP 1: Fetch from Google Drive")
        print("=" * 60)
        fetch_result = run_fetch(dry_run=False)
        if fetch_result != 0:
            print("\nWarning: Fetch step had errors")
            has_errors = True
    else:
        print("\n[Skipping Drive fetch]")

    # Step 2: Insert pending files
    print("\n" + "=" * 60)
    print("STEP 2: Insert Pending Files")
    print("=" * 60)
    insert_stats = insert_pending_files()

    if insert_stats["total"] > 0:
        print(f"\nInsert Results:")
        print(f"  Total:    {insert_stats['total']}")
        print(f"  Success:  {insert_stats['inserted']}")
        print(f"  Failed:   {insert_stats['failed']}")

        if insert_stats["failed"] > 0:
            has_errors = True

    # Step 3: Retry failed files
    if not skip_retry:
        print("\n" + "=" * 60)
        print("STEP 3: Retry Failed Files")
        print("=" * 60)
        retry_stats = retry_failed_files()

        if retry_stats["total"] > 0:
            print(f"\nRetry Results:")
            print(f"  Total:        {retry_stats['total']}")
            print(f"  Succeeded:    {retry_stats['retried']}")
            print(f"  Still failed: {retry_stats['still_failed']}")

            if retry_stats["still_failed"] > 0:
                has_errors = True
    else:
        print("\n[Skipping retry step]")

    # Final summary
    print_summary()

    print("\n" + "=" * 60)
    print("Sync Complete")
    print("=" * 60)

    return 1 if has_errors else 0


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="Full VPS sync: fetch from Drive, insert to DB, retry failed"
    )
    parser.add_argument(
        "--skip-fetch",
        action="store_true",
        help="Skip the Google Drive fetch step",
    )
    parser.add_argument(
        "--skip-retry",
        action="store_true",
        help="Skip the retry step for failed files",
    )
    args = parser.parse_args()

    try:
        sys.exit(run_sync(
            skip_fetch=args.skip_fetch,
            skip_retry=args.skip_retry,
        ))
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(1)


if __name__ == "__main__":
    main()
