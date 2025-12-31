"""Commodity search service for niche commodity discovery."""

from __future__ import annotations

import asyncio

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..services.embedding_service import EmbeddingService
from ..services.commodity_classifier import CommodityClassifier
from ..utils.dev_logger import DevLogger
from ..exceptions import DatabaseException, NoResultsException

logger = logging.getLogger(__name__)
dev_logger = DevLogger("CommoditySearch")


class CommoditySearchService:
    """Search for niche commodities related to a query."""

    def __init__(self, db):
        self.db = db
        self.embedding_service = EmbeddingService(db)
        self.classifier = CommodityClassifier()

    async def search_niche(self, request) -> Dict[str, Any]:
        dev_logger.flow("search_niche", commodity=request.commodity, filters={
            "country": request.country_preference,
            "port": request.port_preference,
            "limit": request.limit
        })
        if not self.db:
            raise DatabaseException("Database connection unavailable.")

        query_normalized = self.classifier.normalize(request.commodity)
        query_classification = self.classifier.classify(request.commodity)

        embedding = await asyncio.to_thread(
            self.embedding_service.embed_text,
            request.commodity,
        )
        trade_results = await self.embedding_service.find_similar(
            embedding=embedding,
            table="trade_records",
            limit=30,
            embedding_field="product_embedding",
        )
        product_results = await self.embedding_service.find_similar(
            embedding=embedding,
            table="products",
            limit=20,
            embedding_field="product_embedding",
        )

        price_range = (
            request.price_range.model_dump()
            if request.price_range is not None and hasattr(request.price_range, "model_dump")
            else request.price_range
        )
        suggestions, filter_stats = await self._build_suggestions(
            trade_results,
            product_results,
            request.country_preference,
            request.port_preference,
            price_range,
        )

        if not suggestions:
            message, details = await self._diagnose_no_results(
                request=request,
                filter_stats=filter_stats,
                query_classification=query_classification,
                query_normalized=query_normalized,
            )
            raise NoResultsException(message, details)

        results = []
        summary = {"total": 0, "mainstream": 0, "niche": 0}
        for suggestion in suggestions[: request.limit]:
            classification = self.classifier.classify(suggestion["name"])
            suggestion["normalized_name"] = self.classifier.normalize(suggestion["name"])
            suggestion["classification"] = classification
            suggestion["is_niche"] = classification["type"] == "niche"
            results.append(suggestion)
            summary["total"] += 1
            if suggestion["is_niche"]:
                summary["niche"] += 1
            else:
                summary["mainstream"] += 1

        filters_applied = {
            "country_preference": request.country_preference,
            "port_preference": request.port_preference,
            "price_range": price_range,
            "limit": request.limit,
        }

        filter_summary = {
            "total_candidates": filter_stats.get("total_candidates", {}),
            "filter_matches": filter_stats.get("filter_matches", {}),
            "price_presence": filter_stats.get("price_presence", {}),
        }

        return {
            "search_id": str(uuid.uuid4()),
            "searched_at": datetime.now(timezone.utc).isoformat(),
            "query": request.commodity,
            "query_normalized": query_normalized,
            "query_classification": query_classification,
            "filters_applied": filters_applied,
            "result_summary": summary,
            "filter_summary": filter_summary,
            "results": results,
        }

    async def _diagnose_no_results(
        self,
        request,
        filter_stats: Dict[str, Any],
        query_classification: Optional[Dict[str, Any]] = None,
        query_normalized: Optional[str] = None,
    ) -> tuple[str, Dict[str, Any]]:
        commodity = request.commodity
        filters = {
            "country_preference": request.country_preference,
            "port_preference": request.port_preference,
            "price_range": request.price_range.model_dump()
            if request.price_range is not None and hasattr(request.price_range, "model_dump")
            else request.price_range,
        }
        details: Dict[str, Any] = {
            "commodity": commodity,
            "query_normalized": query_normalized,
            "query_classification": query_classification,
            "filters": filters,
            "candidate_counts": filter_stats.get("total_candidates", {}),
            "mode": "best_effort",
        }
        reasons = []
        suggestions = []

        total_candidates = sum(details["candidate_counts"].values())
        if total_candidates == 0:
            message = f"No data available for '{commodity}' in the current dataset."
            reasons.append({"type": "commodity", "message": message})
            suggestions.append("Try a broader commodity term.")
            details.update({"reasons": reasons, "suggestions": suggestions})
            return message, details

        if request.country_preference:
            if filter_stats.get("filter_matches", {}).get("country", 0) == 0:
                reasons.append(
                    {
                        "type": "country",
                        "message": (
                            f"No data for commodity '{commodity}' in country '{request.country_preference}'."
                        ),
                    }
                )
                suggestions.append("Remove or change the country filter.")

        if request.port_preference:
            if filter_stats.get("filter_matches", {}).get("port", 0) == 0:
                reasons.append(
                    {
                        "type": "port",
                        "message": (
                            f"No data for commodity '{commodity}' via port '{request.port_preference}'."
                        ),
                    }
                )
                suggestions.append("Remove or change the port filter.")

        if request.price_range and filters.get("price_range"):
            min_price = filters["price_range"].get("min")
            max_price = filters["price_range"].get("max")
            if min_price is not None and max_price is not None:
                price_matches = filter_stats.get("filter_matches", {}).get("price_range", 0)
                price_presence = filter_stats.get("price_presence", {})
                if price_presence.get("with_price", 0) == 0:
                    reasons.append(
                        {
                            "type": "price_range",
                            "message": "Price data is missing for candidate records.",
                        }
                    )
                    suggestions.append("Remove the price range filter.")
                elif price_matches == 0:
                    reasons.append(
                        {
                            "type": "price_range",
                            "message": (
                                f"No data for commodity '{commodity}' within price range "
                                f"{min_price}-{max_price}."
                            ),
                        }
                    )
                    suggestions.append("Widen or remove the price range filter.")

        if reasons:
            message = "No data available for the selected filters."
        else:
            message = "No matching commodities found for the selected filters."
            suggestions.append("Try removing filters one at a time.")

        details.update({"reasons": reasons, "suggestions": suggestions})
        return message, details

    async def _build_suggestions(
        self,
        trade_results: List[Dict[str, Any]],
        product_results: List[Dict[str, Any]],
        country_preference: Optional[str],
        port_preference: Optional[str],
        price_range: Optional[Dict[str, Any]],
    ) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        trade_ids = [r["id"] for r in trade_results]
        product_ids = [r["id"] for r in product_results]

        trade_details = await self._fetch_trade_details(trade_ids)
        product_details = await self._fetch_product_details(product_ids)

        suggestions: Dict[str, Dict[str, Any]] = {}
        stats = {
            "total_candidates": {
                "trade_records": len(trade_results),
                "products": len(product_results),
            },
            "filter_matches": {
                "country": 0,
                "port": 0,
                "price_range": 0,
            },
            "price_presence": {"with_price": 0, "missing_price": 0},
        }

        for entry in trade_results:
            detail = trade_details.get(entry["id"], {})
            self._update_filter_stats(
                stats,
                detail,
                country_preference,
                port_preference,
                price_range,
            )
            if not self._passes_filters(detail, country_preference, port_preference, price_range):
                continue
            name = entry.get("name") or detail.get("product_description") or detail.get("item_description")
            if not name:
                continue
            similarity = max(0.0, 1 - float(entry["distance"]))
            self._upsert_suggestion(
                suggestions,
                name,
                similarity,
                detail.get("origin_country") or detail.get("destination_country"),
                detail.get("price"),
            )

        for entry in product_results:
            detail = product_details.get(entry["id"], {})
            self._update_filter_stats(
                stats,
                detail,
                country_preference,
                port_preference,
                price_range,
            )
            if not self._passes_filters(detail, country_preference, port_preference, price_range):
                continue
            name = entry.get("name") or detail.get("name")
            if not name:
                continue
            similarity = max(0.0, 1 - float(entry["distance"]))
            self._upsert_suggestion(
                suggestions,
                name,
                similarity,
                detail.get("country"),
                detail.get("price_value"),
            )

        return sorted(suggestions.values(), key=lambda x: x["similarity"], reverse=True), stats

    async def _fetch_trade_details(self, ids: List[str]) -> Dict[str, Dict[str, Any]]:
        if not ids:
            return {}
        rows = await self.db.fetch(
            """
            SELECT id,
                   product_description,
                   item_description,
                   origin_country,
                   destination_country,
                   indian_port,
                   foreign_port,
                   COALESCE(unit_price_usd, unit_price) AS price
            FROM trade_records
            WHERE id = ANY($1::uuid[])
            """,
            ids,
        )
        return {row["id"]: dict(row) for row in rows}

    async def _fetch_product_details(self, ids: List[str]) -> Dict[str, Dict[str, Any]]:
        if not ids:
            return {}
        rows = await self.db.fetch(
            """
            SELECT id, name, country, price_value, price_unit
            FROM products
            WHERE id = ANY($1::uuid[])
            """,
            ids,
        )
        return {row["id"]: dict(row) for row in rows}

    def _passes_filters(
        self,
        detail: Dict[str, Any],
        country_preference: Optional[str],
        port_preference: Optional[str],
        price_range: Optional[Dict[str, Any]],
    ) -> bool:
        if country_preference:
            pref = country_preference.lower()
            countries = {
                (detail.get("origin_country") or "").lower(),
                (detail.get("destination_country") or "").lower(),
                (detail.get("country") or "").lower(),
            }
            if pref not in countries:
                return False
        if port_preference:
            pref = port_preference.lower()
            ports = {
                (detail.get("indian_port") or "").lower(),
                (detail.get("foreign_port") or "").lower(),
            }
            if pref not in ports:
                return False
        if price_range:
            price = detail.get("price") or detail.get("price_value")
            if price is not None:
                min_price = price_range.get("min")
                max_price = price_range.get("max")
                if min_price is not None and float(price) < min_price:
                    return False
                if max_price is not None and float(price) > max_price:
                    return False
        return True

    def _update_filter_stats(
        self,
        stats: Dict[str, Any],
        detail: Dict[str, Any],
        country_preference: Optional[str],
        port_preference: Optional[str],
        price_range: Optional[Dict[str, Any]],
    ) -> None:
        if country_preference and self._matches_country(detail, country_preference):
            stats["filter_matches"]["country"] += 1
        if port_preference and self._matches_port(detail, port_preference):
            stats["filter_matches"]["port"] += 1
        if price_range:
            price = detail.get("price") or detail.get("price_value")
            if price is None:
                stats["price_presence"]["missing_price"] += 1
            else:
                stats["price_presence"]["with_price"] += 1
                if self._matches_price(detail, price_range):
                    stats["filter_matches"]["price_range"] += 1

    def _matches_country(self, detail: Dict[str, Any], country_preference: str) -> bool:
        pref = country_preference.lower()
        return pref in {
            (detail.get("origin_country") or "").lower(),
            (detail.get("destination_country") or "").lower(),
            (detail.get("country") or "").lower(),
        }

    def _matches_port(self, detail: Dict[str, Any], port_preference: str) -> bool:
        pref = port_preference.lower()
        return pref in {
            (detail.get("indian_port") or "").lower(),
            (detail.get("foreign_port") or "").lower(),
        }

    def _matches_price(self, detail: Dict[str, Any], price_range: Dict[str, Any]) -> bool:
        price = detail.get("price") or detail.get("price_value")
        if price is None:
            return False
        min_price = price_range.get("min")
        max_price = price_range.get("max")
        if min_price is not None and float(price) < min_price:
            return False
        if max_price is not None and float(price) > max_price:
            return False
        return True

    def _upsert_suggestion(
        self,
        suggestions: Dict[str, Dict[str, Any]],
        name: str,
        similarity: float,
        country: Optional[str],
        price: Optional[float],
    ) -> None:
        existing = suggestions.get(name)
        if existing and existing["similarity"] >= similarity:
            return
        suggestions[name] = {
            "name": name,
            "similarity": round(similarity, 4),
            "sample_country": country,
            "sample_price": float(price) if price is not None else None,
        }
