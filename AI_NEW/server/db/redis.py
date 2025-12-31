"""Redis client helpers."""

import json
import logging
from typing import Any, Dict, Optional

import redis.asyncio as redis

from ..config import settings

logger = logging.getLogger(__name__)

client: Optional[redis.Redis] = None


async def init_redis() -> None:
    """Initialize the Redis client."""
    global client
    if client:
        return
    client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    logger.info("redis client ready", extra={"url": settings.REDIS_URL})


async def close_redis() -> None:
    """Close the Redis client."""
    global client
    if client:
        await client.close()
        client = None
        logger.info("redis client closed")


async def get_redis() -> redis.Redis:
    """Return the client (initializing if needed)."""
    if not client:
        await init_redis()
    assert client
    return client


async def ping() -> bool:
    """Check connectivity."""
    try:
        redis_client = await get_redis()
        return bool(await redis_client.ping())
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("redis ping failed", exc_info=exc)
        return False


async def count_keys() -> int:
    """Count total keys in Redis."""
    try:
        redis_client = await get_redis()
        return await redis_client.dbsize()
    except Exception as exc:  # pragma: no cover
        logger.warning("redis count_keys failed", exc_info=exc)
        return 0


async def set_job_status(job_id: str, status: str, result: Optional[Dict[str, Any]] = None) -> None:
    """Set a job status with optional result payload."""
    redis_client = await get_redis()
    payload = {"status": status}
    if result is not None:
        payload["result"] = result
    await redis_client.setex(
        f"job:{job_id}:status",
        settings.REDIS_JOB_TTL_SEC,
        json.dumps(payload),
    )


async def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get a job status payload."""
    redis_client = await get_redis()
    raw = await redis_client.get(f"job:{job_id}:status")
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


async def cache_response(key: str, value: Dict[str, Any], ttl: Optional[int] = None) -> None:
    """Cache a response with TTL."""
    redis_client = await get_redis()
    await redis_client.setex(
        f"cache:{key}",
        ttl or settings.REDIS_CACHE_TTL_SEC,
        json.dumps(value),
    )


async def get_cached_response(key: str) -> Optional[Dict[str, Any]]:
    """Fetch cached response."""
    redis_client = await get_redis()
    raw = await redis_client.get(f"cache:{key}")
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
