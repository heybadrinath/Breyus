"""
Database Inserter

Inserts normalized CSV data into PostgreSQL.
Handles deduplication and conflict resolution.

Functions:
    insert_file(csv_path: Path, mapping: Optional[str] = None, best_effort: bool = False) -> InsertResult
    insert_companies(df: DataFrame) -> int
    insert_trade_records(df: DataFrame) -> int
    insert_products(df: DataFrame) -> int
"""

from __future__ import annotations

import json
import os
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any, Iterable

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values, Json
from dotenv import load_dotenv

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

from .dedupe import dedupe_file
from .summarize import summarize_csv
from .utils import (
    MANIFEST_PATH,
    load_manifest,
    save_manifest,
    upsert_file_entry,
    utc_now,
    compute_file_hash,
    update_manifest_summary,
    ensure_dir,
)


@dataclass
class InsertResult:
    file_name: str
    status: str
    rows_inserted: int
    rows_failed: int
    duplicate: bool
    file_hash: str
    summary_path: Optional[str]
    note: Optional[str] = None
    error: Optional[str] = None
    error_file: Optional[str] = None


# Column allowlists for the existing three tables
COMPANY_COLUMNS = {
    "id",
    "name",
    "name_normalized",
    "iec_code",
    "iec_pan",
    "iec_established",
    "entity_types",
    "country",
    "country_code",
    "state",
    "city",
    "pin_code",
    "address_full",
    "address_details",
    "contact_info",
    "business_details",
    "product_categories",
    "hs_codes_dealt",
    "total_exports",
    "total_imports",
    "total_trade_value_usd",
    "countries_traded_with",
    "is_verified",
    "data_source",
    "source_file",
    "source_row_id",
    "name_embedding",
    "profile_embedding",
    "extra",
    "raw_data",
}

ENTITY_COLUMNS = {
    "id",
    "name",
    "name_normalized",
    "entity_type",
    "subtype",
    "description",
    "canonical_table",
    "canonical_id",
    "country",
    "country_code",
    "state",
    "city",
    "address_full",
    "address_details",
    "contact_info",
    "tags",
    "attributes",
    "data_source",
    "source_file",
    "source_row_id",
    "embedding",
    "extra",
    "raw_data",
}

TRADE_COLUMNS = {
    "id",
    "record_type",
    "sb_number",
    "sb_date",
    "reg_date",
    "invoice_number",
    "exporter_id",
    "exporter_name",
    "exporter_address",
    "exporter_iec",
    "importer_id",
    "importer_name",
    "importer_address",
    "supplier_id",
    "supplier_name",
    "supplier_address",
    "consignee_id",
    "consignee_name",
    "consignee_address",
    "consignee_country",
    "hs_code",
    "hs_chapter",
    "ritc_code",
    "product_description",
    "item_description",
    "quantity",
    "unit_of_measurement",
    "net_weight_kg",
    "unit_price",
    "unit_price_usd",
    "unit_price_inr",
    "currency",
    "exchange_rate",
    "total_value_fc",
    "total_value_usd",
    "total_value_inr",
    "fob_value",
    "duty_value",
    "drawback_value",
    "indian_port",
    "indian_port_code",
    "foreign_port",
    "foreign_port_code",
    "mode_of_transport",
    "customs_house_code",
    "origin_country",
    "destination_country",
    "trade_month",
    "trade_year",
    "trade_period",
    "cha_name",
    "shipment_type",
    "shipment_status",
    "product_embedding",
    "trade_details",
    "data_source",
    "source_file",
    "source_sheet",
    "source_row_id",
    "raw_data",
    "extra",
}

