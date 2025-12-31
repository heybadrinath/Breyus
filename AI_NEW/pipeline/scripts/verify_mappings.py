"""
Verify new data files against existing field mappings.

Usage (from AI_NEW directory):
    python pipeline/scripts/verify_mappings.py path/to/new_file.xlsx
    python pipeline/scripts/verify_mappings.py raw_data/

This script checks if columns in new data files are covered by the
field mappings. Unmapped columns will go to the 'extra' JSONB field.
"""
import pandas as pd
import sys
from pathlib import Path

# Add AI_NEW root to path for imports
AI_NEW_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(AI_NEW_ROOT))

from shared.db.field_mappings import (
    COMPANY_FIELD_MAPPINGS,
    TRADE_RECORD_FIELD_MAPPINGS,
    PRODUCT_FIELD_MAPPINGS,
    DEAL_FIELD_MAPPINGS,
    detect_data_source_type,
)


def get_all_mapped_columns():
    """Get all source columns from all mappings."""
    mapped = set()
    for mapping in COMPANY_FIELD_MAPPINGS:
        mapped.update(mapping.source_columns)
    for mapping in DEAL_FIELD_MAPPINGS:
        mapped.update(mapping.source_columns)
    for mapping in TRADE_RECORD_FIELD_MAPPINGS:
        mapped.update(mapping.source_columns)
    for mapping in PRODUCT_FIELD_MAPPINGS:
        mapped.update(mapping.source_columns)
    return mapped


def normalize(s):
    """Normalize column name for comparison."""
    return s.lower().replace(' ', '').replace('_', '').replace('.', '').replace('/', '')


def check_file(filepath):
    """Check a file for unmapped columns."""
    mapped = get_all_mapped_columns()
    mapped_norm = {normalize(c): c for c in mapped}

    xl = pd.ExcelFile(filepath)
    results = {
        'file': filepath.name,
        'sheets': [],
        'mapped': [],
        'unmapped': [],
        'total_columns': 0
    }

    for sheet in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet, nrows=5)  # Read a few rows for type detection
        columns = [str(c).strip() for c in df.columns if str(c).strip() and not str(c).startswith('Unnamed')]

        # Detect data type
        target_table, source_type, record_type = detect_data_source_type(columns, filepath.name)

        sheet_result = {
            'name': sheet,
            'target_table': target_table.value,
            'source_type': source_type,
            'record_type': record_type,
            'columns': len(columns)
        }
        results['sheets'].append(sheet_result)
        results['total_columns'] += len(columns)

        for col in columns:
            if normalize(col) in mapped_norm:
                if col not in results['mapped']:
                    results['mapped'].append(col)
            else:
                if col not in results['unmapped']:
                    results['unmapped'].append((sheet, col))

    return results


def print_results(results):
    """Print analysis results."""
    print(f"\n{'='*60}")
    print(f"File: {results['file']}")
    print(f"{'='*60}")

    for sheet in results['sheets']:
        table = sheet['target_table']
        stype = sheet['source_type']
        rtype = f" ({sheet['record_type']})" if sheet['record_type'] else ""
        print(f"\n  Sheet: {sheet['name']}")
        print(f"    -> Target: {table} | Source: {stype}{rtype}")
        print(f"    -> Columns: {sheet['columns']}")

    mapped_count = len(results['mapped'])
    unmapped_count = len(results['unmapped'])
    total = results['total_columns']

    print(f"\n  Summary:")
    print(f"    Mapped columns:   {mapped_count}")
    print(f"    Unmapped columns: {unmapped_count}")

    if unmapped_count > 0:
        print(f"\n  Unmapped columns (will go to 'extra' JSONB):")
        for sheet, col in results['unmapped']:
            print(f"    [{sheet}] {col}")


def main():
    if len(sys.argv) < 2:
        print("Usage (run from AI_NEW directory):")
        print("  python pipeline/scripts/verify_mappings.py <excel_file>")
        print("  python pipeline/scripts/verify_mappings.py <directory>")
        print("\nExamples:")
        print("  python pipeline/scripts/verify_mappings.py raw_data/new_export_data.xlsx")
        print("  python pipeline/scripts/verify_mappings.py raw_data/")
        sys.exit(1)

    target = Path(sys.argv[1])

    if target.is_file():
        files = [target]
    elif target.is_dir():
        files = list(target.glob('*.xlsx'))
        if not files:
            print(f"No Excel files found in {target}")
            sys.exit(1)
    else:
        print(f"Path not found: {target}")
        sys.exit(1)

    print(f"\nAnalyzing {len(files)} file(s)...")

    all_unmapped = set()
    for filepath in files:
        try:
            results = check_file(filepath)
            print_results(results)
            for _, col in results['unmapped']:
                all_unmapped.add(col)
        except Exception as e:
            print(f"\nError processing {filepath.name}: {e}")

    if all_unmapped:
        print(f"\n{'='*60}")
        print(f"TOTAL UNIQUE UNMAPPED COLUMNS: {len(all_unmapped)}")
        print(f"{'='*60}")
        print("\nThese columns are not in field_mappings.py:")
        for col in sorted(all_unmapped, key=str.lower):
            print(f"  - {col}")
        print("\nOptions:")
        print("  1. Add to source_columns in field_mappings.py (if important)")
        print("  2. Leave as-is (will be stored in 'extra' JSONB)")
    else:
        print(f"\n{'='*60}")
        print("ALL COLUMNS ARE MAPPED!")
        print(f"{'='*60}")


if __name__ == '__main__':
    main()
