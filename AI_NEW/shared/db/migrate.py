"""Simple SQL migration runner for the AI database."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import psycopg2


def _connect():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )


def _ensure_schema_migrations(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )


def _get_applied(cur) -> set[str]:
    cur.execute("SELECT name FROM schema_migrations")
    return {row[0] for row in cur.fetchall()}


def _load_sql(path: Path) -> str:
    return path.read_text()


def _apply_migration(cur, name: str, sql: str) -> None:
    cur.execute(sql)
    cur.execute(
        "INSERT INTO schema_migrations (name) VALUES (%s)",
        (name,),
    )


def _list_migrations(directory: Path) -> list[Path]:
    return sorted(
        [p for p in directory.glob("*.sql") if p.is_file()],
        key=lambda p: p.name,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply SQL migrations.")
    parser.add_argument(
        "--dir",
        default=str(Path(__file__).resolve().parent / "migrations"),
        help="Migrations directory (default: shared/db/migrations)",
    )
    parser.add_argument("--dry-run", action="store_true", help="List pending migrations only")
    args = parser.parse_args()

    migrations_dir = Path(args.dir)
    if not migrations_dir.exists():
        print(f"[migrate] migrations directory not found: {migrations_dir}")
        return 1

    migration_files = _list_migrations(migrations_dir)
    if not migration_files:
        print("[migrate] no migration files found")
        return 0

    conn = _connect()
    try:
        with conn:
            with conn.cursor() as cur:
                _ensure_schema_migrations(cur)
                applied = _get_applied(cur)
                pending = [p for p in migration_files if p.name not in applied]

                if args.dry_run:
                    if not pending:
                        print("[migrate] no pending migrations")
                    else:
                        print("[migrate] pending migrations:")
                        for p in pending:
                            print(f" - {p.name}")
                    return 0

                for path in pending:
                    sql = _load_sql(path)
                    print(f"[migrate] applying {path.name}")
                    _apply_migration(cur, path.name, sql)
                    print(f"[migrate] applied {path.name}")
    except Exception as exc:
        conn.rollback()
        print(f"[migrate] failed: {exc}")
        return 1
    finally:
        conn.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
