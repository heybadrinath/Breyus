"""
Normalized CSV summarizer.

Creates a JSON summary for each normalized CSV before insertion:
- file metadata (name, size, hash)
- mapping/type used
- row/column counts
- basic column sample for quick inspection
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

from .utils import compute_file_hash, ensure_dir, utc_now, write_json


SUMMARY_DIR = Path(__file__).resolve().parent.parent / "summaries"


@dataclass
class FileSummary:
    file_name: str
    file_path: str
    mapping: Optional[str]
    file_hash: str
    file_size_bytes: int
    row_count: int
    columns: List[str]
    sample: Dict[str, str]
    created_at: str
    status: str = "pending_db_insert"


def summarize_csv(csv_path: Path, mapping: Optional[str] = None) -> Path:
    """
    Generate a JSON summary for a normalized CSV.

    Returns the path to the summary JSON file.
    """
    ensure_dir(SUMMARY_DIR)
    df = pd.read_csv(csv_path, nrows=25)  # limit rows for sampling
    file_hash = compute_file_hash(csv_path)
    sample_row = df.iloc[0].fillna("").astype(str).to_dict() if not df.empty else {}

    summary = FileSummary(
        file_name=csv_path.name,
        file_path=str(csv_path.resolve()),
        mapping=mapping,
        file_hash=file_hash,
        file_size_bytes=csv_path.stat().st_size,
        row_count=len(df.index),
        columns=list(df.columns),
        sample=sample_row,
        created_at=utc_now(),
    )

    summary_path = SUMMARY_DIR / f"{csv_path.stem}.json"
    write_json(summary_path, asdict(summary))
    return summary_path


def load_summary(summary_path: Path) -> Dict:
    """Load a previously generated summary JSON."""
    return json.loads(summary_path.read_text())
