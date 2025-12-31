"""
CLI Entry Point for Data Pipeline

Usage:
    python -m pipeline.scripts.cli <command> [options]

Commands:
    organize                    Organize files into small/medium/large subdirectories
    convert <file.xlsx>         Convert Excel to CSV
    normalize <file.csv>        Normalize CSV to schema format
    insert <file.csv>           Insert normalized data to PostgreSQL
    build-links                 Build trade_links from trade_records
    embed [--table TABLE]       Generate vector embeddings
    compute-predictions         Run batch link prediction job
    run-all <file.xlsx>         Run full pipeline for one file (auto-detects location)
    convert-all [--size SIZE]   Convert all raw files (optionally filter by size)
    run-all-pending [--size SIZE]  Process all pending files (optionally filter by size)
    status                      Show manifest summary
    list [--status=STATUS]      List all files and states
    types                       List available data types
    retry-errors                Retry failed rows
    reset                       Clear pipeline outputs and truncate DB tables

Size Filters (for convert-all and run-all-pending):
    --size all                  Process all files (default)
    --size small                Process only files < 2MB
    --size medium               Process only files 2-20MB
    --size large                Process only files > 20MB
    --skip-organize             Skip automatic file organization

Examples:
    # Organize files first
    python -m pipeline.scripts.cli organize

    # Check organization status
    python -m pipeline.scripts.cli organize --status

    # Process only small files
    python -m pipeline.scripts.cli run-all-pending --size small

    # Process medium files without organizing first
    python -m pipeline.scripts.cli convert-all --size medium --skip-organize

    # Process single file (auto-detects if in subdirectory)
    python -m pipeline.scripts.cli run-all "2309 export.xlsx"

    # Check pipeline status
    python -m pipeline.scripts.cli status
"""

from __future__ import annotations

import argparse
import pandas as pd
import sys
from pathlib import Path

from .convert import convert_all_raw, convert_file
from .normalize import NORMALIZED_DIR, normalize_file
from .utils import (
    filter_superseded_xlsx,
    find_split_parts,
    load_manifest,
    log,
    split_base_from_stem,
)
from .build_links import build_links
from .embed import embed_table
from .compute_predictions import compute_all_predictions
from .insert import insert_file
from .reset_pipeline import parse_tables, run_reset
from .organize import organize_files, check_organization_status, find_file_in_raw_data


def cmd_insert(args: argparse.Namespace) -> int:
    result = insert_file(
        Path(args.csv_path), mapping=args.mapping, best_effort=args.best_effort
    )
    print(
        f"[insert] {result.file_name} -> {result.status} | "
        f"rows={result.rows_inserted} failed={result.rows_failed} | "
        f"hash={result.file_hash} | summary={result.summary_path} | note={result.note}"
    )
    if result.error_file:
        print(f"[insert] error file: {result.error_file}")
    return 0


def cmd_normalize(args: argparse.Namespace) -> int:
    normalized_path = normalize_file(Path(args.input_path))
    print(f"[normalize] {args.input_path} -> {normalized_path}")
    return 0


def cmd_normalize_all(_: argparse.Namespace) -> int:
    """Normalize all CSVs under pipeline/csv/, skipping those already up-to-date."""
    csv_dir = Path(__file__).resolve().parent.parent / "csv"
    if not csv_dir.exists():
        print("[normalize-all] no CSV directory found (pipeline/csv/)")
        return 0
    csv_files = sorted(csv_dir.glob("*.csv"))
    if not csv_files:
        print("[normalize-all] no CSV files found in pipeline/csv/")
        return 0

    for csv_path in csv_files:
        normalized_path = NORMALIZED_DIR / f"{csv_path.stem}_normalized.csv"
        try:
            if (
                normalized_path.exists()
                and normalized_path.stat().st_mtime >= csv_path.stat().st_mtime
            ):
                print(f"[normalize-all] skip {csv_path.name} (normalized up-to-date)")
                continue
            out = normalize_file(csv_path)
            print(f"[normalize-all] {csv_path.name} -> {out.name}")
        except Exception as exc:
            print(f"[normalize-all] {csv_path.name} failed: {exc}")
    return 0


