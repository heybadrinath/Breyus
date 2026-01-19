"""
Drive Fetch Script (VPS)

Fetches new normalized CSV files from Google Drive to local pipeline/normalized/.

Usage:
    python -m pipeline.scripts.drive_fetch [--dry-run]

This script:
1. Lists all files in the Google Drive folder
2. Checks the DB manifest for each file's status
3. Downloads files that haven't been processed yet
4. Updates the DB manifest with 'downloaded' status

Files are skipped if they exist in the manifest with status:
- 'inserted' (already in database)
- 'purged' (processed and cleaned up)
- 'downloaded' (already fetched to disk)
Files are also skipped if they already exist locally in pipeline/normalized/.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Tuple

from .drive_utils import (
    authenticate,
    list_drive_files,
    download_file,
    get_drive_config,
    DriveFile,
    DriveAPIError,
    DriveAuthError,
)
from .manifest_db import (
    get_manifest_entry,
    create_or_update_manifest,
    ManifestEntry,
)
from .utils import log, compute_file_hash

# Default normalized directory (relative to AI_NEW)
PIPELINE_DIR = Path(__file__).resolve().parent.parent
NORMALIZED_DIR = PIPELINE_DIR / "normalized"

# Statuses that indicate file is already processed
PROCESSED_STATUSES = {"inserted", "purged", "downloaded"}


def get_files_to_download(
    drive_files: List[DriveFile],
) -> Tuple[List[DriveFile], List[DriveFile]]:
    """
    Filter Drive files to find ones needing download.

    Checks DB manifest and skips files with processed status.

    Args:
        drive_files: List of files from Google Drive

    Returns:
        Tuple of (files_to_download, files_to_skip)
    """
    to_download: List[DriveFile] = []
    to_skip: List[DriveFile] = []

    for drive_file in drive_files:
        # Check manifest by drive_file_id
        entry = get_manifest_entry(source_type="drive", source_id=drive_file.id)

        if entry and entry.status in PROCESSED_STATUSES:
            to_skip.append(drive_file)
            log(
                "DEBUG",
                f"Skipping {drive_file.name} (status={entry.status})",
                "drive_fetch",
            )
            continue

        local_path = NORMALIZED_DIR / drive_file.name
        if local_path.exists():
            file_hash = None
            try:
                file_hash = compute_file_hash(local_path)
            except Exception as exc:
                log(
                    "WARNING",
                    f"Failed to hash {drive_file.name}: {exc}",
                    "drive_fetch",
                )
            create_or_update_manifest(
                source_type="drive",
                source_id=drive_file.id,
                file_name=drive_file.name,
                status="downloaded",
                drive_file_id=drive_file.id,
                drive_modified_time=drive_file.modified_time,
                drive_md5_checksum=drive_file.md5_checksum,
                local_path=str(local_path),
                normalized_hash=file_hash,
            )
            to_skip.append(drive_file)
            log(
                "DEBUG",
                f"Skipping {drive_file.name} (already on disk)",
                "drive_fetch",
            )
            continue

        to_download.append(drive_file)

    return to_download, to_skip


def download_new_files(
    files: List[DriveFile],
    access_token: str,
    dry_run: bool = False,
) -> dict:
    """
    Download new files from Google Drive.

    Args:
        files: List of DriveFile objects to download
        access_token: OAuth access token
        dry_run: If True, only print what would be downloaded

    Returns:
        Dict with download statistics
    """
    stats = {
        "total": len(files),
        "downloaded": 0,
        "failed": 0,
        "skipped": 0,
        "errors": [],
    }

    if not files:
        log("INFO", "No new files to download", "drive_fetch")
        return stats

    # Ensure normalized directory exists
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)

    for i, drive_file in enumerate(files, 1):
        file_name = drive_file.name
        file_size_mb = drive_file.size / (1024 * 1024)
        local_path = NORMALIZED_DIR / file_name

        print(f"\n[{i}/{len(files)}] {file_name} ({file_size_mb:.1f} MB)")

        if dry_run:
            print("  [DRY RUN] Would download this file")
            stats["skipped"] += 1
            continue

        try:
            # Download the file
            download_file(
                file_id=drive_file.id,
                destination=local_path,
                access_token=access_token,
                show_progress=True,
            )

            # Compute hash of downloaded file
            file_hash = compute_file_hash(local_path)

            # Update manifest with 'downloaded' status
            create_or_update_manifest(
                source_type="drive",
                source_id=drive_file.id,
                file_name=file_name,
                status="downloaded",
                drive_file_id=drive_file.id,
                drive_modified_time=drive_file.modified_time,
                drive_md5_checksum=drive_file.md5_checksum,
                local_path=str(local_path),
                normalized_hash=file_hash,
            )

            print(f"  Saved to: {local_path}")
            stats["downloaded"] += 1

        except DriveAPIError as e:
            print(f"  ERROR: {e}")
            stats["failed"] += 1
            stats["errors"].append({"file": file_name, "error": str(e)})
        except Exception as e:
            print(f"  ERROR: {e}")
            stats["failed"] += 1
            stats["errors"].append({"file": file_name, "error": str(e)})

    return stats


def run_fetch(dry_run: bool = False) -> int:
    """
    Main fetch flow.

    Args:
        dry_run: If True, only print what would be downloaded

    Returns:
        Exit code (0 for success, 1 for errors)
    """
    print("=" * 60)
    print("Google Drive Fetch - Normalized Files")
    print("=" * 60)
    print()

    if dry_run:
        print("[DRY RUN MODE - No files will be downloaded]")
        print()

    # Validate configuration
    try:
        config = get_drive_config()
        print(f"Source folder ID: {config['folder_id']}")
    except ValueError as e:
        print(f"Configuration error: {e}")
        return 1

    # Authenticate
    try:
        print("\nAuthenticating with Google Drive...")
        access_token = authenticate()
        print("Authentication successful")
    except DriveAuthError as e:
        print(f"Authentication failed: {e}")
        return 1

    # Get Drive files
    print("\nFetching Drive folder contents...")
    try:
        drive_files = list_drive_files(access_token=access_token)
    except DriveAPIError as e:
        print(f"Failed to list Drive files: {e}")
        return 1

    if not drive_files:
        print("No files found in Drive folder")
        return 0

    # Filter files
    print("\nChecking manifest for processed files...")
    to_download, to_skip = get_files_to_download(drive_files)

    print(f"\n--- Summary ---")
    print(f"Files in Drive:     {len(drive_files)}")
    print(f"Already processed:  {len(to_skip)}")
    print(f"Need to download:   {len(to_download)}")

    if not to_download:
        print("\nAll files already processed. Nothing to download.")
        return 0

    # List files to download
    print("\n--- Files to download ---")
    total_size = 0
    for f in to_download:
        total_size += f.size
        print(f"  {f.name} ({f.size / (1024*1024):.1f} MB)")

    print(f"\nTotal download size: {total_size / (1024*1024):.1f} MB")
    print(f"Destination: {NORMALIZED_DIR}")

    # Download
    print("\n--- Starting download ---")
    stats = download_new_files(to_download, access_token, dry_run=dry_run)

    # Final summary
    print("\n" + "=" * 60)
    print("Fetch Complete")
    print("=" * 60)
    print(f"Total files:    {stats['total']}")
    print(f"Downloaded:     {stats['downloaded']}")
    print(f"Failed:         {stats['failed']}")
    if dry_run:
        print(f"Skipped (dry):  {stats['skipped']}")

    if stats["errors"]:
        print("\n--- Errors ---")
        for err in stats["errors"]:
            print(f"  {err['file']}: {err['error']}")

    return 1 if stats["failed"] > 0 else 0


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="Fetch normalized CSV files from Google Drive"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be downloaded without actually downloading",
    )
    args = parser.parse_args()

    try:
        sys.exit(run_fetch(dry_run=args.dry_run))
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(1)


if __name__ == "__main__":
    main()