PRODUCT_COLUMNS = {
    "id",
    "name",
    "name_normalized",
    "hs_code",
    "hs_chapter",
    "category",
    "subcategory",
    "product_type",
    "consumer_types",
    "price_value",
    "price_unit",
    "price_currency",
    "is_negotiable",
    "packaging_info",
    "weight_value",
    "weight_unit",
    "manufacturer_id",
    "manufacturer_name",
    "city",
    "country",
    "product_embedding",
    "specifications",
    "extra",
    "data_source",
    "source_file",
    "raw_data",
}

JSON_COLUMNS = {"extra", "raw_data", "contact_info", "trade_details", "specifications", "attributes", "address_details"}
ARRAY_COLUMNS = {
    "entity_types",
    "product_categories",
    "hs_codes_dealt",
    "consumer_types",
    "countries_traded_with",
    "tags",
}

ERRORS_DIR = Path(__file__).resolve().parent.parent / "errors"
LARGE_CSV_BYTES = 20 * 1024 * 1024
MISSING_VALUE_SENTINELS = {"", "nan", "none", "null"}


def insert_file(
    csv_path: Path, mapping: Optional[str] = None, best_effort: bool = False
) -> InsertResult:
    """
    Insert a normalized CSV file into PostgreSQL.

    Pipeline:
    1) Summarize file (JSON in pipeline/summaries/)
    2) Whole-file dedupe via data_import_log hash check
    3) If new, perform DB insert and update manifest
    4) If duplicate, move to pipeline/duplicates/ and mark manifest
    """
    manifest = load_manifest(MANIFEST_PATH)
    entry = upsert_file_entry(manifest, csv_path.name)
    entry["mapping"] = mapping
    entry["normalized_path"] = str(csv_path)

    summary_path = summarize_csv(csv_path, mapping=mapping)
    entry["summary_path"] = str(summary_path)
    entry["status"] = "summarized"
    entry["summarized_at"] = utc_now()

    dedupe_result = dedupe_file(csv_path)
    entry["file_hash"] = dedupe_result.file_hash

    if dedupe_result.is_duplicate:
        entry["status"] = "skipped_duplicate"
        entry["skipped_reason"] = dedupe_result.reason
        entry["duplicate_path"] = dedupe_result.moved_to
        update_manifest_summary(manifest)
        save_manifest(manifest, MANIFEST_PATH)
        return InsertResult(
            file_name=csv_path.name,
            status="skipped_duplicate",
            rows_inserted=0,
            rows_failed=0,
            duplicate=True,
            file_hash=dedupe_result.file_hash,
            summary_path=str(summary_path),
            note=dedupe_result.reason,
        )

    try:
        start = time.perf_counter()
        if csv_path.stat().st_size >= LARGE_CSV_BYTES:
            rows_inserted, target_table, rows_failed, error_file = _insert_to_db_stream(
                csv_path, mapping, best_effort=best_effort, file_hash=dedupe_result.file_hash
            )
        else:
            rows_inserted, target_table, rows_failed, error_file = _insert_to_db(
                csv_path, mapping, best_effort=best_effort, file_hash=dedupe_result.file_hash
            )
        entry["rows_inserted"] = rows_inserted
        entry["rows_failed"] = rows_failed
        if error_file:
            entry["error_file"] = str(error_file)
            entry["partial_insert"] = rows_inserted > 0
        if rows_inserted > 0:
            entry["status"] = "in_db"
            entry["db_table"] = target_table
            entry["inserted_at"] = utc_now()
            entry["pending_since"] = None
            entry.pop("insert_error", None)
            if rows_failed == 0:
                entry.pop("error_file", None)
        else:
            entry["status"] = "pending_db_insert"
            entry["pending_since"] = utc_now()
            entry["insert_error"] = "No rows inserted (all failed)"
        update_manifest_summary(manifest)
        save_manifest(manifest, MANIFEST_PATH)
        elapsed = time.perf_counter() - start
        print(
            f"[insert] {csv_path.name}: {rows_inserted} rows -> {target_table} "
            f"(failed={rows_failed}) in {elapsed:.2f}s"
        )
        return InsertResult(
            file_name=csv_path.name,
            status=entry["status"],
            rows_inserted=rows_inserted,
            rows_failed=rows_failed,
            duplicate=False,
            file_hash=dedupe_result.file_hash,
            summary_path=str(summary_path),
            note=f"Inserted into {target_table}",
            error_file=str(error_file) if error_file else None,
        )
    except Exception as exc:  # Keep manifest consistent even on failure
        entry["status"] = "pending_db_insert"
        entry["pending_since"] = utc_now()
        entry["insert_error"] = str(exc)
        update_manifest_summary(manifest)
        save_manifest(manifest, MANIFEST_PATH)
        return InsertResult(
            file_name=csv_path.name,
            status="pending_db_insert",
            rows_inserted=0,
            rows_failed=0,
            duplicate=False,
            file_hash=dedupe_result.file_hash,
            summary_path=str(summary_path),
            note="DB insert failed",
            error=str(exc),
        )


