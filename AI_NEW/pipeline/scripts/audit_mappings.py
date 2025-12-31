"""
Generate mapping audit report for all CSV files in pipeline/csv/.

This script analyzes each CSV file and checks:
- Field mapping coverage
- Column quality issues (unnamed, trailing spaces)
- Missing critical fields
- Data source detection

Output: pipeline/mapping_audit_report.md
"""

import pandas as pd
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple
from collections import defaultdict

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


def normalize_column(s: str) -> str:
    """Normalize column name for comparison."""
    return s.lower().replace(' ', '').replace('_', '').replace('.', '').replace('/', '')


def get_all_mapped_columns() -> Set[str]:
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


def check_column_issues(columns: List[str]) -> List[str]:
    """Check for column quality issues."""
    issues = []

    # Check for unnamed columns
    unnamed = [c for c in columns if 'Unnamed' in str(c)]
    if unnamed:
        if len(unnamed) == len(columns):
            issues.append("warn: header columns are all Unnamed; likely wrong header row")
        else:
            issues.append(f"warn: contains {len(unnamed)} Unnamed column(s)")

    # Check for trailing/leading spaces
    spaced = [c for c in columns if c != c.strip()]
    if spaced:
        sample = ', '.join(spaced[:3])
        issues.append(f"warn: headers with leading/trailing spaces ({sample})")

    return issues


def check_missing_fields(columns: List[str], target_table: str) -> List[str]:
    """Check for missing critical field categories."""
    issues = []
    norm_cols = {normalize_column(c): c for c in columns}

    if target_table == 'deals':
        # Check for party columns
        party_keywords = ['exporter', 'importer', 'consignee', 'supplier']
        has_party = any(kw in ' '.join(norm_cols.keys()) for kw in party_keywords)
        if not has_party:
            issues.append("warn: missing party columns (exporter/importer/consignee/supplier)")

        # Check for product columns
        product_keywords = ['hscode', 'productdescription', 'commodity', 'product']
        has_product = any(kw in ' '.join(norm_cols.keys()) for kw in product_keywords)
        if not has_product:
            issues.append("warn: missing product columns (hs_code/product_description/etc)")

        # Check for date columns
        date_keywords = ['sbdate', 'regdate', 'date', 'shipmentdate']
        has_date = any(kw in ' '.join(norm_cols.keys()) for kw in date_keywords)
        if not has_date:
            issues.append("warn: missing date columns (sb_date/reg_date)")

        # Check for value columns
        value_keywords = ['value', 'fob', 'unitprice', 'price', 'amount']
        has_value = any(kw in ' '.join(norm_cols.keys()) for kw in value_keywords)
        if not has_value:
            issues.append("warn: missing value columns (total_value/fob/unit_price)")

        # Check for quantity/weight
        qty_keywords = ['quantity', 'weight', 'qty', 'netweight', 'grossweight']
        has_qty = any(kw in ' '.join(norm_cols.keys()) for kw in qty_keywords)
        if not has_qty:
            issues.append("warn: missing quantity/weight columns")

    elif target_table == 'products':
        # Check for name/description
        name_keywords = ['name', 'product', 'title', 'description']
        has_name = any(kw in ' '.join(norm_cols.keys()) for kw in name_keywords)
        if not has_name:
            issues.append("warn: missing product name/description columns")

    elif target_table == 'companies':
        # Check for name
        name_keywords = ['name', 'company', 'exporter', 'importer']
        has_name = any(kw in ' '.join(norm_cols.keys()) for kw in name_keywords)
        if not has_name:
            issues.append("warn: missing company name columns")

    return issues


