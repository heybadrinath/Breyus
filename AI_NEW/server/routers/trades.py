"""
Trade Scoring Router

POST /v1/trades/score - Calculate Gravity Scores for potential partners

Scoring uses 11 weighted metrics:
1. Demand
2. Source Geography
3. Port Proximity
4. Transport Cost
5. Capital
6. Financing
7. Price Range
8. Weather
9. Volatility
10. Barrier
11. Frequency
"""

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import db_conn, verify_api_key
from ..models.trades import ScoreRequest, ScoreResponse
from ..schemas.response import success_response
from ..services import postgres_cache
from ..config import settings
from ..services.cache_service import get_cached_trade_score, cache_trade_score
from ..services.trade_scorer import TradeScorer

router = APIRouter(prefix="/v1/trades", tags=["trades"])


@router.post("/score")
async def score_trades(
    request: ScoreRequest,
    api_key: str = Depends(verify_api_key),
    conn=Depends(db_conn),
):
    """
    Calculate probability scores for trade candidates.

    Uses caching with 7-day TTL. Returns cached result if available.
    """
    # Check cache first
    cache_key = _cache_key(request)
    if settings.CACHE_ENABLED:
        cached = await get_cached_trade_score(
            cache_key.get("buyer"),
            cache_key.get("seller"),
            request.commodity,
        )

        if cached:
            return success_response(
                data=cached,
                message="Trade score retrieved from cache"
            )

        pg_cached = await postgres_cache.get_trade_score(
            conn,
            cache_key.get("buyer"),
            cache_key.get("seller"),
            request.commodity,
        )
        if pg_cached:
            await cache_trade_score(
                cache_key.get("buyer"),
                cache_key.get("seller"),
                request.commodity,
                pg_cached,
            )
            return success_response(
                data=pg_cached,
                message="Trade score retrieved from cache"
            )

    # Cache miss - calculate score
    scorer = TradeScorer(conn)
    try:
        result = await scorer.score(request)

        # Cache the result
        if settings.CACHE_ENABLED and result and isinstance(result, dict):
            await cache_trade_score(
                cache_key.get("buyer"),
                cache_key.get("seller"),
                request.commodity,
                result,
            )
            await postgres_cache.set_trade_score(
                conn,
                cache_key.get("buyer"),
                cache_key.get("seller"),
                request.commodity,
                result,
                settings.TTL_TRADE_SCORE_DAYS,
            )

        return success_response(
            data=result,
            message="Trade score calculated"
        )

    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc))


def _cache_key(request: ScoreRequest) -> dict:
    buyer_key = request.buyer_id or request.buyer_name
    seller_key = request.seller_id or request.seller_name
    if not buyer_key and request.reference_entity and request.type == "buyer":
        seller_key = request.reference_entity.name
    if not seller_key and request.reference_entity and request.type == "seller":
        buyer_key = request.reference_entity.name

    suffix = _context_suffix(request)
    buyer = (buyer_key.lower() if isinstance(buyer_key, str) else buyer_key) or "unknown"
    seller = (seller_key.lower() if isinstance(seller_key, str) else seller_key) or "unknown"
    if suffix:
        buyer = f"{buyer}|{suffix}"
        seller = f"{seller}|{suffix}"
    return {"buyer": buyer, "seller": seller}


def _context_suffix(request: ScoreRequest) -> str:
    parts = []
    role = getattr(request, "role", None)
    if role:
        parts.append(role.value if hasattr(role, "value") else str(role))
    if getattr(request, "buyer_country", None):
        parts.append(f"buyer_country:{request.buyer_country.lower()}")
    if getattr(request, "seller_country", None):
        parts.append(f"seller_country:{request.seller_country.lower()}")
    if getattr(request, "buyer_port", None):
        parts.append(f"buyer_port:{request.buyer_port.lower()}")
    price_range = getattr(request, "price_range", None)
    if isinstance(price_range, dict):
        parts.append(f"price:{price_range.get('min')}-{price_range.get('max')}")
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