def cmd_convert(args: argparse.Namespace) -> int:
    csv_paths = convert_file(Path(args.xlsx_path), force=args.force)
    for p in csv_paths:
        print(f"[convert] {args.xlsx_path} -> {p}")
    return 0


def cmd_convert_all(args: argparse.Namespace) -> int:
    """Convert all raw Excel files, optionally filtering by size category."""
    # Auto-organize files before converting (unless skipped)
    if not args.skip_organize:
        log("INFO", "Auto-organizing files by size before conversion", "convert-all")
        organize_files(dry_run=False)

    # Determine which directories to process
    raw_dir = Path(__file__).resolve().parent.parent.parent / "raw_data"
    size_filter = args.size.lower() if hasattr(args, 'size') else 'all'

    dirs_to_process = []
    if size_filter == 'all':
        dirs_to_process = [raw_dir, raw_dir / "small", raw_dir / "medium", raw_dir / "large"]
    elif size_filter == 'small':
        dirs_to_process = [raw_dir / "small"]
    elif size_filter == 'medium':
        dirs_to_process = [raw_dir / "medium"]
    elif size_filter == 'large':
        dirs_to_process = [raw_dir / "large"]
    else:
        log("ERROR", f"Invalid size filter: {size_filter}. Use: all, small, medium, or large", "convert-all")
        return 1

    log("INFO", f"Converting files from category: {size_filter}", "convert-all")

    # Collect all XLSX files from selected directories
    xlsx_files = []
    for dir_path in dirs_to_process:
        if dir_path.exists():
            xlsx_files.extend(sorted(dir_path.glob("*.xlsx")))

    if not xlsx_files:
        log("INFO", f"No XLSX files found in {size_filter} category", "convert-all")
        return 0

    xlsx_files, skipped = filter_superseded_xlsx(xlsx_files)
    for skipped_path in skipped:
        log(
            "WARNING",
            f"Skipping {skipped_path.name} (split parts detected)",
            "convert-all",
        )
    if not xlsx_files:
        log(
            "INFO",
            f"No XLSX files found in {size_filter} category after filtering",
            "convert-all",
        )
        return 0

    log("INFO", f"Found {len(xlsx_files)} file(s) to convert", "convert-all")

    # Convert each file
    converted_count = 0
    for xlsx_path in xlsx_files:
        try:
            csvs = convert_file(xlsx_path, force=args.force)
            for csv_path in csvs:
                log("INFO", f"{xlsx_path.name} -> {csv_path.name}", "convert-all")
            converted_count += len(csvs)
        except Exception as exc:
            log("ERROR", f"Failed to convert {xlsx_path.name}: {exc}", "convert-all")

    log("INFO", f"Conversion complete: {converted_count} CSV file(s) created", "convert-all")
    return 0


