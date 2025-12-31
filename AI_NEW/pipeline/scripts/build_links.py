"""
Trade Links Builder

Builds the trade_links table from trade_records.
Aggregates relationships between companies.

Functions:
    build_links() -> int
    aggregate_by_parties(exporter: str, importer: str) -> dict
"""

from __future__ import annotations

import os
import time
from typing import Optional

import psycopg2
from psycopg2.extras import execute_values, Json


def build_links(limit: Optional[int] = None, link_types: list[str] = None) -> int:
    """
    Build trade links using multiple strategies.

    Args:
        limit: Maximum number of links per strategy
        link_types: List of link types to build. Options:
            - 'historical': Direct trade relationships from records
            - 'similarity': Cosine similarity on embeddings > 0.85
            - 'geospatial': Companies within 500km
            - 'commodity': Same HS code matches

    Returns:
        Total rows upserted across all strategies
    """
    if link_types is None:
        link_types = ['historical', 'similarity', 'geospatial', 'commodity']

    total_upserted = 0
    if 'historical' in link_types:
        total_upserted += _build_historical_links(limit)
    if 'similarity' in link_types:
        total_upserted += _build_similarity_links(limit)
    if 'geospatial' in link_types:
        total_upserted += _build_geospatial_links(limit)
    if 'commodity' in link_types:
        total_upserted += _build_commodity_links(limit)

    return total_upserted


def _build_historical_links(limit: Optional[int] = None) -> int:
    """
    Build links from historical trade records.

    Returns rows upserted.
    """
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    rows_upserted = 0
    start = time.perf_counter()
    with conn:
        with conn.cursor() as cur:
            # Remove previous name-only rows to avoid duplicates on rerun
            cur.execute(
                "DELETE FROM trade_links WHERE source_company_id IS NULL OR target_company_id IS NULL"
            )
            sql = """
                WITH agg AS (
                    SELECT
                        exporter_name AS source_name,
                        importer_name AS target_name,
                        COUNT(*) AS total_trades,
                        COALESCE(SUM(total_value_usd), 0) AS total_value_usd,
                        MIN(sb_date) AS first_trade_date,
                        MAX(sb_date) AS last_trade_date,
                        ARRAY_AGG(DISTINCT hs_code) FILTER (WHERE hs_code IS NOT NULL) AS hs_codes_traded
                    FROM trade_records
                    WHERE exporter_name IS NOT NULL AND importer_name IS NOT NULL
                    GROUP BY exporter_name, importer_name
                    ORDER BY total_trades DESC
                )
                SELECT
                    agg.source_name,
                    agg.target_name,
                    agg.total_trades,
                    agg.total_value_usd,
                    agg.first_trade_date,
                    agg.last_trade_date,
                    agg.hs_codes_traded,
                    c_src.id AS source_company_id,
                    c_tgt.id AS target_company_id
                FROM agg
                LEFT JOIN companies c_src
                    ON normalize_company_name(agg.source_name) = c_src.name_normalized
                LEFT JOIN companies c_tgt
                    ON normalize_company_name(agg.target_name) = c_tgt.name_normalized
            """
            if limit:
                sql += " LIMIT %s"
                cur.execute(sql, (limit,))
            else:
                cur.execute(sql)
            rows = cur.fetchall()
            if not rows:
                return 0

            resolved = _resolve_company_ids(rows, cur)
            data = [
                (
                    src_id,
                    src_name,
                    tgt_id,
                    tgt_name,
                    "export_to",
                    total_trades,
                    total_value_usd,
                    first_trade,
                    last_trade,
                    hs_codes,
                )
                for (
                    src_id,
                    src_name,
                    tgt_id,
                    tgt_name,
                    total_trades,
                    total_value_usd,
                    first_trade,
                    last_trade,
                    hs_codes,
                ) in resolved
            ]

            insert_sql = """
                INSERT INTO trade_links (
                    source_company_id,
                    source_company_name,
                    target_company_id,
                    target_company_name,
                    link_type,
                    total_trades,
                    total_value_usd,
                    first_trade_date,
                    last_trade_date,
                    hs_codes_traded
                )
                VALUES %s
                ON CONFLICT (source_company_id, target_company_id, link_type) DO UPDATE
                    SET total_trades = EXCLUDED.total_trades,
                        total_value_usd = EXCLUDED.total_value_usd,
                        first_trade_date = LEAST(trade_links.first_trade_date, EXCLUDED.first_trade_date),
                        last_trade_date = GREATEST(trade_links.last_trade_date, EXCLUDED.last_trade_date),
                        hs_codes_traded = EXCLUDED.hs_codes_traded
            """
            execute_values(cur, insert_sql, data, page_size=500)
            rows_upserted = cur.rowcount
            _purge_ai_cache(cur)
    conn.close()
    elapsed = time.perf_counter() - start
    print(f"[build-links:historical] upserted {rows_upserted} rows in {elapsed:.2f}s")
    return rows_upserted


