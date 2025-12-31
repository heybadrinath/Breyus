"""FastAPI dependency helpers."""

import uuid
from typing import AsyncIterator

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

from .config import settings
from .db.postgres import get_db
from .db.redis import get_redis

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """Verify the internal API key."""
    if not settings.AI_API_KEY:
        # If unset, allow for local/dev but warn.
        return api_key or ""
    if api_key != settings.AI_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key


async def db_conn() -> AsyncIterator:
    """Yield a database connection from the pool."""
    async with get_db() as conn:
        yield conn


async def redis_client():
    """Yield the Redis client."""
    return await get_redis()


def request_id() -> str:
    """Generate a request ID for logging/trace stitching."""
    return str(uuid.uuid4())