def cmd_run_all(args: argparse.Namespace) -> int:
    """Full pipeline for a single XLSX file: convert -> normalize -> insert."""
    log("INFO", f"Starting full pipeline for: {args.xlsx_path}", "run-all")

    # Auto-detect file location if just filename provided
    xlsx_path = Path(args.xlsx_path)
    if not xlsx_path.exists():
        found_path = find_file_in_raw_data(args.xlsx_path)
        if found_path:
            xlsx_path = found_path
            log("INFO", f"Found file at: {xlsx_path}", "run-all")
        else:
            log("ERROR", f"File not found: {args.xlsx_path}", "run-all")
            return 1

    split_parts = find_split_parts(xlsx_path)
    if split_parts and split_base_from_stem(xlsx_path.stem) is None:
        log(
            "ERROR",
            f"{xlsx_path.name} has split parts ({len(split_parts)}). "
            "Run on the part files instead.",
            "run-all",
        )
        return 1

    # Convert
    log("INFO", "Converting to CSV...", "run-all")
    csvs = convert_file(xlsx_path, force=args.force)
    if not csvs:
        log("ERROR", f"{xlsx_path.name} produced no CSVs (empty sheets?)", "run-all")
        return 1
    first_csv = csvs[0]
    log("INFO", f"Created {len(csvs)} CSV file(s)", "run-all")

    # Normalize
    log("INFO", "Normalizing data...", "run-all")
    norm = normalize_file(first_csv)
    log("INFO", f"Normalized to: {norm.name}", "run-all")

    # Insert
    log("INFO", "Inserting to database...", "run-all")
    result = insert_file(norm, mapping=args.mapping, best_effort=args.best_effort)
    log(
        "INFO",
        f"Status: {result.status}, Rows inserted: {result.rows_inserted}, Failed: {result.rows_failed}",
        "run-all",
    )
    if result.error_file:
        log("INFO", f"Error file: {result.error_file}", "run-all")

    if result.error:
        log("ERROR", f"Insert error: {result.error}", "run-all")
        return 1

    log("INFO", "Pipeline complete!", "run-all")
    return 0


def cmd_run_all_pending(args: argparse.Namespace) -> int:
    """Process all raw XLSX files through full pipeline, optionally filtering by size category."""
    # Auto-organize files before processing (unless skipped)
    if not args.skip_organize:
        log("INFO", "Auto-organizing files by size before processing", "run-all-pending")
        organize_files(dry_run=False)

    # Determine which directories to process
    raw_dir = Path(__file__).resolve().parent.parent.parent / "raw_data"
    size_filter = args.size.lower() if hasattr(args, 'size') else 'all'

    dirs_to_process = []
    if size_filter == 'all':
        dirs_to_process = [raw_dir, raw_dir / "small", raw_dir / "medium", raw_dir / "large"]
    elif size_filter == 'small':
        dirs_to_process = [raw_dir / "small"]
    elif size_filter == 'medium':
        dirs_to_process = [raw_dir / "medium"]
    elif size_filter == 'large':
        dirs_to_process = [raw_dir / "large"]
    else:
        log("ERROR", f"Invalid size filter: {size_filter}. Use: all, small, medium, or large", "run-all-pending")
        return 1

    log("INFO", f"Processing files from category: {size_filter}", "run-all-pending")

    # Collect all XLSX files from selected directories
    xlsx_files = []
    for dir_path in dirs_to_process:
        if dir_path.exists():
            xlsx_files.extend(sorted(dir_path.glob("*.xlsx")))

    if not xlsx_files:
        log("INFO", f"No XLSX files found in {size_filter} category", "run-all-pending")
        return 0

    xlsx_files, skipped = filter_superseded_xlsx(xlsx_files)
    for skipped_path in skipped:
        log(
            "WARNING",
            f"Skipping {skipped_path.name} (split parts detected)",
            "run-all-pending",
        )
    if not xlsx_files:
        log(
            "INFO",
            f"No XLSX files found in {size_filter} category after filtering",
            "run-all-pending",
        )
        return 0

    log("INFO", f"Found {len(xlsx_files)} file(s) to process", "run-all-pending")

    # Process each file
    success_count = 0
    error_count = 0
    total_rows = 0

    for idx, xlsx in enumerate(xlsx_files, 1):
        try:
            log("INFO", f"[{idx}/{len(xlsx_files)}] Processing {xlsx.name}...", "run-all-pending")

            # Convert
            csvs = convert_file(xlsx, force=args.force)
            if not csvs:
                log("WARNING", f"{xlsx.name} skipped (no data)", "run-all-pending")
                continue

            # Normalize
            norm = normalize_file(csvs[0])

            # Insert
            result = insert_file(norm, best_effort=args.best_effort)
            total_rows += result.rows_inserted

            if result.error:
                log("ERROR", f"{xlsx.name} insert error: {result.error}", "run-all-pending")
                error_count += 1
            else:
                log(
                    "INFO",
                    f"{xlsx.name} complete: {result.rows_inserted} rows inserted, failed {result.rows_failed}",
                    "run-all-pending",
                )
                success_count += 1
            if result.error_file:
                log("INFO", f"{xlsx.name} error file: {result.error_file}", "run-all-pending")

        except Exception as exc:
            log("ERROR", f"{xlsx.name} failed: {exc}", "run-all-pending")
            error_count += 1

    # Summary
    log("INFO", f"Processing complete: {success_count} succeeded, {error_count} failed, {total_rows} total rows", "run-all-pending")
    return 0