def _build_similarity_links(limit: Optional[int] = None) -> int:
    """
    Build links based on embedding similarity (> 0.85).

    Returns rows upserted.
    """
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    rows_upserted = 0
    start = time.perf_counter()

    with conn:
        with conn.cursor() as cur:
            sql = """
                WITH company_pairs AS (
                    SELECT
                        c1.id AS source_id,
                        c1.name AS source_name,
                        c2.id AS target_id,
                        c2.name AS target_name,
                        1 - (c1.name_embedding <=> c2.name_embedding) AS similarity
                    FROM companies c1
                    CROSS JOIN companies c2
                    WHERE c1.id < c2.id
                        AND c1.name_embedding IS NOT NULL
                        AND c2.name_embedding IS NOT NULL
                        AND 1 - (c1.name_embedding <=> c2.name_embedding) > 0.85
                    ORDER BY similarity DESC
                )
                SELECT * FROM company_pairs
            """
            if limit:
                sql += " LIMIT %s"
                cur.execute(sql, (limit,))
            else:
                cur.execute(sql)

            rows = cur.fetchall()
            if not rows:
                conn.close()
                return 0

            data = [
                (
                    src_id,
                    src_name,
                    tgt_id,
                    tgt_name,
                    "similarity_based",
                    similarity,
                    Json({"similarity": float(similarity)}),
                )
                for src_id, src_name, tgt_id, tgt_name, similarity in rows
            ]

            insert_sql = """
                INSERT INTO trade_links (
                    source_company_id,
                    source_company_name,
                    target_company_id,
                    target_company_name,
                    link_type,
                    relationship_strength,
                    extra
                )
                VALUES %s
                ON CONFLICT (source_company_id, target_company_id, link_type) DO UPDATE
                    SET relationship_strength = EXCLUDED.relationship_strength,
                        extra = EXCLUDED.extra
            """
            execute_values(cur, insert_sql, data, page_size=500)
            rows_upserted = cur.rowcount
            _purge_ai_cache(cur)

    conn.close()
    elapsed = time.perf_counter() - start
    print(f"[build-links:similarity] upserted {rows_upserted} rows in {elapsed:.2f}s")
    return rows_upserted


def _build_geospatial_links(limit: Optional[int] = None, radius_km: int = 500) -> int:
    """
    Build links for companies within geographic proximity.

    Args:
        limit: Max links to create
        radius_km: Distance radius in kilometers

    Returns rows upserted.
    """
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    rows_upserted = 0
    start = time.perf_counter()

    with conn:
        with conn.cursor() as cur:
            sql = f"""
                WITH nearby_companies AS (
                    SELECT
                        c1.id AS source_id,
                        c1.name AS source_name,
                        c2.id AS target_id,
                        c2.name AS target_name,
                        ST_Distance(c1.location, c2.location) / 1000 AS distance_km
                    FROM companies c1
                    CROSS JOIN companies c2
                    WHERE c1.id < c2.id
                        AND c1.location IS NOT NULL
                        AND c2.location IS NOT NULL
                        AND ST_DWithin(c1.location, c2.location, {radius_km * 1000})
                    ORDER BY distance_km
                )
                SELECT * FROM nearby_companies
            """
            if limit:
                sql += " LIMIT %s"
                cur.execute(sql, (limit,))
            else:
                cur.execute(sql)

            rows = cur.fetchall()
            if not rows:
                conn.close()
                return 0

            data = [
                (
                    src_id,
                    src_name,
                    tgt_id,
                    tgt_name,
                    "geospatial_proximity",
                    _distance_strength(distance_km),
                    Json({"distance_km": float(distance_km)}),
                )
                for src_id, src_name, tgt_id, tgt_name, distance_km in rows
            ]

            insert_sql = """
                INSERT INTO trade_links (
                    source_company_id,
                    source_company_name,
                    target_company_id,
                    target_company_name,
                    link_type,
                    relationship_strength,
                    extra
                )
                VALUES %s
                ON CONFLICT (source_company_id, target_company_id, link_type) DO UPDATE
                    SET relationship_strength = EXCLUDED.relationship_strength,
                        extra = EXCLUDED.extra
            """
            execute_values(cur, insert_sql, data, page_size=500)
            rows_upserted = cur.rowcount
            _purge_ai_cache(cur)

    conn.close()
    elapsed = time.perf_counter() - start
    print(f"[build-links:geospatial] upserted {rows_upserted} rows in {elapsed:.2f}s")
    return rows_upserted