def analyze_file(csv_path: Path) -> Dict:
    """Analyze a single CSV file."""
    result = {
        'file': csv_path.name,
        'path': str(csv_path.relative_to(AI_NEW_ROOT)),
        'status': 'OK',
        'issues': [],
        'columns': 0,
        'mapped': 0,
        'unmapped': [],
        'target_table': None,
        'source_type': None,
        'record_type': None,
    }

    try:
        # Read first few rows to detect structure
        df = pd.read_csv(csv_path, nrows=5, dtype=str)
        columns = [str(c) for c in df.columns]

        # Clean columns (strip but preserve original for unmapped list)
        cleaned_cols = [c.strip() for c in columns if str(c).strip()]

        result['columns'] = len(cleaned_cols)

        # Detect data source
        target_table, source_type, record_type = detect_data_source_type(
            cleaned_cols, csv_path.name
        )
        result['target_table'] = target_table.value
        result['source_type'] = source_type
        result['record_type'] = record_type

        # Get mapped columns
        all_mapped = get_all_mapped_columns()
        mapped_norm = {normalize_column(c): c for c in all_mapped}

        # Check each column
        for col in cleaned_cols:
            if normalize_column(col) in mapped_norm:
                result['mapped'] += 1
            else:
                result['unmapped'].append(col)

        # Calculate coverage
        coverage = (result['mapped'] / result['columns'] * 100) if result['columns'] > 0 else 0

        # Check for issues
        result['issues'].extend(check_column_issues(columns))
        result['issues'].extend(check_missing_fields(cleaned_cols, result['target_table']))

        # Add record type inference note if applicable
        if record_type and source_type == 'other':
            if 'exporter' in csv_path.name.lower():
                result['issues'].append("info: record_type inferred as export (filename)")
            elif 'importer' in csv_path.name.lower():
                result['issues'].append("info: record_type inferred as import (filename)")
            elif result['target_table'] == 'deals':
                # Check data for inference
                sample_df = pd.read_csv(csv_path, nrows=100, dtype=str)
                exporter_cols = [c for c in sample_df.columns if 'exporter' in c.lower()]
                importer_cols = [c for c in sample_df.columns if 'importer' in c.lower()]
                if exporter_cols and not importer_cols:
                    result['issues'].append("info: record_type inferred as export (sample:exporter>0)")
                elif importer_cols and not exporter_cols:
                    result['issues'].append("info: record_type inferred as import (sample:importer>0)")

        # Low coverage warning
        if coverage < 50:
            result['issues'].append(f"warn: low mapping coverage ({coverage:.0f}%)")

        # Filename vs detected mismatch
        fname_lower = csv_path.name.lower()
        if 'product' in fname_lower and result['target_table'] != 'products':
            result['issues'].append("warn: filename suggests products but detected " + result['target_table'])
        if 'company' in fname_lower and result['target_table'] != 'companies':
            result['issues'].append("warn: filename suggests companies but detected " + result['target_table'])

        # Determine status
        blocker_keywords = ['blocker:', 'error:']
        warn_keywords = ['warn:']

        has_blocker = any(any(kw in issue for kw in blocker_keywords) for issue in result['issues'])
        has_warn = any(any(kw in issue for kw in warn_keywords) for issue in result['issues'])

        if has_blocker:
            result['status'] = 'BLOCKER'
        elif has_warn:
            result['status'] = 'WARN'
        else:
            result['status'] = 'OK'

    except Exception as e:
        result['status'] = 'BLOCKER'
        result['issues'].append(f"blocker: failed to read file - {str(e)}")

    return result


def generate_report(results: List[Dict]) -> str:
    """Generate markdown report."""
    lines = ["# Mapping Audit Report", ""]
    lines.append(f"Generated: {datetime.utcnow().isoformat()}Z")
    lines.append("")

    # Summary
    status_counts = defaultdict(int)
    table_counts = defaultdict(int)
    total_files = len(results)

    for r in results:
        status_counts[r['status']] += 1
        if r['target_table']:
            table_counts[r['target_table']] += 1

    lines.append("## Summary")
    lines.append(f"- Total entries (file or sheet): {total_files}")
    lines.append(f"- Status counts: OK={status_counts['OK']}, WARN={status_counts['WARN']}, BLOCKER={status_counts['BLOCKER']}")

    table_str = ', '.join(f"{k}={v}" for k, v in sorted(table_counts.items()))
    lines.append(f"- Target tables: {table_str}")
    lines.append("")

    # File results
    lines.append("## File Results")
    lines.append("")

    for r in sorted(results, key=lambda x: x['file']):
        lines.append(f"### {r['file']}")
        lines.append(f"- Path: {r['path']}")

        # Detection info
        target = r['target_table'] or 'unknown'
        source = r['source_type'] or 'unknown'
        rtype = r['record_type']

        if rtype:
            lines.append(f"- Detected: {target} (source_type={source}, record_type={rtype})")
        else:
            lines.append(f"- Detected: {target} (source_type={source})")

        lines.append(f"- Status: {r['status']}")

        # Coverage
        coverage = (r['mapped'] / r['columns'] * 100) if r['columns'] > 0 else 0
        lines.append(f"- Columns: {r['columns']} | Mapped: {r['mapped']} | Coverage: {coverage:.0f}%")

        # Unmapped columns (sample)
        if r['unmapped']:
            sample = r['unmapped'][:10]
            lines.append(f"- Unmapped columns (sample): {sample}")

        # Issues
        if r['issues']:
            lines.append("- Issues:")
            for issue in r['issues']:
                lines.append(f"  - {issue}")

        lines.append("")

    return '\n'.join(lines)


def main():
    """Run audit on all CSV files."""
    csv_dir = AI_NEW_ROOT / "pipeline" / "csv"

    if not csv_dir.exists():
        print(f"Error: CSV directory not found: {csv_dir}")
        return 1

    csv_files = sorted(csv_dir.glob("*.csv"))

    if not csv_files:
        print(f"No CSV files found in {csv_dir}")
        return 1

    print(f"Analyzing {len(csv_files)} CSV file(s)...")

    results = []
    for csv_path in csv_files:
        print(f"  Analyzing {csv_path.name}...")
        result = analyze_file(csv_path)
        results.append(result)

    # Generate report
    report = generate_report(results)

    # Write to file
    output_path = AI_NEW_ROOT / "pipeline" / "mapping_audit_report.md"
    output_path.write_text(report, encoding='utf-8')

    print(f"\nReport generated: {output_path}")
    print(f"Total files: {len(results)}")
    print(f"Status: OK={sum(1 for r in results if r['status']=='OK')}, "
          f"WARN={sum(1 for r in results if r['status']=='WARN')}, "
          f"BLOCKER={sum(1 for r in results if r['status']=='BLOCKER')}")

    return 0


if __name__ == '__main__':
    sys.exit(main())