def _detect_target(df: pd.DataFrame, mapping: Optional[str]) -> Tuple[str, List[str]]:
    """Determine target table and allowed columns."""
    map_lower = mapping.lower() if mapping else None
    cols = set(c.lower() for c in df.columns)
    trade_indicators = {
        "exporter_name",
        "importer_name",
        "supplier_name",
        "consignee_name",
        "hs_code",
        "sb_date",
        "reg_date",
        "sb_number",
        "ritc_code",
        "fob_value",
        "total_value_usd",
        "item_description",
    }
    if map_lower == "entities" or "entity_type" in cols or "attributes" in cols:
        return "entities", list(ENTITY_COLUMNS)
    if map_lower in {"trade_records", "deals"} or "record_type" in cols or cols.intersection(trade_indicators):
        return "trade_records", list(TRADE_COLUMNS)
    if map_lower == "products" or "manufacturer_name" in cols or "price_value" in cols:
        return "products", list(PRODUCT_COLUMNS)
    # Default to companies
    return "companies", list(COMPANY_COLUMNS)


def _count_nonempty(df: pd.DataFrame, columns: List[str]) -> int:
    count = 0
    for col in columns:
        series = df[col].astype(str).str.strip().str.lower()
        count += (~series.isin(["", "nan", "none", "null"])).sum()
    return int(count)


def _infer_record_type(df: pd.DataFrame, csv_path: Path) -> str:
    filename_lower = csv_path.name.lower()
    if "import" in filename_lower or "imp" in filename_lower:
        return "import"
    if "export" in filename_lower or "exp" in filename_lower:
        return "export"
    lower_cols = {c.lower() for c in df.columns}
    importer_cols = [c for c in df.columns if c.lower() in {"importer_name", "supplier_name", "consignee_name"}]
    exporter_cols = [c for c in df.columns if c.lower() in {"exporter_name"}]
    importer_nonempty = _count_nonempty(df, importer_cols)
    exporter_nonempty = _count_nonempty(df, exporter_cols)
    if importer_nonempty > exporter_nonempty:
        return "import"
    if exporter_nonempty > 0:
        return "export"
    if "reg_date" in lower_cols:
        return "import"
    if "sb_date" in lower_cols:
        return "export"
    return "export"


def _load_df(csv_path: Path) -> pd.DataFrame:
    return pd.read_csv(csv_path, dtype=str, keep_default_na=False)


def _maybe_json(value: Any) -> Any:
    if value in (None, "", "nan"):
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return value
    return value


def _parse_array(value: Any) -> Optional[List[Any]]:
    if value in (None, "", "nan"):
        return None
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            loaded = json.loads(value)
            if isinstance(loaded, list):
                return loaded
        except Exception:
            pass
        # fallback: comma-separated
        parts = [p.strip() for p in value.split(",") if p.strip()]
        return parts or None
    return None


