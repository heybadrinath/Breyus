"""PostgreSQL-backed cache for AI responses with TTL."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional


def _expires_at(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


async def get_link_prediction(conn, cache_key: str, commodity: str) -> Optional[Dict[str, Any]]:
    row = await conn.fetchrow(
        """
        SELECT response
        FROM ai_cache_link_predictions
        WHERE cache_key = $1
          AND commodity = $2
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """,
        cache_key,
        commodity,
    )
    return row["response"] if row else None


async def set_link_prediction(conn, cache_key: str, commodity: str, response: Dict[str, Any], ttl_days: int) -> None:
    await conn.execute(
        """
        INSERT INTO ai_cache_link_predictions (cache_key, commodity, response, expires_at)
        VALUES ($1, $2, $3, $4)
        """,
        cache_key,
        commodity,
        json.dumps(response),
        _expires_at(ttl_days),
    )


async def get_trade_score(conn, buyer_key: str, seller_key: str, commodity: str) -> Optional[Dict[str, Any]]:
    row = await conn.fetchrow(
        """
        SELECT response
        FROM ai_cache_trade_scores
        WHERE buyer_key = $1
          AND seller_key = $2
          AND commodity = $3
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """,
        buyer_key,
        seller_key,
        commodity,
    )
    return row["response"] if row else None


async def set_trade_score(
    conn, buyer_key: str, seller_key: str, commodity: str, response: Dict[str, Any], ttl_days: int
) -> None:
    await conn.execute(
        """
        INSERT INTO ai_cache_trade_scores (buyer_key, seller_key, commodity, response, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        """,
        buyer_key,
        seller_key,
        commodity,
        json.dumps(response),
        _expires_at(ttl_days),
    )


async def get_analysis_result(conn, job_id: str) -> Optional[Dict[str, Any]]:
    row = await conn.fetchrow(
        """
        SELECT response, status
        FROM ai_cache_analysis_results
        WHERE job_id = $1
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """,
        job_id,
    )
    if not row:
        return None
    return {"response": row["response"], "status": row["status"]}


async def get_analysis_result_by_request(
    conn,
    commodity: Optional[str],
    hs_code: Optional[str],
    request: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    payload = json.dumps(request, sort_keys=True)
    row = await conn.fetchrow(
        """
        SELECT job_id, response, status
        FROM ai_cache_analysis_results
        WHERE commodity IS NOT DISTINCT FROM $1
          AND hs_code IS NOT DISTINCT FROM $2
          AND request = $3::jsonb
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """,
        commodity,
        hs_code,
        payload,
    )
    if not row:
        return None
    return {
        "job_id": row["job_id"],
        "response": row["response"],
        "status": row["status"],
    }


async def set_analysis_result(
    conn,
    job_id: str,
    commodity: str,
    hs_code: str,
    request: Dict[str, Any],
    response: Dict[str, Any],
    status: str,
    ttl_days: int,
) -> None:
    await conn.execute(
        """
        INSERT INTO ai_cache_analysis_results (
            job_id, commodity, hs_code, request, response, status, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
        job_id,
        commodity,
        hs_code,
        json.dumps(request),
        json.dumps(response),
        status,
        _expires_at(ttl_days),
    )


async def purge_expired(conn) -> int:
    total = 0
    for table in (
        "ai_cache_link_predictions",
        "ai_cache_trade_scores",
        "ai_cache_analysis_results",
    ):
        result = await conn.execute(
            f"DELETE FROM {table} WHERE expires_at <= NOW()"
        )
        try:
            total += int(result.split()[-1])
        except Exception:
            pass
    return total