def cmd_status(_: argparse.Namespace) -> int:
    manifest = load_manifest()
    summary = manifest.get("summary", {})
    files = manifest.get("files", [])
    print(f"Manifest version: {manifest.get('version')}")
    print(f"Total files: {summary.get('total_files', len(files))}")
    print(f"Files by status: {summary.get('files_by_status', {})}")
    return 0


def cmd_list(args: argparse.Namespace) -> int:
    manifest = load_manifest()
    status_filter = args.status
    for entry in manifest.get("files", []):
        if status_filter and entry.get("status") != status_filter:
            continue
        print(
            f"{entry.get('file_name')} :: {entry.get('status')} "
            f"mapping={entry.get('mapping')} hash={entry.get('file_hash')}"
        )
    return 0


def cmd_reconcile_duplicates(_: argparse.Namespace) -> int:
    from .reconcile_duplicates import reconcile_all_duplicates

    inserted = reconcile_all_duplicates()
    print(f"[reconcile-duplicates] inserted {inserted} unique rows from duplicates")
    return 0


def cmd_retry_errors(args: argparse.Namespace) -> int:
    """Retry normalization errors by dropping rows missing required fields and reinserting."""
    errors_dir = Path(__file__).resolve().parent.parent / "errors"
    error_files = sorted(errors_dir.glob("*.csv"))
    if not error_files:
        print("[retry-errors] no error files found in pipeline/errors/")
        return 0
    total_inserted = 0
    for err in error_files:
        try:
            start = time.perf_counter()
            cleaned = _drop_missing_required(err)
            if cleaned is None:
                print(f"[retry-errors] {err.name} skipped (no recoverable rows)")
                continue
            result = insert_file(cleaned, best_effort=args.best_effort)
            print(
                f"[retry-errors] {err.name} -> {cleaned.name} -> {result.status} "
                f"({result.rows_inserted} rows, failed={result.rows_failed})"
            )
            if result.error:
                print(f"[retry-errors] insert error: {result.error}")
            if result.error_file:
                print(f"[retry-errors] error file: {result.error_file}")
            total_inserted += result.rows_inserted
            elapsed = time.perf_counter() - start
            print(f"[retry-errors] processed {err.name} in {elapsed:.2f}s")
        except Exception as exc:
            print(f"[retry-errors] {err.name} failed: {exc}")
    print(f"[retry-errors] total rows inserted: {total_inserted}")
    return 0


def cmd_reset(args: argparse.Namespace) -> int:
    return run_reset(
        yes=args.yes,
        skip_files=args.skip_files,
        skip_db=args.skip_db,
        tables=parse_tables(args.tables),
        dry_run=args.dry_run,
    )


def _drop_missing_required(error_csv: Path) -> Path | None:
    """
    Remove rows flagged for missing required fields (_error contains 'Missing required')
    and write a cleaned CSV for re-insert. Returns path to cleaned file or None if empty.
    """
    df = pd.read_csv(error_csv, dtype=str)
    if df.empty:
        return None
    if "_error" in df.columns:
        df = df[~df["_error"].fillna("").str.contains("Missing required", case=False)]
        if "_error" in df.columns:
            df = df.drop(columns=["_error"])
    # Drop rows where a 'name' column exists but is blank
    name_cols = [c for c in df.columns if c.lower() == "name"]
    for col in name_cols:
        df = df[df[col].notna() & (df[col].astype(str).str.strip() != "")]
    if df.empty:
        return None
    cleaned_path = error_csv.parent / f"retried_{error_csv.name}"
    df.to_csv(cleaned_path, index=False)
    return cleaned_path


