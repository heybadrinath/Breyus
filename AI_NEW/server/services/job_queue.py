"""Async job queue service for background tasks."""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..config import settings
from ..db import redis as redis_client
from ..exceptions import JobNotFoundException

logger = logging.getLogger(__name__)


class JobStatus:
    """Job status constants."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class JobQueue:
    """Service for managing async background jobs."""

    @staticmethod
    async def create_job(job_type: str, payload: Dict[str, Any]) -> str:
        """
        Create a new async job.

        Args:
            job_type: Type of job (e.g., "market_analysis")
            payload: Job input data

        Returns:
            job_id: Unique job identifier
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        job_data = {
            "job_id": job_id,
            "type": job_type,
            "status": JobStatus.PENDING,
            "created_at": now,
            "updated_at": now,
            "payload": payload,
            "result": None,
            "error": None,
        }

        # Store in Redis with TTL
        client = await redis_client.get_redis()
        key = f"job:{job_id}"
        await client.setex(
            key,
            settings.REDIS_JOB_TTL_SEC,
            json.dumps(job_data)
        )

        logger.info(
            "job created",
            extra={"job_id": job_id, "status": JobStatus.PENDING, "details": {"type": job_type}},
        )
        return job_id

    @staticmethod
    async def update_status(
        job_id: str,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> None:
        """
        Update job status.

        Args:
            job_id: Job identifier
            status: New status (use JobStatus constants)
            result: Result data (for COMPLETED status)
            error: Error message (for FAILED status)
        """
        job = await JobQueue.get_job(job_id)
        if not job:
            raise JobNotFoundException(job_id)

        now = datetime.now(timezone.utc).isoformat()
        job["status"] = status
        job["updated_at"] = now

        if result is not None:
            job["result"] = result

        if error is not None:
            job["error"] = error

        # Update in Redis
        client = await redis_client.get_redis()
        key = f"job:{job_id}"
        await client.setex(
            key,
            settings.REDIS_JOB_TTL_SEC,
            json.dumps(job)
        )

        logger.info(
            "job status updated",
            extra={"job_id": job_id, "status": status},
        )

    @staticmethod
    async def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job data by ID.

        Args:
            job_id: Job identifier

        Returns:
            Job data dict or None if not found
        """
        try:
            client = await redis_client.get_redis()
            key = f"job:{job_id}"
            raw_data = await client.get(key)

            if not raw_data:
                return None

            job_data = json.loads(raw_data)
            return job_data

        except json.JSONDecodeError as exc:
            logger.error(
                "job payload invalid JSON",
                extra={"job_id": job_id, "details": {"error": str(exc)}},
            )
            return None
        except Exception as exc:
            logger.error(
                "job fetch failed",
                extra={"job_id": job_id, "details": {"error": str(exc)}},
            )
            return None

    @staticmethod
    async def list_jobs(status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all jobs, optionally filtered by status.

        Args:
            status: Filter by status (None for all jobs)

        Returns:
            List of job data dictionaries
        """
        try:
            client = await redis_client.get_redis()
            pattern = "job:*"
            jobs = []

            cursor = 0
            while True:
                cursor, keys = await client.scan(cursor, match=pattern, count=100)

                for key in keys:
                    raw_data = await client.get(key)
                    if raw_data:
                        try:
                            job_data = json.loads(raw_data)
                            # Filter by status if specified
                            if status is None or job_data.get("status") == status:
                                jobs.append(job_data)
                        except json.JSONDecodeError:
                            continue

                if cursor == 0:
                    break

            return jobs

        except Exception as exc:
            logger.error("job list failed", extra={"details": {"error": str(exc)}})
            return []

    @staticmethod
    async def delete_job(job_id: str) -> bool:
        """
        Delete a job.

        Args:
            job_id: Job identifier

        Returns:
            True if deleted, False if not found
        """
        try:
            client = await redis_client.get_redis()
            key = f"job:{job_id}"
            result = await client.delete(key)
            logger.info("job deleted", extra={"job_id": job_id})
            return bool(result)
        except Exception as exc:
            logger.error(
                "job delete failed",
                extra={"job_id": job_id, "details": {"error": str(exc)}},
            )
            return False

    @staticmethod
    async def get_pending_jobs(job_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all pending jobs.

        Args:
            job_type: Filter by job type (None for all types)

        Returns:
            List of pending job data
        """
        all_jobs = await JobQueue.list_jobs(status=JobStatus.PENDING)

        if job_type:
            return [j for j in all_jobs if j.get("type") == job_type]

        return all_jobs


# Convenience functions for specific job types

async def create_analysis_job(commodity: str, hs_code: str, market_context: Optional[Dict] = None) -> str:
    """Create a market analysis job."""
    payload = {
        "commodity": commodity,
        "hs_code": hs_code,
        "market_context": market_context or {},
    }
    return await JobQueue.create_job("market_analysis", payload)


async def complete_analysis_job(job_id: str, analysis_result: Dict[str, Any]) -> None:
    """Mark analysis job as completed with results."""
    await JobQueue.update_status(job_id, JobStatus.COMPLETED, result=analysis_result)


async def fail_analysis_job(job_id: str, error_message: str) -> None:
    """Mark analysis job as failed."""
    await JobQueue.update_status(job_id, JobStatus.FAILED, error=error_message)
