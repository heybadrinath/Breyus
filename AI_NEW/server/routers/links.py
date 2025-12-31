"""
Link Prediction Router

POST /v1/links/predict - Find trade partners using waterfall logic

Waterfall Steps:
1. Historical match - Check trade_links for direct relationships
2. Similarity match - Find similar entities via pgvector
3. Geospatial cluster - PostGIS proximity search
4. Pre-computed predictions - Check predicted_partners table
"""

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import db_conn, verify_api_key
from ..models.links import PredictLinkRequest, PredictLinkResponse
from ..schemas.response import success_response
from ..services import postgres_cache
from ..config import settings
from ..services.cache_service import get_cached_link_prediction, cache_link_prediction
from ..services.link_predictor import LinkPredictor

router = APIRouter(prefix="/v1/links", tags=["links"])


@router.post("/predict")
async def predict_link(
    request: PredictLinkRequest,
    api_key: str = Depends(verify_api_key),
    conn=Depends(db_conn),
):
    """
    Find the most probable trade partner.

    Uses caching with 14-day TTL. Returns cached result if available.
    """
    # Check cache first
    cache_key = _cache_key(request)
    if settings.CACHE_ENABLED:
        cached = await get_cached_link_prediction(cache_key, request.commodity)

        if cached:
            return success_response(
                data=cached,
                message="Link prediction retrieved from cache"
            )

        pg_cached = await postgres_cache.get_link_prediction(conn, cache_key, request.commodity)
        if pg_cached:
            await cache_link_prediction(cache_key, request.commodity, pg_cached)
            return success_response(
                data=pg_cached,
                message="Link prediction retrieved from cache"
            )

    # Cache miss - call predictor service
    predictor = LinkPredictor(conn)
    try:
        result = await predictor.predict(request)

        # Cache the result (will return 501 for now, but cache when implemented)
        if settings.CACHE_ENABLED and result and isinstance(result, dict):
            await cache_link_prediction(cache_key, request.commodity, result)
            await postgres_cache.set_link_prediction(
                conn,
                cache_key,
                request.commodity,
                result,
                settings.TTL_LINK_PREDICTION_DAYS,
            )

        return success_response(
            data=result,
            message="Link prediction generated"
        )

    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc))


def _cache_key(request: PredictLinkRequest) -> str:
    base = None
    if getattr(request, "buyer_id", None):
        base = request.buyer_id
    elif getattr(request, "seller_id", None):
        base = request.seller_id
    elif getattr(request, "buyer_name", None):
        base = request.buyer_name.lower()
    elif getattr(request, "seller_name", None):
        base = request.seller_name.lower()
    elif getattr(request, "entity", None):
        base = request.entity.name.lower()
    else:
        base = "unknown"

    suffix = _context_suffix(request)
    return f"{base}|{suffix}" if suffix else base


def _context_suffix(request: PredictLinkRequest) -> str:
    parts = []
    role = getattr(request, "role", None)
    if role:
        parts.append(role.value if hasattr(role, "value") else str(role))
    if getattr(request, "mode", None):
        mode = request.mode.value if hasattr(request.mode, "value") else str(request.mode)
        parts.append(f"mode:{mode}")
    if getattr(request, "top_k", None):
        parts.append(f"top_k:{request.top_k}")
    if getattr(request, "country_preference", None):
        parts.append(str(request.country_preference).lower())
    if getattr(request, "port_preference", None):
        parts.append(str(request.port_preference).lower())
    price_range = getattr(request, "price_range", None)
    if price_range is not None:
        if hasattr(price_range, "model_dump"):
            price_range = price_range.model_dump()
        if isinstance(price_range, dict):
            min_price = price_range.get("min")
            max_price = price_range.get("max")
            parts.append(f"price:{min_price}-{max_price}")
    profile = getattr(request, "profile", None)
    if profile:
        if profile.country:
            parts.append(f"profile_country:{profile.country.lower()}")
        if profile.location:
            parts.append(f"profile_loc:{profile.location.lat},{profile.location.lon}")
        if profile.mean_monthly_revenue is not None:
            parts.append(f"revenue:{profile.mean_monthly_revenue}")
        if profile.payment_terms:
            parts.append(f"terms:{profile.payment_terms.lower()}")
    return "|".join(parts)