def _ensure_source_row_id(df: pd.DataFrame, start_index: int = 0) -> None:
    row_ids = pd.Series(
        [str(i) for i in range(start_index + 1, start_index + len(df) + 1)],
        index=df.index,
    )
    if "source_row_id" not in df.columns:
        df["source_row_id"] = row_ids
        return
    col = df["source_row_id"]
    missing = col.isna() | col.astype(str).str.strip().str.lower().isin(MISSING_VALUE_SENTINELS)
    if missing.any():
        df.loc[missing, "source_row_id"] = row_ids[missing]


def _ensure_deterministic_ids(
    df: pd.DataFrame,
    target_table: str,
    file_hash: Optional[str],
    start_index: int = 0,
) -> None:
    if not file_hash:
        return
    _ensure_source_row_id(df, start_index)
    if "id" not in df.columns:
        df["id"] = None
    col = df["id"]
    missing = col.isna() | col.astype(str).str.strip().str.lower().isin(MISSING_VALUE_SENTINELS)
    if not missing.any():
        return
    base = f"{target_table}:{file_hash}:"
    row_ids = df["source_row_id"].astype(str)
    new_ids = row_ids.apply(lambda rid: str(uuid.uuid5(uuid.NAMESPACE_URL, f"{base}{rid}")))
    df.loc[missing, "id"] = new_ids[missing]


def _prep_rows(df: pd.DataFrame, allowed_cols: List[str]) -> Tuple[List[Dict[str, Any]], List[str]]:
    rows = []
    col_order: List[str] = []
    allowed_lower = {c.lower(): c for c in allowed_cols}
    for col in df.columns:
        key = allowed_lower.get(col.lower())
        if key:
            col_order.append(key)
    for _, r in df.iterrows():
        prepared: Dict[str, Any] = {}
        for col in df.columns:
            key = allowed_lower.get(col.lower())
            if not key:
                continue
            val = r[col]
            if val == "":
                val = None
            if key in JSON_COLUMNS:
                val = _maybe_json(val)
                if isinstance(val, (dict, list)):
                    val = Json(val)
            elif key in ARRAY_COLUMNS:
                val = _parse_array(val)
            prepared[key] = val
        rows.append(prepared)
    return rows, col_order


def _execute_values_batched(
    cur,
    sql: str,
    row_values: List[List[Any]],
    page_size: int = 500,
) -> int:
    """
    Execute batched inserts and return total rows inserted.

    execute_values only reports the last batch's rowcount, so we sum per batch.
    """
    inserted = 0
    if not row_values:
        return 0
    for start in range(0, len(row_values), page_size):
        batch = row_values[start:start + page_size]
        execute_values(cur, sql, batch, page_size=len(batch))
        inserted += cur.rowcount
    return inserted


