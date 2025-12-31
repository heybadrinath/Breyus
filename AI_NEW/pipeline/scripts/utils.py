"""
Shared helpers for the data pipeline.

Responsibilities:
- Manifest load/save with sensible defaults
- File hashing utilities
- Small I/O helpers (mkdir, JSON read/write)
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

MANIFEST_PATH = Path(__file__).resolve().parent.parent / "manifest.json"


def utc_now() -> str:
    """Return an ISO8601 UTC timestamp."""
    return datetime.now(timezone.utc).isoformat()


def ensure_dir(path: Path) -> None:
    """Create the directory if it does not exist."""
    path.mkdir(parents=True, exist_ok=True)


def load_manifest(path: Path | None = None) -> Dict[str, Any]:
    """Load manifest.json with default structure if missing/empty."""
    manifest_path = path or MANIFEST_PATH
    if not manifest_path.exists():
        return default_manifest()
    try:
        return json.loads(manifest_path.read_text())
    except Exception:
        # Corrupted manifest fallback
        return default_manifest()


def save_manifest(manifest: Dict[str, Any], path: Path | None = None) -> None:
    """Persist manifest to disk."""
    manifest_path = path or MANIFEST_PATH
    manifest_path.write_text(json.dumps(manifest, indent=2))


def default_manifest() -> Dict[str, Any]:
    """Default manifest structure with new summary/dedupe states."""
    return {
        "version": "1.1",
        "files": [],
        "summary": {
            "total_files": 0,
            "total_trade_records": 0,
            "total_companies": 0,
            "total_products": 0,
            "total_embedded": 0,
            "files_by_status": {
                "raw": 0,
                "csv": 0,
                "normalized": 0,
                "summarized": 0,
                "skipped_duplicate": 0,
                "pending_db_insert": 0,
                "in_db": 0,
                "embedded": 0,
            },
            "last_updated": None,
        },
    }


def update_manifest_summary(manifest: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recompute manifest.summary fields based on current files list.
    Preserves existing numeric totals if present; updates counts and last_updated.
    """
    base_summary = default_manifest()["summary"]
    summary = manifest.get("summary") or base_summary
    files = manifest.get("files", [])

    files_by_status: Dict[str, int] = {}
    totals_by_table = {
        "trade_records": 0,
        "companies": 0,
        "products": 0,
    }
    for entry in files:
        status = entry.get("status", "unknown")
        files_by_status[status] = files_by_status.get(status, 0) + 1
        table = entry.get("db_table")
        rows = entry.get("rows_inserted", 0) or 0
        if table in totals_by_table:
            totals_by_table[table] += rows

    # Ensure all known status keys are present
    for key in base_summary["files_by_status"]:
        files_by_status.setdefault(key, 0)
    summary["files_by_status"] = files_by_status
    summary["total_files"] = len(files)
    # Keep existing totals if set; otherwise default to 0
    summary["total_trade_records"] = totals_by_table["trade_records"] or summary.get(
        "total_trade_records", base_summary["total_trade_records"]
    )
    summary["total_companies"] = totals_by_table["companies"] or summary.get(
        "total_companies", base_summary["total_companies"]
    )
    summary["total_products"] = totals_by_table["products"] or summary.get(
        "total_products", base_summary["total_products"]
    )
    summary["total_embedded"] = summary.get("total_embedded", base_summary["total_embedded"])
    summary["last_updated"] = utc_now()
    manifest["summary"] = summary
    return manifest


def upsert_file_entry(manifest: Dict[str, Any], file_name: str) -> Dict[str, Any]:
    """Get or create a file entry by name."""
    files = manifest.setdefault("files", [])
    for entry in files:
        if entry.get("file_name") == file_name:
            return entry
    entry = {
        "file_name": file_name,
        "status": "normalized",
        "created_at": utc_now(),
    }
    files.append(entry)
    # summary recalculated during update_manifest_summary
    return entry


def compute_file_hash(path: Path) -> str:
    """Compute SHA256 hash of a file."""
    sha = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha.update(chunk)
    return sha.hexdigest()


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    """Write JSON payload to path."""
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2))


def read_json(path: Path) -> Dict[str, Any]:
    """Read JSON payload from path."""
    return json.loads(path.read_text())


def log(level: str, message: str, script: str = "pipeline"):
    """
    Simple console logger with timestamp.

    Args:
        level: Log level (INFO, WARNING, ERROR, DEBUG)
        message: Log message
        script: Script name (defaults to "pipeline")
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"{timestamp} [{level}] [{script}] {message}")


def split_base_from_stem(stem: str) -> str | None:
    """
    Return the original base stem for a split XLSX file.

    Expected pattern: <base>__<sheet>_partNN
    """
    if "__" not in stem:
        return None
    base, suffix = stem.split("__", 1)
    if re.search(r"_part\d+$", suffix):
        return base
    return None


def find_split_parts(xlsx_path: Path) -> List[Path]:
    """Find split XLSX parts for a given original XLSX path."""
    pattern = f"{xlsx_path.stem}__*_part*.xlsx"
    return sorted(xlsx_path.parent.glob(pattern))


def filter_superseded_xlsx(paths: Iterable[Path]) -> Tuple[List[Path], List[Path]]:
    """
    Filter out original XLSX files when split parts exist.

    Returns (kept, skipped).
    """
    path_list = list(paths)
    split_bases = set()
    for path in path_list:
        base = split_base_from_stem(path.stem)
        if base:
            split_bases.add(base)

    kept: List[Path] = []
    skipped: List[Path] = []
    for path in path_list:
        if path.stem in split_bases and split_base_from_stem(path.stem) is None:
            skipped.append(path)
            continue
        kept.append(path)
    return kept, skipped
