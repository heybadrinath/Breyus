"""Async PostgreSQL client helpers."""

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, Iterable, List, Optional, Sequence

import asyncpg

from ..config import settings

logger = logging.getLogger(__name__)

pool: Optional[asyncpg.Pool] = None


async def init_db() -> None:
    """Initialize the global connection pool."""
    global pool
    if pool:
        return
    pool = await asyncpg.create_pool(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        database=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        min_size=settings.POSTGRES_MIN_CONN,
        max_size=settings.POSTGRES_MAX_CONN,
        command_timeout=60,
    )
    logger.info(
        "postgres pool ready",
        extra={
            "db": settings.POSTGRES_DB,
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "pool_min": settings.POSTGRES_MIN_CONN,
            "pool_max": settings.POSTGRES_MAX_CONN,
        },
    )


async def close_db() -> None:
    """Close the global pool."""
    global pool
    if pool:
        await pool.close()
        pool = None
        logger.info("postgres pool closed")


@asynccontextmanager
async def get_db():
    """Yield a DB connection."""
    if not pool:
        await init_db()
    assert pool
    async with pool.acquire() as conn:
        yield conn


async def ping() -> bool:
    """Check basic connectivity."""
    try:
        async with get_db() as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("postgres ping failed", exc_info=exc)
        return False


async def version() -> Optional[str]:
    """Return Postgres version string."""
    try:
        async with get_db() as conn:
            row = await conn.fetchval("SELECT version()")
            return row
    except Exception as exc:  # pragma: no cover
        logger.warning("could not fetch postgres version", exc_info=exc)
        return None


async def find_similar_by_embedding(
    conn: asyncpg.Connection,
    table: str,
    embedding: str,
    limit: int = 10,
    embedding_field: Optional[str] = None,
    allowed_tables: Iterable[str] = ("companies", "entities", "trade_records", "products"),
) -> List[asyncpg.Record]:
    """Find similar records using pgvector cosine distance."""
    if table not in allowed_tables:
        raise ValueError("unsupported table for similarity search")
    embedding_fields_by_table = {
        "companies": ["name_embedding", "profile_embedding"],
        "trade_records": ["product_embedding"],
        "products": ["product_embedding"],
        "entities": ["embedding"],
    }
    name_fields_by_table = {
        "companies": "name",
        "trade_records": "COALESCE(product_description, item_description)",
        "products": "name",
        "entities": "name",
    }
    allowed_fields = embedding_fields_by_table.get(table)
    if not allowed_fields:
        raise ValueError("no embedding fields configured for table")
    selected_field = embedding_field or allowed_fields[0]
    if selected_field not in allowed_fields:
        raise ValueError("unsupported embedding field for table")
    name_field = name_fields_by_table.get(table, "name")
    query = f"""
        SELECT id, {name_field} AS name, {selected_field} AS embedding, {selected_field} <=> $1::vector AS distance
        FROM {table}
        WHERE {selected_field} IS NOT NULL
        ORDER BY {selected_field} <=> $1::vector
        LIMIT {limit}
    """
    return await conn.fetch(query, embedding)


async def find_within_radius(
    conn: asyncpg.Connection,
    table: str,
    lat: float,
    lon: float,
    radius_km: float,
    allowed_tables: Iterable[str] = ("companies", "entities"),
) -> List[asyncpg.Record]:
    """Find records within a radius (km) using PostGIS."""
    if table not in allowed_tables:
        raise ValueError("unsupported table for geospatial search")
    query = f"""
        SELECT id, name, address_full, ST_Distance(
            location,
            ST_MakePoint($1, $2)::geography
        ) / 1000 AS distance_km
        FROM {table}
        WHERE location IS NOT NULL
          AND ST_DWithin(
              geography(ST_MakePoint($1, $2)),
              location,
              $3 * 1000
          )
        ORDER BY distance_km
        LIMIT 20
    """
    return await conn.fetch(query, lon, lat, radius_km)


async def get_pool_stats() -> Dict[str, Any]:
    """Return lightweight pool stats for health dashboards."""
    if not pool:
        return {"initialized": False}
    stats = {
        "initialized": True,
        "min": getattr(pool, "_minsize", None),
        "max": getattr(pool, "_maxsize", None),
    }
    try:
        # _queue holds idle connections; fall back silently if internals change.
        idle = len(getattr(pool, "_queue"))  # type: ignore[arg-type]
        stats["idle"] = idle
    except Exception:
        pass
    return stats


async def get_table_stats(
    tables: Sequence[str] | None = None,
    allowed_tables: Iterable[str] = (
        "companies",
        "trade_records",
        "products",
        "trade_links",
        "predicted_partners",
        "data_import_log",
    ),
) -> Dict[str, Dict[str, int]]:
    """
    Return basic per-table stats (row estimate + total size in bytes).

    Uses pg_class estimates for speed; limited to known tables to avoid injection.
    """
    target_tables = list(tables or allowed_tables)
    for name in target_tables:
        if name not in allowed_tables:
            raise ValueError(f"unsupported table for stats: {name}")

    if not target_tables:
        return {}

    if not pool:
        await init_db()
    assert pool
    query = """
        SELECT relname AS table_name,
               n_live_tup AS row_estimate,
               pg_total_relation_size(relid) AS total_bytes
        FROM pg_stat_all_tables
        WHERE relname = ANY($1::text[])
    """
    stats: Dict[str, Dict[str, int]] = {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, target_tables)
    for row in rows:
        stats[row["table_name"]] = {
            "row_estimate": int(row["row_estimate"]),
            "total_bytes": int(row["total_bytes"]),
            "count": int(row["row_estimate"]),
        }
    return stats
