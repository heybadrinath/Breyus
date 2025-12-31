"""FastAPI Application Entry Point."""

import csv
import json
import logging
import random
import time
from pathlib import Path
from typing import Dict, List, Optional, Set

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import postgres, redis as redis_client
from .dependencies import request_id
from .logger import get_logger, setup_logging
from .middleware import error_handler_middleware, security_headers_middleware
from .routers import analysis, links, trades, commodities
from .services.embedding_service import get_model
from pipeline.scripts.utils import default_manifest, load_manifest

# Initialize enhanced logging
setup_logging()
logger = get_logger(__name__)

start_time = time.time()

app = FastAPI(
    title="Breyus AI Server",
    description="AI services for trade partner matching, scoring, and analysis",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Error handling middleware (must be added first to catch all errors)
app.middleware("http")(error_handler_middleware)

# Security headers middleware
app.middleware("http")(security_headers_middleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "X-API-Key"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Attach request id and basic request logging."""
    rid = request.headers.get("X-Request-ID") or request_id()
    request.state.request_id = rid
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    response.headers["X-Request-ID"] = rid
    # Sampled logging
    if random.random() <= settings.REQUEST_LOG_SAMPLE_RATE:
        logger.info(
            "request",
            extra={
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "request_id": rid,
            },
        )
    return response


@app.on_event("startup")
async def on_startup():
    await postgres.init_db()
    await redis_client.init_redis()

    # Lazy warm-up of embedding model in the background
    try:
        get_model()
    except Exception as exc:  # pragma: no cover
        logger.warning("embedding model warmup failed", exc_info=exc)

    # Start background worker for analysis jobs
    from .workers.analysis_worker import process_analysis_jobs
    import asyncio
    asyncio.create_task(process_analysis_jobs())
    logger.info("Background analysis worker started")

    logger.info("startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    await postgres.close_db()
    await redis_client.close_redis()
    logger.info("shutdown complete")


@app.get("/health")
async def healthcheck(
    include_manifest: bool = False,
    pipeline: Optional[str] = None,
    error_rows_limit: int = 200,
):
    """
    Return detailed health data suitable for monitoring.

    Returns status of all services, database tables, and pipeline progress.
    """
    from datetime import datetime, timezone

    db_ok = await postgres.ping()
    redis_ok = await redis_client.ping()

    # Load manifest for pipeline stats
    manifest_data = default_manifest()
    try:
        manifest_data = load_manifest()
    except Exception as exc:  # pragma: no cover
        logger.warning("manifest load failed", exc_info=exc)

    # Database stats
    table_stats: Dict[str, Dict[str, int]] = {}
    total_records = 0
    if db_ok:
        try:
            table_stats = await postgres.get_table_stats()
            total_records = sum(
                stats.get("count", 0) for stats in table_stats.values()
            )
        except Exception as exc:  # pragma: no cover
            logger.warning("db stats fetch failed", exc_info=exc)

    # Redis stats
    redis_keys = 0
    if redis_ok:
        try:
            redis_keys = await redis_client.count_keys()
        except Exception:
            pass

    # Embedding model status
    embedding_status = "not_loaded"
    embedding_model = settings.EMBEDDING_MODEL
    try:
        model = get_model()
        embedding_status = "loaded"
        embedding_dim = model.get_sentence_embedding_dimension()
    except Exception:
        embedding_dim = 0

    # Pipeline progress
    files_summary = manifest_data.get("summary", {})
    files_by_status = files_summary.get("files_by_status", {})
    pipeline_progress = {
        "files_tracked": files_summary.get("total_files", 0),
        "normalized": files_by_status.get("normalized", 0),
        "inserted": files_by_status.get("in_db", 0),
        "embedded": files_by_status.get("embedded", 0),
        "linked": files_by_status.get("linked", 0),
    }

    # Overall status
    overall_status = "healthy" if db_ok and redis_ok else "degraded"

    response = {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": int(time.time() - start_time),
        "services": {
            "database": {
                "status": "up" if db_ok else "down",
                "tables": len(table_stats),
                "records": total_records,
                "details": table_stats,
            },
            "redis": {
                "status": "up" if redis_ok else "down",
                "keys": redis_keys,
            },
            "embedding_model": {
                "status": embedding_status,
                "model": embedding_model,
                "dimension": embedding_dim,
            },
        },
        "pipeline": pipeline_progress,
    }

    options = _parse_pipeline_options(include_manifest, pipeline)
    if options:
        files = manifest_data.get("files", [])
        summary = manifest_data.get("summary", {})

        summary_data_enabled = "summary_data" in options or "all" in options
        error_data_enabled = "error_data" in options or "all" in options
        include_files = "files" in options or "all" in options
        include_errors = "errors" in options or "all" in options

        files_payload = []
        error_entries = []

        for entry in files:
            summary_data = None
            summary_path = entry.get("summary_path")
            if summary_data_enabled and summary_path:
                try:
                    summary_data = json.loads(Path(summary_path).read_text())
                except Exception:
                    summary_data = None

            if include_files:
                payload = dict(entry)
                if summary_data_enabled:
                    payload["summary_data"] = summary_data
                files_payload.append(payload)

            if include_errors and (entry.get("error_file") or entry.get("errors_path") or entry.get("insert_error")):
                error_rows = None
                error_rows_truncated = False
                error_path = entry.get("error_file") or entry.get("errors_path")
                if error_data_enabled and error_path:
                    error_rows, error_rows_truncated = _read_error_rows(
                        Path(error_path),
                        error_rows_limit,
                    )
                error_entry = {
                    "file_name": entry.get("file_name"),
                    "status": entry.get("status"),
                    "error_file": entry.get("error_file"),
                    "errors_path": entry.get("errors_path"),
                    "insert_error": entry.get("insert_error"),
                    "summary_path": summary_path,
                    "normalized_path": entry.get("normalized_path"),
                }
                if summary_data_enabled:
                    error_entry["summary_data"] = summary_data
                if error_data_enabled:
                    error_entry["error_rows"] = error_rows
                    error_entry["error_rows_truncated"] = error_rows_truncated
                error_entries.append(error_entry)

        response.update({"pipeline_summary": summary})
        if "manifest" in options or "all" in options:
            response["pipeline_manifest"] = manifest_data
        if include_files:
            response["pipeline_files"] = files_payload
        if include_errors:
            response["pipeline_errors"] = error_entries

    return response


def _parse_pipeline_options(include_manifest: bool, pipeline: Optional[str]) -> Set[str]:
    if include_manifest:
        return {"all"}
    if not pipeline:
        return set()
    if pipeline.strip().lower() == "all":
        return {"all"}
    options = {item.strip().lower() for item in pipeline.split(",") if item.strip()}
    allowed = {"manifest", "summary", "files", "errors", "summary_data", "error_data"}
    return options & allowed


def _read_error_rows(path: Path, limit: int) -> tuple[List[Dict[str, str]], bool]:
    if not path.exists():
        return [], False
    rows: List[Dict[str, str]] = []
    truncated = False
    max_rows = None if limit <= 0 else limit
    with path.open("r", encoding="utf-8-sig", errors="ignore", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append(row)
            if max_rows is not None and len(rows) >= max_rows:
                truncated = True
                break
    return rows, truncated


# Routers
app.include_router(links.router)
app.include_router(trades.router)
app.include_router(analysis.router)
app.include_router(commodities.router)


@app.get("/")
async def root():
    return {"status": "running", "service": settings.SERVICE_NAME}


@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics by namespace."""
    from .services.cache_service import CacheService

    stats = await CacheService.get_stats()
    return {
        "statusCode": 200,
        "message": "Cache statistics retrieved",
        "data": stats,
    }