def not_implemented(command: str) -> int:
    print(f"[todo] Command '{command}' is not implemented yet.")
    return 1


def cmd_types(_: argparse.Namespace) -> int:
    print("Known mappings:")
    print("- companies (required: name)")
    print("- deals/trade_records (required: none)")
    print("- products (required: name)")
    print("- people (folded into contact_info/extra)")
    print("- investors (folded into extra.parties)")
    print("- rounds (derived aggregates, not stored)")
    print("\nAuto-detect heuristics: filename hints (exp/imp) + presence of exporter/importer/hs_code -> deals;")
    print("product columns -> products; company columns -> companies. Unmapped columns go to extra/raw_data.")
    return 0


def cmd_organize(args: argparse.Namespace) -> int:
    """Organize raw data files into size-based subdirectories."""
    if args.status:
        status = check_organization_status()
        log("INFO", "Current organization status:", "organize")
        log("INFO", f"  Root:   {status['root']} files", "organize")
        log("INFO", f"  Small:  {status['small']} files", "organize")
        log("INFO", f"  Medium: {status['medium']} files", "organize")
        log("INFO", f"  Large:  {status['large']} files", "organize")
    else:
        organize_files(dry_run=args.dry_run)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Data pipeline CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    # Organize command (NEW)
    organize_p = sub.add_parser("organize", help="Organize files by size into subdirectories")
    organize_p.add_argument("--dry-run", action="store_true", help="Show what would be done without moving files")
    organize_p.add_argument("--status", action="store_true", help="Show current organization status")
    organize_p.set_defaults(func=cmd_organize)

    # Existing commands (some stubbed)
    convert_p = sub.add_parser("convert")
    convert_p.add_argument("xlsx_path", help="Path to XLSX file to convert")
    convert_p.add_argument("--force", action="store_true", help="Force re-conversion even if cached")
    convert_p.set_defaults(func=cmd_convert)

    convert_all_p = sub.add_parser("convert-all", help="Convert all raw files (with optional size filter)")
    convert_all_p.add_argument("--size", default="all", choices=["all", "small", "medium", "large"],
                               help="Process only files of specified size category (default: all)")
    convert_all_p.add_argument("--force", action="store_true", help="Force re-conversion even if cached")
    convert_all_p.add_argument("--skip-organize", action="store_true",
                               help="Skip automatic file organization before conversion")
    convert_all_p.set_defaults(func=cmd_convert_all)
    normalize_p = sub.add_parser("normalize")
    normalize_p.add_argument("input_path", help="Path to CSV or XLSX file to normalize")
    normalize_p.set_defaults(func=cmd_normalize)
    normalize_all_p = sub.add_parser("normalize-all")
    normalize_all_p.set_defaults(func=cmd_normalize_all)

    insert_p = sub.add_parser("insert")
    insert_p.add_argument("csv_path", help="Path to normalized CSV")
    insert_p.add_argument("--mapping", help="Optional mapping/type id", default=None)
    insert_p.add_argument(
        "--best-effort",
        action="store_true",
        help="Insert row-by-row on failure and write errors CSV",
    )

    build_links_p = sub.add_parser("build-links")
    build_links_p.add_argument("--limit", type=int, default=None, help="Optional limit for aggregation")
    build_links_p.set_defaults(func=lambda args: print(f"[build-links] upserted {build_links(args.limit)} rows"))

    embed_p = sub.add_parser("embed")
    embed_p.add_argument("--table", default="trade_records", choices=["trade_records", "companies", "products"])
    embed_p.add_argument("--batch-size", type=int, default=1000)
    embed_p.add_argument("--model", default=None, help="Override embedding model name")
    embed_p.set_defaults(
        func=lambda args: print(
            f"[embed] updated {embed_table(args.table, batch_size=args.batch_size, model_name=args.model)} rows"
        )
    )

    compute_p = sub.add_parser("compute-predictions")
    compute_p.add_argument("--limit", type=int, default=500)
    compute_p.set_defaults(
        func=lambda args: print(f"[compute-predictions] upserted {compute_all_predictions(args.limit)} rows")
    )
    run_all_p = sub.add_parser("run-all", help="Process single file through full pipeline")
    run_all_p.add_argument("xlsx_path", help="Path to XLSX to process end-to-end (auto-detects subdirectory)")
    run_all_p.add_argument("--mapping", help="Optional mapping override", default=None)
    run_all_p.add_argument(
        "--best-effort",
        action="store_true",
        help="Insert row-by-row on failure and write errors CSV",
    )
    run_all_p.add_argument("--force", action="store_true", help="Force re-conversion even if cached")
    run_all_p.set_defaults(func=cmd_run_all)

    run_all_pending_p = sub.add_parser("run-all-pending", help="Process all pending files (with optional size filter)")
    run_all_pending_p.add_argument("--size", default="all", choices=["all", "small", "medium", "large"],
                                   help="Process only files of specified size category (default: all)")
    run_all_pending_p.add_argument("--force", action="store_true", help="Force re-conversion even if cached")
    run_all_pending_p.add_argument("--skip-organize", action="store_true",
                                   help="Skip automatic file organization before processing")
    run_all_pending_p.add_argument(
        "--best-effort",
        action="store_true",
        help="Insert row-by-row on failure and write errors CSV",
    )
    run_all_pending_p.set_defaults(func=cmd_run_all_pending)

    status_p = sub.add_parser("status")
    status_p.set_defaults(func=cmd_status)

    list_p = sub.add_parser("list")
    list_p.add_argument("--status", help="Filter by status", default=None)
    list_p.set_defaults(func=cmd_list)

    types_p = sub.add_parser("types")
    types_p.set_defaults(func=cmd_types)
    retry_p = sub.add_parser("retry-errors")
    retry_p.add_argument(
        "--best-effort",
        action="store_true",
        help="Insert row-by-row on failure and write errors CSV",
    )
    retry_p.set_defaults(func=cmd_retry_errors)

    # New stub command for background reconciliation
    reconcile_p = sub.add_parser("reconcile-duplicates")
    reconcile_p.set_defaults(func=cmd_reconcile_duplicates)

    reset_p = sub.add_parser("reset")
    reset_p.add_argument("--yes", action="store_true", help="Execute destructive actions")
    reset_p.add_argument("--skip-files", action="store_true", help="Skip pipeline file cleanup")
    reset_p.add_argument("--skip-db", action="store_true", help="Skip database reset")
    reset_p.add_argument("--dry-run", action="store_true", help="Show actions without applying changes")
    reset_p.add_argument(
        "--tables",
        help="Comma or space-separated list of tables to truncate",
        default=None,
    )
    reset_p.set_defaults(func=cmd_reset)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if hasattr(args, "func"):
        return args.func(args)

    # Route to implemented handlers or stub
    if args.command == "insert":
        return cmd_insert(args)
    if args.command == "convert":
        return cmd_convert(args)
    if args.command == "convert-all":
        return cmd_convert_all(args)
    if args.command == "normalize":
        return cmd_normalize(args)
    if args.command == "normalize-all":
        return cmd_normalize_all(args)
    if args.command == "run-all":
        return cmd_run_all(args)
    if args.command == "run-all-pending":
        return cmd_run_all_pending(args)
    if args.command == "retry-errors":
        return cmd_retry_errors(args)
    if args.command == "types":
        return cmd_types(args)
    return not_implemented(args.command)


if __name__ == "__main__":
    sys.exit(main())
