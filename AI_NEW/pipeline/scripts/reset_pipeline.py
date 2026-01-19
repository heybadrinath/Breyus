"""
Reset pipeline state and database data.

This script clears pipeline outputs (csv/normalized/summaries/errors/duplicates),
resets manifest.json to default, and truncates AI Postgres tables.
Raw files in raw_data/ are preserved.
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path
from typing import Iterable, List, Optional

from dotenv import load_dotenv

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

from .utils import MANIFEST_PATH, default_manifest, save_manifest

PIPELINE_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIRS = ("csv", "normalized", "summaries", "errors", "duplicates")
PROTECTED_NAMES = {".gitkeep", ".gitignore"}
DB_TABLES = (
    "companies",
    "trade_records",
    "products",
    "entities",
    "trade_links",
    "predicted_partners",
    "data_import_log",
)


def _deletable_items(path: Path) -> List[Path]:
    if not path.exists():
        return []
    return [
        item
        for item in path.iterdir()
        if item.name not in PROTECTED_NAMES and not item.name.startswith(".git")
    ]


def _clear_dir(path: Path) -> int:
    removed = 0
    for item in _deletable_items(path):
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()
        removed += 1
    return removed


def reset_pipeline_files(dry_run: bool = False) -> None:
    for name in OUTPUT_DIRS:
        path = PIPELINE_ROOT / name
        if dry_run:
            count = len(_deletable_items(path))
            print(f"[reset] would clear {path} ({count} items)")
            continue
        path.mkdir(parents=True, exist_ok=True)
        removed = _clear_dir(path)
        print(f"[reset] cleared {path} ({removed} items)")

    if dry_run:
        print(f"[reset] would reset manifest at {MANIFEST_PATH}")
    else:
        save_manifest(default_manifest(), MANIFEST_PATH)
        print(f"[reset] manifest reset at {MANIFEST_PATH}")


def _existing_tables(cursor, table_names: Iterable[str]) -> List[str]:
    cursor.execute(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY(%s)
        """,
        (list(table_names),),
    )
    return [row[0] for row in cursor.fetchall()]


def reset_database(dry_run: bool = False, tables: Optional[Iterable[str]] = None) -> List[str]:
    target_tables = list(tables) if tables else list(DB_TABLES)
    if dry_run:
        print(f"[reset] would truncate tables: {', '.join(target_tables)}")
        return target_tables

    import psycopg2
    from psycopg2 import sql

    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    truncated: List[str] = []
    with conn:
        with conn.cursor() as cur:
            existing = _existing_tables(cur, target_tables)
            if not existing:
                print("[reset] no target tables found; skipping database reset")
                return []
            missing = sorted(set(target_tables) - set(existing))
            if missing:
                print(f"[reset] skipping missing tables: {', '.join(missing)}")
            query = sql.SQL("TRUNCATE TABLE {} RESTART IDENTITY CASCADE").format(
                sql.SQL(", ").join(sql.Identifier(name) for name in existing)
            )
            cur.execute(query)
            truncated = existing
    conn.close()
    print(f"[reset] truncated tables: {', '.join(truncated)}")
    return truncated


def plan_actions(skip_files: bool, skip_db: bool, tables: Optional[Iterable[str]] = None) -> List[str]:
    actions: List[str] = ["raw_data preserved"]
    if not skip_files:
        actions.append("clear pipeline outputs (csv/normalized/summaries/errors/duplicates)")
        actions.append("reset pipeline/manifest.json to default")
    if not skip_db:
        target_tables = list(tables) if tables else list(DB_TABLES)
        actions.append(f"truncate Postgres tables: {', '.join(target_tables)}")
    return actions


def validate_tables(tables: Optional[Iterable[str]]) -> Optional[List[str]]:
    if not tables:
        return None
    target = [t for t in tables if t]
    unknown = sorted(set(target) - set(DB_TABLES))
    if unknown:
        raise ValueError(f"unsupported tables: {', '.join(unknown)}")
    return target


def parse_tables(value: Optional[str]) -> Optional[List[str]]:
    if not value:
        return None
    parts: List[str] = []
    for chunk in value.split(","):
        for part in chunk.split():
            part = part.strip()
            if part:
                parts.append(part)
    return parts or None


def run_reset(
    *,
    yes: bool,
    skip_files: bool = False,
    skip_db: bool = False,
    tables: Optional[Iterable[str]] = None,
    dry_run: bool = False,
) -> int:
    try:
        validated_tables = validate_tables(tables)
    except ValueError as exc:
        print(f"[reset] {exc}")
        return 1

    actions = plan_actions(skip_files, skip_db, validated_tables)
    if dry_run:
        print("[reset] dry run")
        for action in actions:
            print(f"[reset] would {action}")
        if not skip_files:
            reset_pipeline_files(dry_run=True)
        if not skip_db:
            reset_database(dry_run=True, tables=validated_tables)
        return 0

    if not yes:
        print("[reset] no changes applied")
        for action in actions:
            print(f"[reset] would {action}")
        print("[reset] re-run with --yes to execute")
        return 1

    if not skip_files:
        reset_pipeline_files()
    if not skip_db:
        try:
            reset_database(tables=validated_tables)
        except Exception as exc:
            print(f"[reset] database reset failed: {exc}")
            return 1
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Reset pipeline outputs and AI database.")
    parser.add_argument("--yes", action="store_true", help="Execute destructive actions")
    parser.add_argument("--skip-files", action="store_true", help="Skip pipeline file cleanup")
    parser.add_argument("--skip-db", action="store_true", help="Skip database reset")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without applying changes")
    parser.add_argument(
        "--tables",
        help="Comma or space-separated list of tables to truncate",
        default=None,
    )
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return run_reset(
        yes=args.yes,
        skip_files=args.skip_files,
        skip_db=args.skip_db,
        tables=parse_tables(args.tables),
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    raise SystemExit(main())