def _insert_to_db(
    csv_path: Path,
    mapping: Optional[str],
    best_effort: bool = False,
    file_hash: Optional[str] = None,
) -> Tuple[int, str, int, Optional[Path]]:
    df = _load_df(csv_path)
    target_table, allowed_cols = _detect_target(df, mapping)
    if target_table == "trade_records":
        record_type_col = None
        for col in df.columns:
            if col.lower() == "record_type":
                record_type_col = col
                break
        if record_type_col is None:
            df["record_type"] = _infer_record_type(df, csv_path)
        else:
            series = df[record_type_col].astype(str).str.strip().str.lower()
            missing = series.isin(["", "nan", "none", "null"])
            if missing.any():
                df.loc[missing, record_type_col] = _infer_record_type(df, csv_path)
    _ensure_deterministic_ids(df, target_table, file_hash)
    rows, col_order = _prep_rows(df, allowed_cols)

    if not rows:
        return 0, target_table, 0, None

    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )

    rows_inserted = 0
    rows_failed = 0
    error_file: Optional[Path] = None
    columns_sql = ", ".join(col_order)
    sql = f"INSERT INTO {target_table} ({columns_sql}) VALUES %s ON CONFLICT (id) DO NOTHING"
    row_values = [[row.get(col) for col in col_order] for row in rows]

    try:
        with conn:
            with conn.cursor() as cur:
                rows_inserted = _execute_values_batched(cur, sql, row_values, page_size=500)
                _log_import(
                    cur,
                    csv_path,
                    rows_inserted=rows_inserted,
                    target_table=target_table,
                    total_rows=len(rows),
                    rows_failed=0,
                )
                _purge_ai_cache(cur)
    except Exception as exc:
        if not best_effort:
            conn.close()
            raise
        conn.rollback()
        print(f"[insert] batch insert failed for {csv_path.name}: {exc}")
        with conn:
            with conn.cursor() as cur:
                rows_inserted, failed_rows = _insert_rows_best_effort(
                    cur,
                    target_table,
                    col_order,
                    rows,
                    df,
                )
                rows_failed = len(failed_rows)
                error_file = _write_insert_errors(csv_path, failed_rows, df.columns)
                _log_import(
                    cur,
                    csv_path,
                    rows_inserted=rows_inserted,
                    target_table=target_table,
                    total_rows=len(rows),
                    rows_failed=rows_failed,
                )
                _purge_ai_cache(cur)
    conn.close()
    return rows_inserted, target_table, rows_failed, error_file


def _insert_to_db_stream(
    csv_path: Path,
    mapping: Optional[str],
    best_effort: bool = False,
    batch_size: int = 5000,
    file_hash: Optional[str] = None,
) -> Tuple[int, str, int, Optional[Path]]:
    sample_df = pd.read_csv(csv_path, dtype=str, keep_default_na=False, nrows=1)
    target_table, allowed_cols = _detect_target(sample_df, mapping)

    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )

    rows_inserted = 0
    rows_failed = 0
    failed_rows: List[Dict[str, Any]] = []
    error_file: Optional[Path] = None
    record_type_default: Optional[str] = None
    row_offset = 0

    try:
        with conn:
            with conn.cursor() as cur:
                for df in pd.read_csv(csv_path, dtype=str, keep_default_na=False, chunksize=batch_size):
                    if target_table == "trade_records":
                        record_type_col = None
                        for col in df.columns:
                            if col.lower() == "record_type":
                                record_type_col = col
                                break
                        if record_type_col is None:
                            if record_type_default is None:
                                record_type_default = _infer_record_type(df, csv_path)
                            df["record_type"] = record_type_default
                        else:
                            series = df[record_type_col].astype(str).str.strip().str.lower()
                            missing = series.isin(["", "nan", "none", "null"])
                            if missing.any():
                                if record_type_default is None:
                                    record_type_default = _infer_record_type(df, csv_path)
                                df.loc[missing, record_type_col] = record_type_default

                    _ensure_deterministic_ids(df, target_table, file_hash, start_index=row_offset)
                    rows, col_order = _prep_rows(df, allowed_cols)
                    if not rows:
                        row_offset += len(df)
                        continue
                    columns_sql = ", ".join(col_order)
                    sql = f"INSERT INTO {target_table} ({columns_sql}) VALUES %s ON CONFLICT (id) DO NOTHING"
                    row_values = [[row.get(col) for col in col_order] for row in rows]
                    try:
                        rows_inserted += _execute_values_batched(
                            cur,
                            sql,
                            row_values,
                            page_size=500,
                        )
                        # Commit per chunk so Ctrl+C keeps prior progress.
                        conn.commit()
                    except Exception as exc:
                        if not best_effort:
                            raise
                        conn.rollback()
                        print(f"[insert] batch insert failed for {csv_path.name}: {exc}")
                        with conn:
                            with conn.cursor() as retry_cur:
                                inserted, failed = _insert_rows_best_effort(
                                    retry_cur, target_table, col_order, rows, df
                                )
                                rows_inserted += inserted
                                rows_failed += len(failed)
                                failed_rows.extend(failed)
                        # Commit best-effort inserts for this chunk.
                        conn.commit()
                    row_offset += len(df)

                _log_import(
                    cur,
                    csv_path,
                    rows_inserted=rows_inserted,
                    target_table=target_table,
                    total_rows=rows_inserted + rows_failed,
                    rows_failed=rows_failed,
                )
                _purge_ai_cache(cur)
    except Exception:
        conn.close()
        raise
    conn.close()

    if failed_rows:
        error_file = _write_insert_errors(csv_path, failed_rows, sample_df.columns)
    return rows_inserted, target_table, rows_failed, error_file


