"""
CSV Normalizer

Normalizes CSV files to match the database schema.
Uses field mappings from shared/db/field_mappings.py.

Functions:
    normalize_file(csv_path: Path, data_type: str = None) -> Path
    detect_data_type(csv_path: Path) -> str
    validate_row(row: dict, data_type: str) -> Tuple[bool, List[str]]
"""

from __future__ import annotations

import csv
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from shared.db import field_mappings as fm

from .utils import (
    MANIFEST_PATH,
    ensure_dir,
    load_manifest,
    save_manifest,
    upsert_file_entry,
    update_manifest_summary,
    utc_now,
)

NORMALIZED_DIR = Path(__file__).resolve().parent.parent / "normalized"
ERROR_DIR = Path(__file__).resolve().parent.parent / "errors"
LARGE_CSV_BYTES = 20 * 1024 * 1024


class NormalizationError(Exception):
    """Raised when normalization fails."""


def _load_dataframe(file_path: Path) -> pd.DataFrame:
    """Load CSV or Excel into a DataFrame with strings preserved where possible."""
    if file_path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(file_path, dtype=str)
    return pd.read_csv(file_path, dtype=str)


def _required_fields_present(normalized: Dict[str, Any], mappings: List[fm.FieldMapping]) -> Tuple[bool, List[str]]:
    """Check required fields as defined on mappings."""
    missing = []
    for m in mappings:
        if m.required and m.target_field not in normalized:
            missing.append(m.target_field)
    return len(missing) == 0, missing


def _fold_contacts(normalized: Dict[str, Any]) -> None:
    """
    Fold loose contact fields into a contact_info JSON compatible with companies table.
    Mutates the dict in place.
    """
    contact_info = {}
    for key, target in [
        ("email", "email"),
        ("phone", "phone"),
        ("mobile", "mobile"),
        ("website", "website"),
        ("contact_person", "contact_person"),
    ]:
        if key in normalized and normalized[key] is not None:
            # store as list for email/phone/mobile to allow multi values
            if key in {"email", "phone", "mobile"}:
                contact_info[target] = [normalized[key]] if not isinstance(normalized[key], list) else normalized[key]
            else:
                contact_info[target] = normalized[key]
            normalized.pop(key, None)
    if contact_info:
        normalized["contact_info"] = contact_info


def _fold_parties_into_extra(normalized: Dict[str, Any]) -> None:
    """Collect party roles into extra.parties for deals/trade_records."""
    parties = []
    for role_key, role_name in [
        ("seller_name", "seller"),
        ("buyer_name", "buyer"),
        ("supplier_name", "supplier"),
        ("consignee_name", "consignee"),
        ("importer_name", "importer"),
        ("exporter_name", "exporter"),
    ]:
        if normalized.get(role_key):
            parties.append({"role": role_name, "name": normalized[role_key]})
    if not parties:
        return
    extra = normalized.setdefault("extra", {})
    if isinstance(extra, str):
        try:
            extra = json.loads(extra)
        except Exception:
            extra = {"_raw_extra": normalized.get("extra")}
        normalized["extra"] = extra
    extra["parties"] = parties


def _normalized_fieldnames(
    target_table: fm.TargetTable,
    mappings: List[fm.FieldMapping],
    record_type: Optional[str],
    entity_type_hint: Optional[str],
) -> List[str]:
    fieldnames: List[str] = []
    for mapping in mappings:
        if mapping.target_field not in fieldnames:
            fieldnames.append(mapping.target_field)
    # Common metadata fields
    for meta in ["data_source", "source_file"]:
        if meta not in fieldnames:
            fieldnames.append(meta)
    if target_table in {fm.TargetTable.DEALS, fm.TargetTable.TRADE_RECORDS} and "record_type" not in fieldnames:
        fieldnames.append("record_type")
    if target_table == fm.TargetTable.ENTITIES and "entity_type" not in fieldnames:
        fieldnames.append("entity_type")
    # JSON fields
    for json_field in ["contact_info", "extra", "raw_data"]:
        if json_field not in fieldnames:
            fieldnames.append(json_field)
    return fieldnames


