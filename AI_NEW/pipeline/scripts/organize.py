"""
File Organization Script

Organizes raw data files into small/medium/large subdirectories based on file size.
Runs automatically before convert operations to optimize processing workflow.

Size Categories (configurable via .env):
- Small:  < 2 MB (quick processing, < 2 minutes)
- Medium: 2-20 MB (moderate processing, 2-30 minutes)
- Large:  > 20 MB (long processing, > 30 minutes)
"""

from __future__ import annotations

import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

# Thresholds in MB (can be overridden by environment variables)
SMALL_THRESHOLD_MB = float(os.getenv("SIZE_THRESHOLD_SMALL_MB", "2"))
MEDIUM_THRESHOLD_MB = float(os.getenv("SIZE_THRESHOLD_MEDIUM_MB", "20"))

# Directories
RAW_DATA_DIR = Path(__file__).parent.parent.parent / "raw_data"
SMALL_DIR = RAW_DATA_DIR / "small"
MEDIUM_DIR = RAW_DATA_DIR / "medium"
LARGE_DIR = RAW_DATA_DIR / "large"


def log(level: str, message: str, script: str = "organize"):
    """Simple console logger with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"{timestamp} [{level}] [{script}] {message}")


def get_file_size_mb(filepath: Path) -> float:
    """Get file size in megabytes"""
    return filepath.stat().st_size / (1024 * 1024)


def categorize_file(filepath: Path) -> str:
    """
    Categorize file as small, medium, or large based on size.

    Args:
        filepath: Path to the file

    Returns:
        Category: 'small', 'medium', or 'large'
    """
    size_mb = get_file_size_mb(filepath)

    if size_mb < SMALL_THRESHOLD_MB:
        return "small"
    elif size_mb < MEDIUM_THRESHOLD_MB:
        return "medium"
    else:
        return "large"


def ensure_category_directories():
    """Create small/medium/large subdirectories if they don't exist"""
    for directory in [SMALL_DIR, MEDIUM_DIR, LARGE_DIR]:
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            log("INFO", f"Created directory: {directory.name}/")


def get_files_to_organize() -> List[Path]:
    """
    Get all Excel files in the root raw_data directory (not in subdirectories).

    Returns:
        List of file paths that need to be organized
    """
    if not RAW_DATA_DIR.exists():
        log("ERROR", f"Raw data directory not found: {RAW_DATA_DIR}")
        return []

    files = []
    for item in RAW_DATA_DIR.iterdir():
        if item.is_file() and item.suffix.lower() in ['.xlsx', '.xls']:
            files.append(item)

    return files


def organize_files(dry_run: bool = False) -> Dict[str, List[str]]:
    """
    Organize files from raw_data root into size-based subdirectories.

    Args:
        dry_run: If True, only show what would be done without moving files

    Returns:
        Dictionary mapping category to list of filenames
    """
    log("INFO", "Starting file organization")
    log("INFO", f"Thresholds: Small < {SMALL_THRESHOLD_MB}MB, Medium < {MEDIUM_THRESHOLD_MB}MB, Large >= {MEDIUM_THRESHOLD_MB}MB")

    # Ensure directories exist
    ensure_category_directories()

    # Get files to organize
    files = get_files_to_organize()

    if not files:
        log("INFO", "No files to organize in raw_data root directory")
        return {"small": [], "medium": [], "large": []}

    log("INFO", f"Found {len(files)} file(s) to organize")

    # Categorize and move files
    categories = {"small": [], "medium": [], "large": []}

    for filepath in files:
        size_mb = get_file_size_mb(filepath)
        category = categorize_file(filepath)

        # Determine destination
        if category == "small":
            dest_dir = SMALL_DIR
        elif category == "medium":
            dest_dir = MEDIUM_DIR
        else:
            dest_dir = LARGE_DIR

        dest_path = dest_dir / filepath.name

        # Log the action
        log("INFO", f"{filepath.name} -> {category}/ ({size_mb:.2f} MB)")

        # Move the file (unless dry run)
        if not dry_run:
            if dest_path.exists():
                log("WARNING", f"File already exists at destination, skipping: {dest_path.name}")
            else:
                try:
                    shutil.move(str(filepath), str(dest_path))
                    categories[category].append(filepath.name)
                except Exception as e:
                    log("ERROR", f"Failed to move {filepath.name}: {e}")
        else:
            categories[category].append(filepath.name)

    # Summary
    log("INFO", f"Organization complete: {len(categories['small'])} small, {len(categories['medium'])} medium, {len(categories['large'])} large")

    return categories


def check_organization_status() -> Dict[str, int]:
    """
    Check current organization status without making changes.

    Returns:
        Dictionary with counts: root, small, medium, large
    """
    status = {
        "root": 0,
        "small": 0,
        "medium": 0,
        "large": 0
    }

    # Count files in root
    if RAW_DATA_DIR.exists():
        status["root"] = len([f for f in RAW_DATA_DIR.iterdir() if f.is_file() and f.suffix.lower() in ['.xlsx', '.xls']])

    # Count files in subdirectories
    if SMALL_DIR.exists():
        status["small"] = len([f for f in SMALL_DIR.iterdir() if f.is_file() and f.suffix.lower() in ['.xlsx', '.xls']])

    if MEDIUM_DIR.exists():
        status["medium"] = len([f for f in MEDIUM_DIR.iterdir() if f.is_file() and f.suffix.lower() in ['.xlsx', '.xls']])

    if LARGE_DIR.exists():
        status["large"] = len([f for f in LARGE_DIR.iterdir() if f.is_file() and f.suffix.lower() in ['.xlsx', '.xls']])

    return status


def find_file_in_raw_data(filename: str) -> Path | None:
    """
    Search for a file in raw_data and all subdirectories.

    Args:
        filename: Name of the file to find (with or without path)

    Returns:
        Full path to the file if found, None otherwise
    """
    # Extract just the filename if a path was provided
    filename = Path(filename).name

    # Search in root
    root_path = RAW_DATA_DIR / filename
    if root_path.exists():
        return root_path

    # Search in subdirectories
    for subdir in [SMALL_DIR, MEDIUM_DIR, LARGE_DIR]:
        if subdir.exists():
            subdir_path = subdir / filename
            if subdir_path.exists():
                return subdir_path

    return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Organize raw data files by size")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without moving files")
    parser.add_argument("--status", action="store_true", help="Show current organization status")

    args = parser.parse_args()

    if args.status:
        status = check_organization_status()
        log("INFO", f"Current organization status:")
        log("INFO", f"  Root:   {status['root']} files")
        log("INFO", f"  Small:  {status['small']} files")
        log("INFO", f"  Medium: {status['medium']} files")
        log("INFO", f"  Large:  {status['large']} files")
    else:
        organize_files(dry_run=args.dry_run)
