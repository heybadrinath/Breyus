"""
Partner Prediction Batch Job

Pre-computes partner predictions and stores in predicted_partners table.
Should be run periodically (weekly) or after significant data changes.

Functions:
    compute_all_predictions() -> int
    compute_for_company(company_id: UUID) -> List[dict]
    calculate_prediction_score(company: dict, candidate: dict) -> float
"""

from __future__ import annotations

import math
import os
import time
from typing import List, Tuple

import psycopg2
from psycopg2.extras import execute_values, Json


def compute_all_predictions(limit: int = 500) -> int:
    """
    Compute predictions from trade_links aggregates.
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
            # Remove name-only rows to avoid duplicate inserts on rerun
            cur.execute(
                "DELETE FROM predicted_partners WHERE company_id IS NULL AND partner_company_id IS NULL"
            )
            cur.execute(
                """
                SELECT
                    source_company_id,
                    source_company_name,
                    target_company_id,
                    target_company_name,
                    link_type,
                    total_trades,
                    COALESCE(total_value_usd, 0) as total_value_usd
                FROM trade_links
                WHERE source_company_id IS NOT NULL
                  AND target_company_id IS NOT NULL
                  AND total_trades IS NOT NULL
                  AND total_trades > 0
                ORDER BY total_trades DESC, total_value_usd DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
            predictions = []
            for src_id, src_name, tgt_id, tgt_name, link_type, trades, value_usd in rows:
                prob, confidence = _score(trades, value_usd)
                prediction_type = "buyer_for" if link_type == "export_to" else "seller_for"
                predictions.append(
                    (
                        src_id,
                        src_name,
                        tgt_id,
                        tgt_name,
                        prediction_type,
                        prob,
                        confidence,
                        Json(
                            [
                                {"factor": "trade_links", "weight": 0.6, "score": _score_trades(trades)},
                                {"factor": "value_usd", "weight": 0.4, "score": _score_value(value_usd)},
                            ]
                        ),
                        None,
                        None,
                    )
                )
            if predictions:
                execute_values(
                    cur,
                    """
                    INSERT INTO predicted_partners (
                        company_id,
                        company_name,
                        partner_company_id,
                        partner_company_name,
                        prediction_type,
                        probability_score,
                        confidence_level,
                        prediction_reasons,
                        for_commodity,
                        for_hs_code
                    )
                    VALUES %s
                    ON CONFLICT (company_id, partner_company_id, prediction_type, for_commodity)
                    DO UPDATE SET
                        probability_score = EXCLUDED.probability_score,
                        confidence_level = EXCLUDED.confidence_level,
                        prediction_reasons = EXCLUDED.prediction_reasons,
                        computed_at = NOW()
                    """,
                    predictions,
                    page_size=500,
                )
                rows_upserted = cur.rowcount
                _purge_ai_cache(cur)
    conn.close()
    elapsed = time.perf_counter() - start
    print(f"[compute-predictions] upserted {rows_upserted} in {elapsed:.2f}s")
    return rows_upserted


def _score(trades: int, value_usd: float) -> float:
    trade_score = _score_trades(trades)
    value_score = _score_value(value_usd)
    prob = min(0.99, 0.2 + 0.6 * trade_score + 0.4 * value_score)
    confidence = "high" if prob >= 0.75 else "medium" if prob >= 0.5 else "low"
    return round(prob, 4), confidence


def _score_trades(trades: int) -> float:
    return round(math.tanh((trades or 0) / 10), 4)


def _score_value(value_usd: float) -> float:
    return round(math.tanh((value_usd or 0) / 1_000_000), 4)


def _purge_ai_cache(cur) -> None:
    """Purge AI cache tables after prediction rebuild."""
    try:
        cur.execute("DELETE FROM ai_cache_link_predictions")
        cur.execute("DELETE FROM ai_cache_trade_scores")
        cur.execute("DELETE FROM ai_cache_analysis_results")
    except Exception:
        pass