def _build_commodity_links(limit: Optional[int] = None) -> int:
    """
    Build links for companies trading same HS codes.

    Returns rows upserted.
    """
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )
    rows_upserted = 0
    start = time.perf_counter()

    with conn:
        with conn.cursor() as cur:
            sql = """
                WITH commodity_matches AS (
                    SELECT
                        c1.id AS source_id,
                        c1.name AS source_name,
                        c2.id AS target_id,
                        c2.name AS target_name,
                        (
                            SELECT COUNT(*)
                            FROM UNNEST(c1.hs_codes_dealt) hs1
                            INNER JOIN UNNEST(c2.hs_codes_dealt) hs2 ON hs1 = hs2
                        ) AS common_hs_codes
                    FROM companies c1
                    CROSS JOIN companies c2
                    WHERE c1.id < c2.id
                        AND c1.hs_codes_dealt IS NOT NULL
                        AND c2.hs_codes_dealt IS NOT NULL
                        AND c1.hs_codes_dealt && c2.hs_codes_dealt
                    ORDER BY common_hs_codes DESC
                )
                SELECT * FROM commodity_matches
                WHERE common_hs_codes > 0
            """
            if limit:
                sql += " LIMIT %s"
                cur.execute(sql, (limit,))
            else:
                cur.execute(sql)

            rows = cur.fetchall()
            if not rows:
                conn.close()
                return 0

            data = [
                (
                    src_id,
                    src_name,
                    tgt_id,
                    tgt_name,
                    "commodity_match",
                    _commodity_strength(common_count),
                    Json({"common_hs_codes": int(common_count)}),
                )
                for src_id, src_name, tgt_id, tgt_name, common_count in rows
            ]

            insert_sql = """
                INSERT INTO trade_links (
                    source_company_id,
                    source_company_name,
                    target_company_id,
                    target_company_name,
                    link_type,
                    relationship_strength,
                    extra
                )
                VALUES %s
                ON CONFLICT (source_company_id, target_company_id, link_type) DO UPDATE
                    SET relationship_strength = EXCLUDED.relationship_strength,
                        extra = EXCLUDED.extra
            """
            execute_values(cur, insert_sql, data, page_size=500)
            rows_upserted = cur.rowcount

    conn.close()
    elapsed = time.perf_counter() - start
    print(f"[build-links:commodity] upserted {rows_upserted} rows in {elapsed:.2f}s")
    return rows_upserted


def _resolve_company_ids(rows, cur):
    """
    Ensure we have company_ids; fallback to trigram name match if normalize match failed.
    rows is list of tuples from the main query.
    """
    resolved = []
    for row in rows:
        (
            source_name,
            target_name,
            total_trades,
            total_value_usd,
            first_trade,
            last_trade,
            hs_codes,
            source_company_id,
            target_company_id,
        ) = row
        src_id = source_company_id
        tgt_id = target_company_id
        if src_id is None:
            src_id = _fuzzy_company_id(cur, source_name)
        if tgt_id is None:
            tgt_id = _fuzzy_company_id(cur, target_name)
        if src_id is None or tgt_id is None:
            continue
        resolved.append(
            (
                src_id,
                source_name,
                tgt_id,
                target_name,
                total_trades,
                total_value_usd,
                first_trade,
                last_trade,
                hs_codes,
            )
        )
    return resolved


def _fuzzy_company_id(cur, name: str):
    if not name:
        return None
    cur.execute(
        """
        SELECT id
        FROM companies
        WHERE name_normalized %% normalize_company_name(%s)
        ORDER BY similarity(name_normalized, normalize_company_name(%s)) DESC
        LIMIT 1
        """,
        (name, name),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    return None


def _purge_ai_cache(cur) -> None:
    """Purge AI cache tables after derived link rebuild."""
    try:
        cur.execute("DELETE FROM ai_cache_link_predictions")
        cur.execute("DELETE FROM ai_cache_trade_scores")
        cur.execute("DELETE FROM ai_cache_analysis_results")
    except Exception:
        pass


def _distance_strength(distance_km: float) -> float:
    """Convert distance to a 0-1 strength score (closer = higher)."""
    if distance_km <= 0:
        return 1.0
    return round(1 / (1 + (distance_km / 1000)), 4)


def _commodity_strength(common_count: int) -> float:
    """Normalize common HS code count into a 0-1 range."""
    if not common_count:
        return 0.0
    return round(min(1.0, common_count / 10), 4)
