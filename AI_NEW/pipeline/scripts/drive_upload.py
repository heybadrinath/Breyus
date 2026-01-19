"""
Drive Upload Script

Uploads new normalized CSV files from local pipeline/normalized/ to Google Drive.

Usage:
    python -m pipeline.scripts.drive_upload [--dry-run]

This script:
1. Lists all files in the local pipeline/normalized/ directory
2. Lists all files currently in the Google Drive folder
3. Finds files that exist locally but not in Drive
4. Uploads each new file with progress tracking

The script uses filename matching to determine which files are new.
Files already in Drive (by name) are skipped.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import List, Set

from .drive_utils import (
    authenticate,
    list_drive_files,
    file_exists_in_drive,
    upload_file,
    get_drive_config,
    DriveAPIError,
    DriveAuthError,
    _format_duration,
)
from .utils import log

# Default normalized directory (relative to AI_NEW)
PIPELINE_DIR = Path(__file__).resolve().parent.parent
NORMALIZED_DIR = PIPELINE_DIR / "normalized"


def get_local_normalized_files() -> List[Path]:
    """
    Get all CSV files in the local normalized directory.

    Returns:
        List of Path objects for local normalized files
    """
    if not NORMALIZED_DIR.exists():
        log("WARNING", f"Normalized directory not found: {NORMALIZED_DIR}", "drive_upload")
        return []

    files = list(NORMALIZED_DIR.glob("*.csv"))
    log("INFO", f"Found {len(files)} local normalized files", "drive_upload")
    return sorted(files)


def get_drive_filenames(access_token: str) -> Set[str]:
    """
    Get set of filenames currently in the Drive folder.

    Args:
        access_token: OAuth access token

    Returns:
        Set of filenames in Drive
    """
    try:
        drive_files = list_drive_files(access_token=access_token)
        filenames = {f.name for f in drive_files}
        log("INFO", f"Found {len(filenames)} files in Drive folder", "drive_upload")
        return filenames
    except DriveAPIError as e:
        log("ERROR", f"Failed to list Drive files: {e}", "drive_upload")
        raise


def find_new_files(
    local_files: List[Path],
    drive_filenames: Set[str],
) -> List[Path]:
    """
    Find local files that don't exist in Drive.

    Args:
        local_files: List of local file paths
        drive_filenames: Set of filenames in Drive

    Returns:
        List of local files not in Drive
    """
    new_files = [f for f in local_files if f.name not in drive_filenames]
    return new_files


def upload_new_files(
    files: List[Path],
    access_token: str,
    dry_run: bool = False,
) -> dict:
    """
    Upload new files to Google Drive.

    Args:
        files: List of file paths to upload
        access_token: OAuth access token
        dry_run: If True, only print what would be uploaded

    Returns:
        Dict with upload statistics
    """
    stats = {
        "total": len(files),
        "uploaded": 0,
        "failed": 0,
        "skipped": 0,
        "errors": [],
    }

    if not files:
        log("INFO", "No new files to upload", "drive_upload")
        return stats

    config = get_drive_config()
    folder_id = config["folder_id"]

    total_size = sum(f.stat().st_size for f in files)
    uploaded_size = 0
    session_start = time.time()

    for i, file_path in enumerate(files, 1):
        file_name = file_path.name
        file_size = file_path.stat().st_size
        file_size_mb = file_size / (1024 * 1024)

        # Calculate overall session progress
        overall_percent = (uploaded_size / total_size * 100) if total_size > 0 else 0
        elapsed = time.time() - session_start
        if uploaded_size > 0 and elapsed > 0:
            overall_speed = uploaded_size / (elapsed * 1024 * 1024)
            remaining = total_size - uploaded_size
            eta = remaining / (uploaded_size / elapsed)
            eta_str = _format_duration(eta)
        else:
            overall_speed = 0
            eta_str = "--:--"

        print(f"\n[{i}/{len(files)}] {file_name} ({file_size_mb:.1f} MB)")
        print(f"  Session: {overall_percent:.1f}% complete | {_format_duration(elapsed)} elapsed | ETA: {eta_str}")

        if dry_run:
            print("  [DRY RUN] Would upload this file")
            stats["skipped"] += 1
            continue

        try:
            result = upload_file(
                local_path=file_path,
                folder_id=folder_id,
                access_token=access_token,
                show_progress=True,
            )
            print(f"  Uploaded as: {result.id}")
            stats["uploaded"] += 1
            uploaded_size += file_size
        except DriveAPIError as e:
            print(f"  ERROR: {e}")
            stats["failed"] += 1
            stats["errors"].append({"file": file_name, "error": str(e)})
        except Exception as e:
            print(f"  ERROR: {e}")
            stats["failed"] += 1
            stats["errors"].append({"file": file_name, "error": str(e)})

    return stats


def run_upload(dry_run: bool = False) -> int:
    """
    Main upload flow.

    Args:
        dry_run: If True, only print what would be uploaded

    Returns:
        Exit code (0 for success, 1 for errors)
    """
    print("=" * 60)
    print("Google Drive Upload - Normalized Files")
    print("=" * 60)
    print()

    if dry_run:
        print("[DRY RUN MODE - No files will be uploaded]")
        print()

    # Validate configuration
    try:
        config = get_drive_config()
        print(f"Target folder ID: {config['folder_id']}")
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

    # Get local files
    print(f"\nScanning local directory: {NORMALIZED_DIR}")
    local_files = get_local_normalized_files()

    if not local_files:
        print("No normalized CSV files found locally")
        return 0

    # Get Drive files
    print("\nFetching Drive folder contents...")
    try:
        drive_filenames = get_drive_filenames(access_token)
    except DriveAPIError as e:
        print(f"Failed to list Drive files: {e}")
        return 1

    # Find new files
    new_files = find_new_files(local_files, drive_filenames)

    print(f"\n--- Summary ---")
    print(f"Local files:  {len(local_files)}")
    print(f"In Drive:     {len(drive_filenames)}")
    print(f"New to upload: {len(new_files)}")

    if not new_files:
        print("\nAll local files already exist in Drive. Nothing to upload.")
        return 0

    # List new files
    print("\n--- Files to upload ---")
    total_size = 0
    for f in new_files:
        size = f.stat().st_size
        total_size += size
        print(f"  {f.name} ({size / (1024*1024):.1f} MB)")

    total_size_mb = total_size / (1024*1024)
    print(f"\nTotal upload size: {total_size_mb:.1f} MB")

    # Estimate time at different speeds
    if not dry_run:
        print(f"\nEstimated time at various speeds:")
        print(f"  @ 0.5 MB/s: {_format_duration(total_size_mb / 0.5)}")
        print(f"  @ 1.0 MB/s: {_format_duration(total_size_mb / 1.0)}")
        print(f"  @ 5.0 MB/s: {_format_duration(total_size_mb / 5.0)}")

    # Upload
    print("\n--- Starting upload ---")
    session_start = time.time()
    stats = upload_new_files(new_files, access_token, dry_run=dry_run)
    session_elapsed = time.time() - session_start

    # Final summary
    print("\n" + "=" * 60)
    print("Upload Complete")
    print("=" * 60)
    print(f"Total files:   {stats['total']}")
    print(f"Uploaded:      {stats['uploaded']}")
    print(f"Failed:        {stats['failed']}")
    if dry_run:
        print(f"Skipped (dry): {stats['skipped']}")
    else:
        avg_speed = total_size_mb / session_elapsed if session_elapsed > 0 else 0
        print(f"\nSession time:  {_format_duration(session_elapsed)}")
        print(f"Average speed: {avg_speed:.2f} MB/s")

    if stats["errors"]:
        print("\n--- Errors ---")
        for err in stats["errors"]:
            print(f"  {err['file']}: {err['error']}")

    return 1 if stats["failed"] > 0 else 0


def main():
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="Upload normalized CSV files to Google Drive"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be uploaded without actually uploading",
    )
    args = parser.parse_args()

    try:
        sys.exit(run_upload(dry_run=args.dry_run))
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(1)


if __name__ == "__main__":
    main()