def _normalize_csv_stream(
    file_path: Path,
    target_table: fm.TargetTable,
    source_type: str,
    record_type: Optional[str],
    entity_type_hint: Optional[str],
    mappings: List[fm.FieldMapping],
) -> tuple[int, int, Path, Optional[Path]]:
    """Stream-normalize large CSV files to avoid loading into memory."""
    ensure_dir(NORMALIZED_DIR)
    ensure_dir(ERROR_DIR)
    normalized_path = NORMALIZED_DIR / f"{file_path.stem}_normalized.csv"
    error_path = ERROR_DIR / f"{file_path.stem}_errors.csv"

    fieldnames = _normalized_fieldnames(target_table, mappings, record_type, entity_type_hint)
    error_fieldnames: Optional[List[str]] = None
    has_errors = False
    ok_count = 0
    error_count = 0

    with file_path.open("r", encoding="utf-8-sig", errors="ignore", newline="") as handle:
        reader = csv.DictReader(handle)
        with normalized_path.open("w", encoding="utf-8", newline="") as norm_out:
            norm_writer = csv.DictWriter(norm_out, fieldnames=fieldnames)
            norm_writer.writeheader()

            error_out = None
            error_writer = None

            for row in reader:
                normalized = fm.normalize_row(row, target_table, mappings)
                ok, missing = _required_fields_present(normalized, mappings)
                if not ok:
                    if error_out is None:
                        error_out = error_path.open("w", encoding="utf-8", newline="")
                        error_fieldnames = list(reader.fieldnames or [])
                        if "_error" not in error_fieldnames:
                            error_fieldnames.append("_error")
                        error_writer = csv.DictWriter(error_out, fieldnames=error_fieldnames)
                        error_writer.writeheader()
                    error_row = dict(row)
                    error_row["_error"] = f"Missing required: {','.join(missing)}"
                    error_writer.writerow(error_row)
                    error_count += 1
                    has_errors = True
                    continue

                normalized["data_source"] = source_type
                normalized["source_file"] = file_path.name
                if target_table in {fm.TargetTable.DEALS, fm.TargetTable.TRADE_RECORDS} and record_type:
                    normalized.setdefault("record_type", record_type)
                if target_table == fm.TargetTable.ENTITIES and entity_type_hint and not normalized.get("entity_type"):
                    normalized["entity_type"] = entity_type_hint

                if target_table in {fm.TargetTable.COMPANIES, fm.TargetTable.ENTITIES}:
                    _fold_contacts(normalized)
                if target_table in {fm.TargetTable.DEALS, fm.TargetTable.TRADE_RECORDS}:
                    _fold_parties_into_extra(normalized)

                for col in ["extra", "raw_data", "contact_info"]:
                    if col in normalized and isinstance(normalized[col], (dict, list)):
                        normalized[col] = json.dumps(normalized[col])

                output_row = {field: normalized.get(field, "") for field in fieldnames}
                norm_writer.writerow(output_row)
                ok_count += 1

            if error_out is not None:
                error_out.close()

    if not has_errors and error_path.exists():
        error_path.unlink(missing_ok=True)
        error_path = None

    return ok_count, error_count, normalized_path, error_path


