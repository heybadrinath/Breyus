"""
Whole-file deduplication utilities.

Checks data_import_log for existing file hashes before insertion.
Duplicates are moved to pipeline/duplicates/ for later row-level reconciliation.
"""

from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import psycopg2
from psycopg2.extras import DictCursor

from .utils import compute_file_hash, ensure_dir, utc_now

DUPLICATES_DIR = Path(__file__).resolve().parent.parent / "duplicates"


@dataclass
class DedupeResult:
    is_duplicate: bool
    file_hash: str
    reason: str
    moved_to: Optional[str] = None


def check_hash_in_db(file_hash: str) -> bool:
    """
    Query data_import_log for an existing hash.
    Relies on POSTGRES_* env vars; returns False if connection fails.
    """
    try:
        conn = psycopg2.connect(
            host=_env("POSTGRES_HOST", "localhost"),
            port=int(_env("POSTGRES_PORT", "5432")),
            dbname=_env("POSTGRES_DB", "breyus_ai"),
            user=_env("POSTGRES_USER", "postgres"),
            password=_env("POSTGRES_PASSWORD", ""),
        )
    except Exception:
        return False

    try:
        with conn, conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute(
                """
                SELECT 1
                FROM data_import_log
                WHERE file_hash = %s
                LIMIT 1
                """,
                (file_hash,),
            )
            return cur.fetchone() is not None
    finally:
        conn.close()


def move_to_duplicates(csv_path: Path) -> str:
    """Move a duplicate file to the duplicates folder."""
    ensure_dir(DUPLICATES_DIR)
    destination = DUPLICATES_DIR / csv_path.name
    shutil.move(str(csv_path), destination)
    return str(destination)


def dedupe_file(csv_path: Path) -> DedupeResult:
    """
    Perform whole-file dedupe check using hash and data_import_log.
    """
    file_hash = compute_file_hash(csv_path)
    if check_hash_in_db(file_hash):
        moved_to = move_to_duplicates(csv_path)
        return DedupeResult(
            is_duplicate=True,
            file_hash=file_hash,
            reason="Hash already present in data_import_log",
            moved_to=moved_to,
        )
    return DedupeResult(
        is_duplicate=False,
        file_hash=file_hash,
        reason="Not found in data_import_log",
        moved_to=None,
    )


def _env(key: str, default: str) -> str:
    """Simple env getter to avoid importing dotenv in the pipeline layer."""
    import os

    return os.getenv(key, default)
