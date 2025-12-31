"""Commodity discovery router."""

from fastapi import APIRouter, Depends

from ..dependencies import db_conn, verify_api_key
from ..models.commodities import NicheSearchRequest
from ..schemas.response import success_response
from ..services.commodity_search import CommoditySearchService

router = APIRouter(prefix="/v1/commodities", tags=["commodities"])


@router.post("/search-niche")
async def search_niche(
    request: NicheSearchRequest,
    api_key: str = Depends(verify_api_key),
    conn=Depends(db_conn),
):
    service = CommoditySearchService(conn)
    result = await service.search_niche(request)
    return success_response(data=result, message="Niche commodities retrieved")