def normalize_file(file_path: Path, data_type: Optional[str] = None) -> Path:
    """
    Normalize a raw CSV/XLSX file and write a normalized CSV under pipeline/normalized/.

    Returns the path to the normalized CSV.
    """
    start = time.perf_counter()
    # Detect target table and data source
    if file_path.suffix.lower() in {".xlsx", ".xls"}:
        df = _load_dataframe(file_path)
        if df.empty:
            raise NormalizationError(f"No data found in {file_path}")
        target_table, source_type, record_type = fm.detect_data_source_type(list(df.columns), file_path.name)
    else:
        with file_path.open("r", encoding="utf-8-sig", errors="ignore", newline="") as handle:
            reader = csv.reader(handle)
            header = next(reader, [])
        if not header:
            raise NormalizationError(f"No data found in {file_path}")
        target_table, source_type, record_type = fm.detect_data_source_type(header, file_path.name)
    entity_type_hint = None
    if target_table in {fm.TargetTable.PEOPLE, fm.TargetTable.INVESTORS, fm.TargetTable.ROUNDS}:
        entity_type_hint = {
            fm.TargetTable.PEOPLE: "person",
            fm.TargetTable.INVESTORS: "investor",
            fm.TargetTable.ROUNDS: "round",
        }[target_table]
        target_table = fm.TargetTable.ENTITIES
    elif target_table == fm.TargetTable.ENTITIES:
        entity_type_hint = record_type  # record_type carries entity_type hint for entities
        record_type = None

    mappings = fm.get_mappings_for_table(target_table)

    normalized_rows = []
    error_rows = []
    ok_count = 0
    error_count = 0

    normalized_path = NORMALIZED_DIR / f"{file_path.stem}_normalized.csv"
    error_path: Optional[Path] = ERROR_DIR / f"{file_path.stem}_errors.csv"

    if file_path.suffix.lower() == ".csv" and file_path.stat().st_size >= LARGE_CSV_BYTES:
        ok_count, error_count, normalized_path, error_path = _normalize_csv_stream(
            file_path,
            target_table,
            source_type,
            record_type,
            entity_type_hint,
            mappings,
        )
    else:
        df = _load_dataframe(file_path)
        if df.empty:
            raise NormalizationError(f"No data found in {file_path}")
        for _, row in df.iterrows():
            raw_row = row.to_dict()
            normalized = fm.normalize_row(raw_row, target_table, mappings)

            ok, missing = _required_fields_present(normalized, mappings)
            if not ok:
                error_rows.append({**raw_row, "_error": f"Missing required: {','.join(missing)}"})
                continue

            # Add common metadata
            normalized["data_source"] = source_type
            normalized["source_file"] = file_path.name
            if target_table in {fm.TargetTable.DEALS, fm.TargetTable.TRADE_RECORDS} and record_type:
                normalized.setdefault("record_type", record_type)
            if target_table == fm.TargetTable.ENTITIES and entity_type_hint and not normalized.get("entity_type"):
                normalized["entity_type"] = entity_type_hint

            # Fold auxiliary shapes for existing tables (no new tables created)
            if target_table in {fm.TargetTable.COMPANIES, fm.TargetTable.ENTITIES}:
                _fold_contacts(normalized)
            if target_table in {fm.TargetTable.DEALS, fm.TargetTable.TRADE_RECORDS}:
                _fold_parties_into_extra(normalized)

            normalized_rows.append(normalized)

        # Write outputs
        ensure_dir(NORMALIZED_DIR)
        ensure_dir(ERROR_DIR)
        if normalized_rows:
            norm_df = pd.DataFrame(normalized_rows)
            # JSON fields should remain JSON strings for CSV
            for col in ["extra", "raw_data", "contact_info"]:
                if col in norm_df.columns:
                    norm_df[col] = norm_df[col].apply(lambda v: json.dumps(v) if isinstance(v, (dict, list)) else v)
            norm_df.to_csv(normalized_path, index=False)
        else:
            normalized_path.touch()

        if error_rows:
            pd.DataFrame(error_rows).to_csv(error_path, index=False)
        else:
            error_path = None
        ok_count = len(normalized_rows)
        error_count = len(error_rows)

    # Update manifest
    manifest = load_manifest(MANIFEST_PATH)
    entry = upsert_file_entry(manifest, file_path.name)
    entry["normalized_path"] = str(normalized_path)
    entry["errors_path"] = str(error_path) if error_path else None
    entry["status"] = "normalized"
    entry["normalized_at"] = utc_now()
    entry["mapping"] = target_table.value
    entry["record_type"] = record_type
    update_manifest_summary(manifest)
    save_manifest(manifest, MANIFEST_PATH)

    elapsed = time.perf_counter() - start
    print(
        f"[normalize] {file_path.name}: "
        f"{ok_count} rows ok, {error_count} rows errored, took {elapsed:.2f}s"
    )
    return normalized_path


def main(argv: Optional[List[str]] = None) -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Normalize raw CSV/XLSX to canonical schema")
    parser.add_argument("input_path", help="Path to CSV or XLSX file")
    args = parser.parse_args(argv)
    path = Path(args.input_path)
    normalized = normalize_file(path)
    print(f"[normalize] wrote {normalized}")


if __name__ == "__main__":
    main()