def _log_import(
    cur,
    csv_path: Path,
    rows_inserted: int,
    target_table: str,
    total_rows: int,
    rows_failed: int,
) -> None:
    """Insert a log row into data_import_log if the table exists."""
    status = "completed" if rows_failed == 0 else "completed_with_errors"
    try:
        cur.execute("SAVEPOINT log_import")
        cur.execute(
            """
            INSERT INTO data_import_log (
                file_name, file_path, file_hash,
                import_type, status, total_rows, rows_imported,
                rows_failed, completed_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """,
            (
                csv_path.name,
                str(csv_path),
                compute_file_hash(csv_path),
                target_table,
                status,
                total_rows,
                rows_inserted,
                rows_failed,
            ),
        )
        cur.execute("RELEASE SAVEPOINT log_import")
    except Exception:
        # Swallow logging errors to avoid blocking inserts
        try:
            cur.execute("ROLLBACK TO SAVEPOINT log_import")
        except Exception:
            pass


def _insert_rows_best_effort(
    cur,
    target_table: str,
    col_order: List[str],
    rows: List[Dict[str, Any]],
    df: pd.DataFrame,
) -> Tuple[int, List[Dict[str, Any]]]:
    inserted = 0
    failed_rows: List[Dict[str, Any]] = []
    placeholders = ", ".join(["%s"] * len(col_order))
    sql = (
        f"INSERT INTO {target_table} ({', '.join(col_order)}) "
        f"VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
    )
    for idx, row in enumerate(rows):
        try:
            cur.execute("SAVEPOINT row_insert")
            cur.execute(sql, [row.get(col) for col in col_order])
            cur.execute("RELEASE SAVEPOINT row_insert")
            if cur.rowcount > 0:
                inserted += 1
        except Exception as exc:
            try:
                cur.execute("ROLLBACK TO SAVEPOINT row_insert")
                cur.execute("RELEASE SAVEPOINT row_insert")
            except Exception:
                pass
            err_msg = str(getattr(exc, "pgerror", exc)).strip()
            row_data = {col: df.iloc[idx][col] for col in df.columns}
            row_data["_error"] = err_msg
            failed_rows.append(row_data)
    return inserted, failed_rows


def _write_insert_errors(
    csv_path: Path, failed_rows: Iterable[Dict[str, Any]], columns: Iterable[str]
) -> Optional[Path]:
    failed_list = list(failed_rows)
    if not failed_list:
        return None
    ensure_dir(ERRORS_DIR)
    out_path = ERRORS_DIR / f"{csv_path.stem}_insert_errors.csv"
    output_columns = list(columns) + ["_error"]
    df = pd.DataFrame(failed_list)
    for col in output_columns:
        if col not in df.columns:
            df[col] = None
    df = df[output_columns]
    df.to_csv(out_path, index=False)
    print(f"[insert] wrote {len(df)} failed rows to {out_path}")
    return out_path


def _purge_ai_cache(cur) -> None:
    """Purge AI cache tables after new data imports."""
    try:
        cur.execute("DELETE FROM ai_cache_link_predictions")
        cur.execute("DELETE FROM ai_cache_trade_scores")
        cur.execute("DELETE FROM ai_cache_analysis_results")
    except Exception:
        pass
