"""
Reconcile duplicate files by performing row-level dedupe and inserting new rows.

Flows:
- Looks for CSVs in pipeline/duplicates/
- Detects target table (trade_records, companies, products)
- Drops rows already present in DB using natural keys
- Inserts the unique rows
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import List, Tuple

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

from .insert import _detect_target, _prep_rows, _load_df

DUP_DIR = Path(__file__).resolve().parent.parent / "duplicates"


def reconcile_all_duplicates() -> int:
    csv_files = sorted(DUP_DIR.glob("*.csv"))
    total_inserted = 0
    start = time.perf_counter()
    for csv_path in csv_files:
        try:
            inserted = reconcile_file(csv_path)
            print(f"[reconcile] {csv_path.name}: inserted {inserted}")
            total_inserted += inserted
        except Exception as exc:
            print(f"[reconcile] {csv_path.name} failed: {exc}")
    elapsed = time.perf_counter() - start
    print(f"[reconcile] total inserted {total_inserted} in {elapsed:.2f}s")
    return total_inserted


def reconcile_file(csv_path: Path) -> int:
    df = _load_df(csv_path)
    target_table, allowed_cols = _detect_target(df, mapping=None)
    df = _drop_existing_rows(df, target_table)
    if df.empty:
        return 0
    rows, col_order = _prep_rows(df, allowed_cols)
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    rows_inserted = 0
    with conn:
        with conn.cursor() as cur:
            sql = f"INSERT INTO {target_table} ({', '.join(col_order)}) VALUES %s"
            execute_values(cur, sql, [[row.get(col) for col in col_order] for row in rows], page_size=500)
            rows_inserted = cur.rowcount
    conn.close()
    return rows_inserted


def _drop_existing_rows(df: pd.DataFrame, target_table: str) -> pd.DataFrame:
    """
    Drop rows already present in DB using natural keys per table.
    """
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    with conn:
        with conn.cursor() as cur:
            if target_table == "trade_records":
                keys = _fetch_existing_trade_keys(cur, df)
                df = df[~df.apply(lambda r: _trade_key(r) in keys, axis=1)]
            elif target_table == "companies":
                keys = _fetch_existing_company_keys(cur, df)
                df = df[~df.apply(lambda r: _company_key(r) in keys, axis=1)]
            elif target_table == "products":
                keys = _fetch_existing_product_keys(cur, df)
                df = df[~df.apply(lambda r: _product_key(r) in keys, axis=1)]
            else:
                df = df
    conn.close()
    return df


def _fetch_existing_trade_keys(cur, df: pd.DataFrame) -> set:
    cur.execute(
        """
        SELECT record_type, sb_number, sb_date, exporter_name, importer_name, hs_code, quantity, total_value_usd
        FROM trade_records
        """
    )
    return {_trade_key_dict(dict(zip(
        ["record_type", "sb_number", "sb_date", "exporter_name", "importer_name", "hs_code", "quantity", "total_value_usd"],
        row
    ))) for row in cur.fetchall()}


def _trade_key(row: pd.Series) -> tuple:
    return _trade_key_dict(row.to_dict())


def _trade_key_dict(row: dict) -> tuple:
    return (
        (row.get("record_type") or "").strip().lower(),
        (row.get("sb_number") or "").strip().lower(),
        (row.get("sb_date") or "").strip().lower(),
        (row.get("exporter_name") or "").strip().lower(),
        (row.get("importer_name") or "").strip().lower(),
        (row.get("hs_code") or "").strip().lower(),
        str(row.get("quantity") or "").strip().lower(),
        str(row.get("total_value_usd") or "").strip().lower(),
    )


def _fetch_existing_company_keys(cur, df: pd.DataFrame) -> set:
    cur.execute(
        """
        SELECT normalize_company_name(name), country, iec_code
        FROM companies
        """
    )
    return {(
        (row[0] or "").strip().lower(),
        (row[1] or "").strip().lower(),
        (row[2] or "").strip().lower(),
    ) for row in cur.fetchall()}


def _company_key(row: pd.Series) -> tuple:
    name = (row.get("name") or "").strip().lower()
    country = (row.get("country") or "").strip().lower()
    iec = (row.get("iec_code") or "").strip().lower()
    return (name, country, iec)


def _fetch_existing_product_keys(cur, df: pd.DataFrame) -> set:
    cur.execute(
        """
        SELECT name, hs_code
        FROM products
        """
    )
    return {(
        (row[0] or "").strip().lower(),
        (row[1] or "").strip().lower(),
    ) for row in cur.fetchall()}


def _product_key(row: pd.Series) -> tuple:
    name = (row.get("name") or "").strip().lower()
    hs_code = (row.get("hs_code") or "").strip().lower()
    return (name, hs_code)
