"""Redis caching service with TTL management."""

import json
import logging
from typing import Any, Dict, Optional

from ..config import settings
from ..db import redis as redis_client
from ..exceptions import CacheException

logger = logging.getLogger(__name__)


class CacheService:
    """Service for managing cached responses with TTL."""

    # Cache key namespaces with their default TTLs (in seconds)
    NAMESPACES = {
        "links:predict": settings.TTL_LINK_PREDICTION_DAYS * 24 * 3600,
        "trades:score": settings.TTL_TRADE_SCORE_DAYS * 24 * 3600,
        "analysis:job": settings.TTL_ANALYSIS_DAYS * 24 * 3600,
        "analysis:result": settings.TTL_ANALYSIS_DAYS * 24 * 3600,
    }

    @staticmethod
    async def get(key: str) -> Optional[Dict[str, Any]]:
        """
        Get cached value by key.

        Args:
            key: Cache key (can be namespaced like "namespace:key")

        Returns:
            Cached value as dict, or None if not found/expired
        """
        if not settings.CACHE_ENABLED:
            return None
        try:
            client = await redis_client.get_redis()
            raw_value = await client.get(key)

            if raw_value is None:
                logger.debug(f"Cache miss: {key}")
                return None

            # Parse JSON
            value = json.loads(raw_value)
            logger.debug(f"Cache hit: {key}")
            return value

        except json.JSONDecodeError as exc:
            logger.warning(f"Invalid JSON in cache key {key}: {exc}")
            await CacheService.delete(key)  # Clean up invalid data
            return None
        except Exception as exc:
            logger.error(f"Cache get error for key {key}: {exc}")
            raise CacheException(f"Failed to get cached value: {key}", details={"error": str(exc)})

    @staticmethod
    async def set(key: str, value: Dict[str, Any], ttl: Optional[int] = None) -> None:
        """
        Set cached value with TTL.

        Args:
            key: Cache key (namespace:identifier format)
            value: Value to cache (must be JSON-serializable)
            ttl: Time-to-live in seconds (uses namespace default if None)
        """
        if not settings.CACHE_ENABLED:
            return
        try:
            # Determine TTL
            if ttl is None:
                # Extract namespace from key (e.g., "links:predict:123" -> "links:predict")
                namespace = ":".join(key.split(":")[:2])
                ttl = CacheService.NAMESPACES.get(namespace, settings.REDIS_CACHE_TTL_SEC)

            # Serialize value
            serialized = json.dumps(value)

            # Store in Redis
            client = await redis_client.get_redis()
            await client.setex(key, ttl, serialized)

            logger.debug(f"Cache set: {key} (TTL: {ttl}s)")

        except (TypeError, ValueError) as exc:
            logger.error(f"Failed to serialize value for key {key}: {exc}")
            raise CacheException(f"Failed to cache value: {key}", details={"error": str(exc)})
        except Exception as exc:
            logger.error(f"Cache set error for key {key}: {exc}")
            raise CacheException(f"Failed to set cached value: {key}", details={"error": str(exc)})

    @staticmethod
    async def delete(key: str) -> bool:
        """
        Delete cached value.

        Args:
            key: Cache key to delete

        Returns:
            True if key was deleted, False if didn't exist
        """
        if not settings.CACHE_ENABLED:
            return False
        try:
            client = await redis_client.get_redis()
            result = await client.delete(key)
            logger.debug(f"Cache delete: {key} (deleted: {bool(result)})")
            return bool(result)
        except Exception as exc:
            logger.error(f"Cache delete error for key {key}: {exc}")
            raise CacheException(f"Failed to delete cached value: {key}", details={"error": str(exc)})

    @staticmethod
    async def exists(key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key to check

        Returns:
            True if key exists, False otherwise
        """
        if not settings.CACHE_ENABLED:
            return False
        try:
            client = await redis_client.get_redis()
            result = await client.exists(key)
            return bool(result)
        except Exception as exc:
            logger.error(f"Cache exists error for key {key}: {exc}")
            return False

    @staticmethod
    async def get_ttl(key: str) -> int:
        """
        Get remaining TTL for a key.

        Args:
            key: Cache key

        Returns:
            Remaining TTL in seconds, -1 if no expiry, -2 if key doesn't exist
        """
        if not settings.CACHE_ENABLED:
            return -2
        try:
            client = await redis_client.get_redis()
            ttl = await client.ttl(key)
            return ttl
        except Exception as exc:
            logger.error(f"Cache TTL error for key {key}: {exc}")
            return -2

    @staticmethod
    async def flush_expired() -> int:
        """
        Flush all expired keys (Redis handles this automatically).

        This is a no-op as Redis automatically removes expired keys.
        Included for API completeness.

        Returns:
            0 (Redis handles expiry automatically)
        """
        if not settings.CACHE_ENABLED:
            return 0
        logger.info("Redis handles expiry automatically, no manual flush needed")
        return 0

    @staticmethod
    async def flush_namespace(namespace: str) -> int:
        """
        Delete all keys in a namespace.

        Args:
            namespace: Namespace prefix (e.g., "links:predict")

        Returns:
            Number of keys deleted
        """
        if not settings.CACHE_ENABLED:
            return 0
        try:
            client = await redis_client.get_redis()
            pattern = f"{namespace}:*"

            # Scan for keys matching pattern
            deleted = 0
            cursor = 0
            while True:
                cursor, keys = await client.scan(cursor, match=pattern, count=100)
                if keys:
                    await client.delete(*keys)
                    deleted += len(keys)
                if cursor == 0:
                    break

            logger.info(f"Flushed namespace {namespace}: {deleted} keys deleted")
            return deleted

        except Exception as exc:
            logger.error(f"Error flushing namespace {namespace}: {exc}")
            raise CacheException(f"Failed to flush namespace: {namespace}", details={"error": str(exc)})

    @staticmethod
    async def get_stats() -> Dict[str, Any]:
        """
        Get cache statistics by namespace.

        Returns:
            Dictionary with cache stats
        """
        if not settings.CACHE_ENABLED:
            return {
                "total_keys": 0,
                "by_namespace": {},
                "memory_usage": "disabled",
                "cache_enabled": False,
            }
        try:
            client = await redis_client.get_redis()
            total_keys = await client.dbsize()

            # Count keys by namespace
            by_namespace = {}
            for namespace in CacheService.NAMESPACES.keys():
                pattern = f"{namespace}:*"
                count = 0
                cursor = 0
                while True:
                    cursor, keys = await client.scan(cursor, match=pattern, count=100)
                    count += len(keys)
                    if cursor == 0:
                        break
                by_namespace[namespace] = count

            # Get memory usage
            info = await client.info("memory")
            memory_usage = info.get("used_memory_human", "unknown")

            return {
                "total_keys": total_keys,
                "by_namespace": by_namespace,
                "memory_usage": memory_usage,
            }

        except Exception as exc:
            logger.error(f"Error getting cache stats: {exc}")
            return {
                "total_keys": 0,
                "by_namespace": {},
                "memory_usage": "unknown",
                "error": str(exc),
            }


# Convenience functions for specific cache types

async def cache_link_prediction(buyer_id: str, commodity: str, data: Dict[str, Any]) -> None:
    """Cache link prediction result."""
    key = f"links:predict:{buyer_id}:{commodity}"
    await CacheService.set(key, data)


async def get_cached_link_prediction(buyer_id: str, commodity: str) -> Optional[Dict[str, Any]]:
    """Get cached link prediction."""
    key = f"links:predict:{buyer_id}:{commodity}"
    return await CacheService.get(key)


async def cache_trade_score(buyer_id: str, seller_id: str, commodity: str, data: Dict[str, Any]) -> None:
    """Cache trade score result."""
    key = f"trades:score:{buyer_id}:{seller_id}:{commodity}"
    await CacheService.set(key, data)


async def get_cached_trade_score(buyer_id: str, seller_id: str, commodity: str) -> Optional[Dict[str, Any]]:
    """Get cached trade score."""
    key = f"trades:score:{buyer_id}:{seller_id}:{commodity}"
    return await CacheService.get(key)


async def cache_analysis_job(job_id: str, data: Dict[str, Any]) -> None:
    """Cache analysis job status."""
    key = f"analysis:job:{job_id}"
    await CacheService.set(key, data)


async def get_cached_analysis_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Get cached analysis job."""
    key = f"analysis:job:{job_id}"
    return await CacheService.get(key)


async def cache_analysis_result(job_id: str, data: Dict[str, Any]) -> None:
    """Cache analysis result."""
    key = f"analysis:result:{job_id}"
    await CacheService.set(key, data)


async def get_cached_analysis_result(job_id: str) -> Optional[Dict[str, Any]]:
    """Get cached analysis result."""
    key = f"analysis:result:{job_id}"
    return await CacheService.get(key)
