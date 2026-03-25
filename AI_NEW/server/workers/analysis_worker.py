"""Background worker for market analysis jobs."""

import asyncio
import logging
import time
from typing import Dict, Any

from ..config import settings
from ..services.job_queue import JobQueue, JobStatus, complete_analysis_job, fail_analysis_job
from ..services import postgres_cache
from ..config import settings
from ..services.market_analyzer import MarketAnalyzer
from ..db.postgres import get_db

logger = logging.getLogger(__name__)

# Maximum time for a single analysis job (1 hour)
ANALYSIS_TIMEOUT_SECONDS = 3600


async def process_single_job(job: Dict[str, Any]) -> None:
    """
    Process a single analysis job.

    Args:
        job: Job data from queue
    """
    job_id = job["job_id"]
    payload = job["payload"]
    commodity = payload.get("commodity")
    hs_code = payload.get("hs_code")

    start = time.perf_counter()
    logger.info(
        "analysis job start",
        extra={
            "job_id": job_id,
            "commodity": commodity,
            "hs_code": hs_code,
        },
    )

    try:
        # Update status to PROCESSING
        await JobQueue.update_status(job_id, JobStatus.PROCESSING)

        async with get_db() as conn:
            analyzer = MarketAnalyzer(db=conn, redis=None)

            # Add timeout to prevent hanging jobs
            try:
                result = await asyncio.wait_for(
                    analyzer.run_analysis(
                        commodity=payload.get("commodity"),
                        hs_code=payload.get("hs_code"),
                        market_context=payload.get("market_context", {}),
                    ),
                    timeout=ANALYSIS_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                error_msg = f"Analysis timed out after {ANALYSIS_TIMEOUT_SECONDS} seconds"
                logger.error(
                    "analysis job timeout",
                    extra={
                        "job_id": job_id,
                        "commodity": commodity,
                        "hs_code": hs_code,
                        "timeout_seconds": ANALYSIS_TIMEOUT_SECONDS,
                    },
                )
                await fail_analysis_job(job_id, error_msg)
                return

            await postgres_cache.set_analysis_result(
                conn,
                job_id=job_id,
                commodity=payload.get("commodity"),
                hs_code=payload.get("hs_code"),
                request=payload,
                response=result,
                status=JobStatus.COMPLETED,
                ttl_days=settings.TTL_ANALYSIS_DAYS,
            )

        await complete_analysis_job(job_id, result)
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "analysis job completed",
            extra={
                "job_id": job_id,
                "commodity": commodity,
                "hs_code": hs_code,
                "duration_ms": duration_ms,
                "status": JobStatus.COMPLETED,
            },
        )

    except Exception as exc:
        # Mark as failed
        error_msg = f"Analysis failed: {str(exc)}"
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.error(
            "analysis job failed",
            exc_info=True,
            extra={
                "job_id": job_id,
                "commodity": commodity,
                "hs_code": hs_code,
                "duration_ms": duration_ms,
                "status": JobStatus.FAILED,
                "details": {"error": error_msg},
            },
        )
        await fail_analysis_job(job_id, error_msg)


async def process_analysis_jobs(poll_interval: int = 5, max_concurrent: int = 3) -> None:
    """
    Background worker that continuously processes analysis jobs.

    Args:
        poll_interval: Seconds between polling for new jobs
        max_concurrent: Maximum number of jobs to process concurrently
    """
    logger.info(
        "analysis worker started",
        extra={
            "details": {
                "poll_interval": poll_interval,
                "max_concurrent": max_concurrent,
            },
        },
    )

    while True:
        try:
            # Get pending analysis jobs
            pending_jobs = await JobQueue.get_pending_jobs(job_type="market_analysis")

            if pending_jobs:
                logger.info(
                    "analysis jobs pending",
                    extra={"count": len(pending_jobs)},
                )

                # Process up to max_concurrent jobs concurrently
                tasks = []
                for job in pending_jobs[:max_concurrent]:
                    task = asyncio.create_task(process_single_job(job))
                    tasks.append(task)

                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

            # Wait before next poll
            await asyncio.sleep(poll_interval)

        except Exception as exc:
            logger.error(f"Error in analysis worker loop: {exc}", exc_info=True)
            await asyncio.sleep(poll_interval)


def start_analysis_worker_background():
    """
    Start the analysis worker as a background task in the FastAPI app.

    This should be called in the app startup event.
    """
    import asyncio

    try:
        # Get or create event loop
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        # Create background task
        task = loop.create_task(process_analysis_jobs())
        logger.info("Analysis worker background task created")
        return task

    except Exception as exc:
        logger.error(f"Failed to start analysis worker: {exc}", exc_info=True)
        return None
