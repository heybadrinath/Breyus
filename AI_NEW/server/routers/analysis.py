"""
Market Analysis Router

POST /v1/analysis/initiate - Start async market analysis (returns jobId + initial data)
GET /v1/analysis/results/{jobId} - Get analysis results (poll until COMPLETED)

Analysis includes:
- Market overview (export/import sides)
- Supply chain insights
- Ground check (weather, barriers, frequency)
- Price predictions
"""

from fastapi import APIRouter, Depends, HTTPException, Request

from ..dependencies import db_conn, redis_client, verify_api_key
from ..logger import get_logger
from ..models.analysis import (
    AnalysisInitiateResponse,
    AnalysisRequest,
    AnalysisResultResponse,
)
from ..schemas.response import success_response
from ..services.job_queue import JobQueue, create_analysis_job
from ..services import postgres_cache
from ..services.market_analyzer import MarketAnalyzer

router = APIRouter(prefix="/v1/analysis", tags=["analysis"])
logger = get_logger(__name__)


@router.post("/initiate", status_code=202)
async def initiate_analysis(
    request: AnalysisRequest,
    http_request: Request,
    api_key: str = Depends(verify_api_key),
    conn=Depends(db_conn),
):
    """
    Start market analysis job and return job ID + initial data.

    The analysis runs asynchronously. Poll /v1/analysis/results/{jobId}
    to get results.
    """
    market_context = _normalize_market_context(request)
    request_payload = {
        "commodity": request.commodity,
        "hs_code": request.hs_code or "",
        "market_context": market_context,
    }
    cached = await postgres_cache.get_analysis_result_by_request(
        conn,
        request.commodity,
        request.hs_code or "",
        request_payload,
    )
    if cached and cached.get("status") == "COMPLETED":
        job_id = cached["job_id"]
        job_status = cached.get("status") or "COMPLETED"
    else:
        cached = None
        job_id = await create_analysis_job(
            commodity=request.commodity,
            hs_code=request.hs_code or "",
            market_context=market_context,
        )
        job_status = "ACCEPTED"

    # Get initial chart data (synchronous, quick)
    analyzer = MarketAnalyzer(conn, None)
    try:
        initial_data = await analyzer.get_initial_charts(request)
    except Exception as exc:
        initial_data = {}
        logger.warning(
            "analysis initial charts failed",
            exc_info=exc,
            extra={
                "request_id": getattr(http_request.state, "request_id", None),
                "job_id": job_id,
                "commodity": request.commodity,
                "hs_code": request.hs_code or "",
            },
        )

    chart_labels = initial_data.get("price_trend", {}).get("labels", []) or []
    logger.info(
        "analysis job accepted",
        extra={
            "request_id": getattr(http_request.state, "request_id", None),
            "job_id": job_id,
            "commodity": request.commodity,
            "hs_code": request.hs_code or "",
            "details": {
                "role": market_context.get("role"),
                "charts_points": len(chart_labels),
                "top_exporters": len(initial_data.get("top_exporters", []) or []),
                "top_importers": len(initial_data.get("top_importers", []) or []),
                "cached": bool(cached),
            },
        },
    )

    return success_response(
        data={
            "jobId": job_id,
            "status": job_status,
            "commodity": request.commodity,
            "hs_code": request.hs_code,
            "initial_charts": initial_data,
        },
        message="Market analysis job created",
        status_code=202
    )


@router.get("/results/{job_id}")
async def get_analysis_results(
    job_id: str,
    http_request: Request,
    api_key: str = Depends(verify_api_key),
    conn=Depends(db_conn),
):
    """
    Get results of a market analysis job.

    Poll this endpoint until status is COMPLETED or FAILED.
    """
    job = await JobQueue.get_job(job_id)

    if not job:
        cached = await postgres_cache.get_analysis_result(conn, job_id)
        if cached:
            logger.info(
                "analysis job status",
                extra={
                    "request_id": getattr(http_request.state, "request_id", None),
                    "job_id": job_id,
                    "status": cached.get("status", "COMPLETED"),
                    "source": "postgres_cache",
                },
            )
            return success_response(
                data={
                    "jobId": job_id,
                    "status": cached.get("status", "COMPLETED"),
                    "result": cached.get("response"),
                    "error": None,
                    "created_at": None,
                    "updated_at": None,
                },
                message=f"Job status: {cached.get('status', 'COMPLETED')}"
            )
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    logger.info(
        "analysis job status",
        extra={
            "request_id": getattr(http_request.state, "request_id", None),
            "job_id": job_id,
            "status": job.get("status", "PENDING"),
            "source": "redis_job",
        },
    )

    return success_response(
        data={
            "jobId": job_id,
            "status": job.get("status", "PENDING"),
            "result": job.get("result"),
            "error": job.get("error"),
            "created_at": job.get("created_at"),
            "updated_at": job.get("updated_at"),
        },
        message=f"Job status: {job.get('status', 'PENDING')}"
    )


def _normalize_market_context(request: AnalysisRequest) -> dict:
    if request.market_context:
        context = request.market_context.model_dump()
    else:
        context = {
            "buyer_country": request.destination_country,
            "seller_country": request.source_country,
            "port": None,
            "price_range": None,
        }
    if request.role:
        context["role"] = request.role.value if hasattr(request.role, "value") else request.role
    return context
