"""
Link Prediction Service

Implements the waterfall logic for finding trade partners:

1. HISTORICAL MATCH (confidence: high)
   - Query trade_links for direct relationships
   - If found, calculate distance and return

2. SIMILARITY MATCH (confidence: medium)
   - Use pgvector to find top 3 similar entities
   - Check their trade partners
   - Return closest to reference entity

3. GEOSPATIAL CLUSTER (confidence: low)
   - Use PostGIS to find traders within 500km radius
   - Return closest valid partner

4. PRE-COMPUTED PREDICTIONS (confidence: inferred)
   - Check predicted_partners table
   - Return best match if exists

5. COMMODITY POOL (confidence: low)
   - Pull top traders for the commodity from trade_records
   - Use as fallback to avoid empty results
"""

from __future__ import annotations

import asyncio
import logging
import math
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from ..services.embedding_service import EmbeddingService
from ..services.trade_scorer import TradeScorer
from ..services.entity_resolver import flatten_contact_info, format_location
from ..utils.statistics import calculate_volatility, normalize_score
from ..utils.dev_logger import DevLogger

logger = logging.getLogger(__name__)
dev_logger = DevLogger("LinkPredictor")


class LinkPredictor:
    """Placeholder for the link prediction waterfall logic."""

    def __init__(self, db):
        self.db = db
        self._company_cache: Dict[str, Optional[Dict[str, Any]]] = {}
        self._product_cache: Dict[Tuple[str, str, str], Optional[Dict[str, Any]]] = {}
        self._avg_price_cache: Dict[Tuple[str, str, str, str], Optional[float]] = {}
        self._primary_port_cache: Dict[Tuple[str, str, str, str], Optional[str]] = {}
        self._commodity_match_cache: Dict[Tuple[str, str, str, str], bool] = {}

    async def predict(self, request) -> dict:
        """Run waterfall prediction logic."""
        dev_logger.flow("predict_start", request=str(request))
        normalized = await self._normalize_request(request)
        if not normalized:
            raise ValueError("Invalid link prediction request")

        seeker = normalized["seeker"]
        seeker_type = normalized["seeker_type"]
        commodity = normalized["commodity"]
        hs_code = normalized["hs_code"]
        price_range = normalized["price_range"]
        buyer_port = normalized["port_preference"]

        if not hs_code:
            hs_code = await self._guess_hs_code(commodity)
            normalized["hs_code"] = hs_code
        mode = self._normalize_mode(getattr(request, "mode", None))
        top_k = self._normalize_top_k(getattr(request, "top_k", None), mode)
        normalized["top_k"] = top_k
        normalized["mode"] = mode
        normalized["limits"] = self._build_limits(top_k, mode)

        strategies = [
            ("commodity_pool", self._commodity_pool_matches),
            ("historical", self._historical_matches),
            ("similarity", self._similarity_matches),
            ("geospatial", self._geospatial_matches),
            ("prediction", self._predicted_matches),
        ]

        candidates_by_key: Dict[str, Dict[str, Any]] = {}
        for strategy_name, handler in strategies:
            candidates = await handler(seeker, seeker_type, commodity, hs_code, normalized)
            if candidates:
                commodity_match = strategy_name in {"historical", "prediction", "commodity_pool"}
                self._merge_candidates(
                    candidates_by_key,
                    candidates,
                    strategy_name,
                    commodity_match=commodity_match,
                )

        if not candidates_by_key:
            fallback_candidates = await self._global_fallback_matches(seeker, normalized)
            if fallback_candidates:
                self._merge_candidates(
                    candidates_by_key,
                    fallback_candidates,
                    "fallback_global",
                    commodity_match=False,
                )

        if not candidates_by_key:
            return {
                "matches": [],
                "match_strategy": None,
                "legacy": {
                    "found": False,
                    "predicted_partner": None,
                    "distance_km": None,
                    "confidence": None,
                    "method": None,
                },
            }

        matches = list(candidates_by_key.values())
        if self._has_filters(normalized):
            candidate_role = "seller" if seeker_type == "buyer" else "buyer"
            filtered: List[Dict[str, Any]] = []
            for candidate in matches:
                if await self._candidate_passes_filters(
                    candidate,
                    normalized,
                    candidate_role,
                ):
                    filtered.append(candidate)
            matches = filtered

        if not matches:
            return {
                "matches": [],
                "match_strategy": None,
                "legacy": {
                    "found": False,
                    "predicted_partner": None,
                    "distance_km": None,
                    "confidence": None,
                    "method": None,
                },
            }

        match_strategy = self._pick_strategy(self._collect_strategies(matches))

        # Hydrate company details and score
        scorer = TradeScorer(self.db)
        buyer, seller = await self._resolve_buyer_seller(seeker, seeker_type)
        enriched: List[Dict[str, Any]] = []

        price_fluctuation = await self._predict_price_fluctuation(commodity, hs_code)

        for candidate in matches:
            company_row = await self._fetch_company(candidate.get("company_id"), candidate.get("company_name"))
            candidate_company = self._normalize_candidate_company(candidate, company_row)
            if not candidate_company or not candidate_company.get("name"):
                continue
            candidate_role = "seller" if seeker_type == "buyer" else "buyer"
            if seeker_type == "buyer":
                buyer_candidate = buyer or seeker
                seller_candidate = candidate_company
            else:
                buyer_candidate = candidate_company
                seller_candidate = seller or seeker

            gravity_score, _ = await scorer.calculate_pair_score(
                commodity=commodity,
                hs_code=hs_code,
                buyer=buyer_candidate,
                seller=seller_candidate,
                buyer_port=buyer_port,
                price_range=price_range,
                role=seeker_type,
            )
            bonus = self._source_boost(candidate.get("sources")) + self._country_preference_bonus(
                candidate_company.get("country"),
                normalized.get("country_preference"),
            )
            score = gravity_score + bonus
            commodity_match = candidate.get("commodity_match")
            if commodity_match is None:
                commodity_match = await self._company_trades_commodity(
                    candidate_company,
                    commodity,
                    hs_code,
                    candidate_role,
                )
            if commodity_match is False:
                score = max(score, 0.2)

            product_info = await self._get_product_info(candidate_company, commodity, hs_code)
            if not product_info:
                product_info = self._fallback_product_info(candidate_company, commodity, hs_code)
            risk_level = await self._assess_risk(
                candidate_company,
                commodity,
                hs_code,
                price_fluctuation=price_fluctuation,
            )
            distance_km = self._distance_km_between(
                seeker.get("location"),
                candidate_company.get("location"),
            )

            enriched.append(
                {
                    "company_name": candidate_company.get("name"),
                    "country": candidate_company.get("country"),
                    "location": self._format_location(candidate_company),
                    "contact_phone": candidate_company.get("contact_phone"),
                    "contact_email": candidate_company.get("contact_email"),
                    "contact_website": candidate_company.get("contact_website"),
                    "product": product_info,
                    "gravity_score": score,
                    "risk_level": risk_level,
                    "next_month_price_fluctuation": price_fluctuation,
                    "sources": sorted(candidate.get("sources") or []),
                    "_distance_km": distance_km,
                }
            )

        ranked = sorted(enriched, key=lambda x: x["gravity_score"], reverse=True)
        if top_k:
            ranked = ranked[:top_k]
        total_score = sum(entry["gravity_score"] for entry in ranked) or 1
        matches_out = []
        for entry in ranked:
            probability = round((entry["gravity_score"] / total_score) * 100, 2)
            matches_out.append(
                {
                    "company_name": entry["company_name"],
                    "country": entry["country"],
                    "location": entry["location"],
                    "contact_phone": entry.get("contact_phone"),
                    "contact_email": entry.get("contact_email"),
                    "contact_website": entry.get("contact_website"),
                    "product": entry["product"],
                    "probability": probability,
                    "next_month_price_fluctuation": entry["next_month_price_fluctuation"],
                    "risk_level": entry["risk_level"],
                    "gravity_score": entry["gravity_score"],
                    "sources": entry.get("sources") or [],
                }
            )

        if not matches_out:
            return {
                "matches": [],
                "match_strategy": None,
                "legacy": {
                    "found": False,
                    "predicted_partner": None,
                    "distance_km": None,
                    "confidence": None,
                    "method": None,
                },
            }

        top_distance = ranked[0].get("_distance_km") if ranked else None
        legacy = self._legacy_response_from_matches(matches_out, match_strategy, top_distance)

        return {
            "matches": matches_out,
            "match_strategy": match_strategy,
            "legacy": legacy,
        }

    def _has_filters(self, context: Dict[str, Any]) -> bool:
        return bool(
            context.get("country_preference")
            or context.get("port_preference")
            or context.get("price_range")
        )

    def _collect_strategies(self, candidates: List[Dict[str, Any]]) -> set[str]:
        strategies: set[str] = set()
        for candidate in candidates:
            for strategy in candidate.get("strategies") or []:
                strategies.add(strategy)
        return strategies

    def _company_cache_key(
        self,
        company_id: Optional[str],
        company_name: Optional[str],
    ) -> Optional[str]:
        if company_id:
            return f"id:{company_id}"
        if company_name:
            return f"name:{self._normalize_text(company_name)}"
        return None

    def _metric_cache_key(
        self,
        company: Dict[str, Any],
        commodity: Optional[str],
        hs_code: Optional[str],
        role: str,
    ) -> Optional[Tuple[str, str, str, str]]:
        company_key = self._company_cache_key(company.get("id"), company.get("name"))
        if not company_key:
            return None
        return (
            company_key,
            commodity or "",
            hs_code or "",
            role or "",
        )

    def _normalize_mode(self, value: Optional[Any]) -> str:
        if value is None:
            return "normal"
        if hasattr(value, "value"):
            value = value.value
        value = str(value).lower()
        return "deep" if value == "deep" else "normal"

    def _normalize_top_k(self, value: Optional[int], mode: str) -> int:
        max_limit = 500 if mode == "deep" else 100
        default = 200 if mode == "deep" else 25
        if isinstance(value, int):
            return max(1, min(value, max_limit))
        return default

    def _build_limits(self, top_k: int, mode: str) -> Dict[str, int]:
        base = max(top_k, 10)
        cap = 150 if mode == "deep" else 50
        pool_cap = 500 if mode == "deep" else 100
        return {
            "historical": min(base, cap),
            "similarity_seed": min(max(5, top_k // 2), 25 if mode == "deep" else 15),
            "similarity_links": min(max(5, top_k // 2), 25 if mode == "deep" else 15),
            "similarity_total": min(base, cap),
            "geospatial": min(base, cap),
            "prediction": min(base, cap),
            "commodity_pool": min(max(top_k * 2, 25), pool_cap),
            "fallback_global": min(max(top_k * 2, 25), pool_cap),
        }

    def _limit_from_context(
        self, context: Dict[str, Any], key: str, default: int
    ) -> int:
        limits = context.get("limits") if context else None
        if not limits:
            return default
        value = limits.get(key)
        if isinstance(value, int) and value > 0:
            return value
        return default

    async def _normalize_request(self, request) -> Optional[Dict[str, Any]]:
        seeker_type = None
        seeker_id = None
        seeker_name = None
        seeker_location = None
        seeker_profile = getattr(request, "profile", None)
        role = getattr(request, "role", None)
        role_value = role.value if hasattr(role, "value") else role

        if role_value == "buyer":
            seeker_type = "buyer"
            seeker_id = getattr(request, "buyer_id", None)
            seeker_name = getattr(request, "buyer_name", None)
        elif role_value == "seller":
            seeker_type = "seller"
            seeker_id = getattr(request, "seller_id", None)
            seeker_name = getattr(request, "seller_name", None)
        elif getattr(request, "buyer_id", None) or getattr(request, "buyer_name", None):
            seeker_type = "buyer"
            seeker_id = request.buyer_id
            seeker_name = request.buyer_name
        elif getattr(request, "seller_id", None) or getattr(request, "seller_name", None):
            seeker_type = "seller"
            seeker_id = request.seller_id
            seeker_name = request.seller_name
        elif getattr(request, "entity", None):
            seeker_type = request.entity.type.value if hasattr(request.entity.type, "value") else request.entity.type
            seeker_name = request.entity.name
        else:
            return None

        if getattr(request, "reference_entity", None) and request.reference_entity.location:
            seeker_location = request.reference_entity.location

        seeker_company = await self._fetch_company(seeker_id, seeker_name)
        if seeker_company and seeker_company.get("location"):
            seeker_location = seeker_company["location"]

        if seeker_profile and seeker_profile.location:
            seeker_location = (seeker_profile.location.lon, seeker_profile.location.lat)

        seeker = seeker_company or {"id": seeker_id, "name": seeker_name, "location": seeker_location}
        seeker = self._apply_profile_context(seeker, seeker_profile)

        return {
            "seeker_type": seeker_type,
            "seeker": seeker,
            "commodity": request.commodity,
            "hs_code": getattr(request, "hs_code", None),
            "country_preference": getattr(request, "country_preference", None),
            "port_preference": getattr(request, "port_preference", None),
            "price_range": getattr(request, "price_range", None).model_dump()
            if getattr(request, "price_range", None) is not None and hasattr(getattr(request, "price_range", None), "model_dump")
            else getattr(request, "price_range", None),
            "reference_entity": getattr(request, "reference_entity", None),
            "role": role_value,
            "profile": seeker_profile,
        }

    def _apply_profile_context(self, seeker: Dict[str, Any], profile) -> Dict[str, Any]:
        if not profile:
            return seeker
        if profile.country:
            seeker["country"] = profile.country
        if profile.location:
            seeker["location"] = (profile.location.lon, profile.location.lat)
        extra = dict(seeker.get("extra") or {})
        if profile.mean_monthly_revenue is not None:
            extra["meanMonthlyRevenue"] = profile.mean_monthly_revenue
        if profile.payment_terms:
            extra["payment_terms"] = profile.payment_terms
        if profile.credit_score is not None:
            extra["credit_score"] = profile.credit_score
        seeker["extra"] = extra
        return seeker

    async def _resolve_buyer_seller(self, seeker: Dict[str, Any], seeker_type: str):
        if seeker_type == "buyer":
            return seeker, None
        return None, seeker

    async def _candidate_passes_filters(
        self,
        candidate: Dict[str, Any],
        context: Dict[str, Any],
        candidate_role: str,
    ) -> bool:
        country_pref = context.get("country_preference")
        if country_pref and not self._country_matches(candidate.get("country"), country_pref):
            return False

        port_pref = context.get("port_preference")
        if port_pref:
            port = await self._get_primary_port(
                candidate,
                context.get("commodity"),
                context.get("hs_code"),
                candidate_role,
            )
            if port and not self._port_matches(port, port_pref):
                return False

        price_range = self._normalize_price_range(context.get("price_range"))
        if price_range:
            avg_price = await self._get_average_price_for_company(
                candidate,
                context.get("commodity"),
                context.get("hs_code"),
                candidate_role,
            )
            if avg_price is not None and not self._price_in_range(avg_price, price_range):
                return False

        return True

    def _normalize_price_range(self, price_range: Any) -> Optional[Dict[str, float]]:
        if not price_range:
            return None
        if isinstance(price_range, dict):
            return price_range
        if hasattr(price_range, "model_dump"):
            return price_range.model_dump()
        if hasattr(price_range, "min") or hasattr(price_range, "max"):
            return {"min": getattr(price_range, "min", None), "max": getattr(price_range, "max", None)}
        return None

    def _country_matches(self, candidate_country: Optional[str], country_pref: str) -> bool:
        if not candidate_country:
            return False
        candidate_norm = self._normalize_text(candidate_country)
        for raw in re.split(r"[,/]+", country_pref):
            token = self._normalize_text(raw)
            if token and (token == candidate_norm or token in candidate_norm or candidate_norm in token):
                return True
        return False

    def _port_matches(self, candidate_port: str, port_pref: str) -> bool:
        candidate_norm = self._normalize_text(candidate_port)
        pref_norm = self._normalize_text(port_pref)
        if not candidate_norm or not pref_norm:
            return False
        if pref_norm in candidate_norm or candidate_norm in pref_norm:
            return True
        candidate_tokens = set(candidate_norm.split())
        pref_tokens = set(pref_norm.split())
        return bool(candidate_tokens & pref_tokens)

    def _price_in_range(self, price: float, price_range: Dict[str, float]) -> bool:
        min_price = price_range.get("min")
        max_price = price_range.get("max")
        if min_price is None and max_price is None:
            return True
        if min_price is not None and price < min_price:
            return False
        if max_price is not None and price > max_price:
            return False
        return True

    def _normalize_text(self, value: str) -> str:
        if not value:
            return ""
        return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()

    async def _historical_matches(
        self,
        seeker: Dict[str, Any],
        seeker_type: str,
        commodity: str,
        hs_code: Optional[str],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []
        seeker_id = seeker.get("id")
        seeker_name = seeker.get("name")
        hs_code_int = int(hs_code) if hs_code and str(hs_code).isdigit() else None
        commodity_like = f"%{commodity}%" if commodity else None
        limit = self._limit_from_context(context, "historical", 10)
        if seeker_type == "seller":
            query = f"""
                SELECT target_company_id AS company_id, target_company_name AS company_name,
                       total_trades, total_value_usd
                FROM trade_links
                WHERE link_type = 'export_to'
                  AND (
                    (source_company_id = $1 AND $1 IS NOT NULL)
                    OR (source_company_name ILIKE $2)
                  )
                  AND ($3::int IS NULL OR $3::int = ANY(hs_codes_traded))
                  AND (
                    $4::text IS NULL
                    OR EXISTS (
                        SELECT 1 FROM unnest(commodities_traded) AS c WHERE c ILIKE $4
                    )
                  )
                ORDER BY total_trades DESC NULLS LAST
                LIMIT {limit}
            """
        else:
            query = f"""
                SELECT source_company_id AS company_id, source_company_name AS company_name,
                       total_trades, total_value_usd
                FROM trade_links
                WHERE link_type = 'export_to'
                  AND (
                    (target_company_id = $1 AND $1 IS NOT NULL)
                    OR (target_company_name ILIKE $2)
                  )
                  AND ($3::int IS NULL OR $3::int = ANY(hs_codes_traded))
                  AND (
                    $4::text IS NULL
                    OR EXISTS (
                        SELECT 1 FROM unnest(commodities_traded) AS c WHERE c ILIKE $4
                    )
                  )
                ORDER BY total_trades DESC NULLS LAST
                LIMIT {limit}
            """
        rows = await self.db.fetch(query, seeker_id, f"%{seeker_name}%", hs_code_int, commodity_like)
        candidates = []
        for row in rows:
            entry = dict(row)
            entry["source_table"] = "trade_links"
            candidates.append(entry)
        return candidates

    async def _similarity_matches(
        self,
        seeker: Dict[str, Any],
        seeker_type: str,
        commodity: str,
        hs_code: Optional[str],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []
        seed_limit = self._limit_from_context(context, "similarity_seed", 5)
        link_limit = self._limit_from_context(context, "similarity_links", 5)
        total_limit = self._limit_from_context(context, "similarity_total", 10)
        embedding_service = EmbeddingService(self.db)
        name = seeker.get("name") or ""
        embedding = await asyncio.to_thread(embedding_service.embed_text, name)
        similar = await embedding_service.find_similar(
            embedding=embedding,
            table="companies",
            limit=seed_limit,
            embedding_field="name_embedding",
        )
        if not similar:
            return []
        candidates = []
        for sim in similar:
            sim_id = sim["id"]
            if seeker.get("id") and sim_id == seeker.get("id"):
                continue
            if seeker_type == "seller":
                rows = await self.db.fetch(
                    f"""
                    SELECT target_company_id AS company_id, target_company_name AS company_name,
                           total_trades, total_value_usd
                    FROM trade_links
                    WHERE link_type = 'export_to'
                      AND source_company_id = $1
                    ORDER BY total_trades DESC NULLS LAST
                    LIMIT {link_limit}
                    """,
                    sim_id,
                )
            else:
                rows = await self.db.fetch(
                    f"""
                    SELECT source_company_id AS company_id, source_company_name AS company_name,
                           total_trades, total_value_usd
                    FROM trade_links
                    WHERE link_type = 'export_to'
                      AND target_company_id = $1
                    ORDER BY total_trades DESC NULLS LAST
                    LIMIT {link_limit}
                    """,
                    sim_id,
                )
            for row in rows:
                entry = dict(row)
                entry["source_table"] = "trade_links"
                candidates.append(entry)
        return candidates[:total_limit]

    async def _geospatial_matches(
        self,
        seeker: Dict[str, Any],
        seeker_type: str,
        commodity: str,
        hs_code: Optional[str],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []
        location = seeker.get("location")
        if not location:
            return []
        limit = self._limit_from_context(context, "geospatial", 10)
        lon, lat = self._extract_lon_lat(location)
        rows = await self.db.fetch(
            f"""
            SELECT id AS company_id,
                   name AS company_name,
                   country,
                   city,
                   state,
                   pin_code,
                   address_full,
                   contact_info,
                   ST_Distance(location, ST_MakePoint($1, $2)::geography) / 1000 AS distance_km
            FROM companies
            WHERE location IS NOT NULL
              AND ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
            ORDER BY ST_Distance(location, ST_MakePoint($1, $2)::geography)
            LIMIT {limit}
            """,
            lon,
            lat,
            500000,
        )
        candidates = []
        for row in rows:
            if row["company_id"] == seeker.get("id"):
                continue
            entry = dict(row)
            contact = flatten_contact_info(entry.get("contact_info"))
            entry.update(contact)
            entry["source_table"] = "companies"
            candidates.append(entry)
        return candidates

    async def _predicted_matches(
        self,
        seeker: Dict[str, Any],
        seeker_type: str,
        commodity: str,
        hs_code: Optional[str],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        if not self.db or not (seeker.get("id") or seeker.get("name")):
            return []
        limit = self._limit_from_context(context, "prediction", 10)
        if seeker.get("id"):
            rows = await self.db.fetch(
                f"""
                SELECT partner_company_id AS company_id,
                       partner_company_name AS company_name,
                       probability_score
                FROM predicted_partners
                WHERE company_id = $1
                  AND (for_commodity IS NULL OR for_commodity ILIKE $2)
                  AND (for_hs_code IS NULL OR for_hs_code = $3)
                ORDER BY probability_score DESC NULLS LAST
                LIMIT {limit}
                """,
                seeker["id"],
                f"%{commodity}%",
                hs_code,
            )
        else:
            rows = await self.db.fetch(
                f"""
                SELECT partner_company_id AS company_id,
                       partner_company_name AS company_name,
                       probability_score
                FROM predicted_partners
                WHERE company_name ILIKE $1
                  AND (for_commodity IS NULL OR for_commodity ILIKE $2)
                  AND (for_hs_code IS NULL OR for_hs_code = $3)
                ORDER BY probability_score DESC NULLS LAST
                LIMIT {limit}
                """,
                f"%{seeker.get('name', '')}%",
                f"%{commodity}%",
                hs_code,
            )
        candidates = []
        for row in rows:
            entry = dict(row)
            entry["source_table"] = "predicted_partners"
            candidates.append(entry)
        return candidates

    async def _commodity_pool_matches(
        self,
        seeker: Dict[str, Any],
        seeker_type: str,
        commodity: str,
        hs_code: Optional[str],
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        if not self.db or not commodity:
            return []
        if hs_code:
            commodity_clause = "hs_code = $1"
            params: List[Any] = [hs_code]
        else:
            commodity_clause = "(product_description ILIKE $1 OR item_description ILIKE $1)"
            params = [f"%{commodity}%"]
        limit = self._limit_from_context(context, "commodity_pool", 25)

        def _commodity_pool_query(role: str) -> str:
            if role == "buyer":
                return """
                    WITH commodity_trades AS (
                        SELECT exporter_id AS company_id,
                               exporter_name AS company_name,
                               exporter_address AS address_full,
                               origin_country AS country,
                               extra->>'contact_no' AS contact_phone,
                               extra->>'e_mail_id' AS contact_email,
                               extra->>'exporter_city' AS city,
                               extra->>'state' AS state,
                               extra->>'pin_code' AS pin_code,
                               total_value_usd AS trade_value
                        FROM trade_records
                        WHERE {commodity_clause}
                          AND (exporter_id IS NOT NULL OR exporter_name IS NOT NULL)
                        UNION ALL
                        SELECT supplier_id AS company_id,
                               supplier_name AS company_name,
                               supplier_address AS address_full,
                               origin_country AS country,
                               extra->>'contact_no' AS contact_phone,
                               extra->>'e_mail_id' AS contact_email,
                               extra->>'city' AS city,
                               extra->>'state' AS state,
                               extra->>'pin_code' AS pin_code,
                               total_value_usd AS trade_value
                        FROM trade_records
                        WHERE {commodity_clause}
                          AND (supplier_id IS NOT NULL OR supplier_name IS NOT NULL)
                    )
                    SELECT NULL::uuid AS company_id,
                           company_name,
                           MAX(address_full) AS address_full,
                           MAX(country) AS country,
                           MAX(contact_phone) AS contact_phone,
                           MAX(contact_email) AS contact_email,
                           MAX(city) AS city,
                           MAX(state) AS state,
                           MAX(pin_code) AS pin_code,
                           COUNT(*) AS trade_count,
                           SUM(COALESCE(trade_value, 0)) AS total_value_usd
                    FROM commodity_trades
                    WHERE company_name IS NOT NULL
                    GROUP BY company_name
                    ORDER BY trade_count DESC NULLS LAST, total_value_usd DESC NULLS LAST
                    LIMIT {limit}
                """.format(commodity_clause=commodity_clause, limit=limit)
            return """
                WITH commodity_trades AS (
                    SELECT importer_id AS company_id,
                           importer_name AS company_name,
                           importer_address AS address_full,
                           destination_country AS country,
                           extra->>'contact_no' AS contact_phone,
                           extra->>'e_mail_id' AS contact_email,
                           extra->>'city' AS city,
                           extra->>'state' AS state,
                           extra->>'pin_code' AS pin_code,
                           total_value_usd AS trade_value
                    FROM trade_records
                    WHERE {commodity_clause}
                      AND (importer_id IS NOT NULL OR importer_name IS NOT NULL)
                    UNION ALL
                    SELECT consignee_id AS company_id,
                           consignee_name AS company_name,
                           consignee_address AS address_full,
                           destination_country AS country,
                           extra->>'contact_no' AS contact_phone,
                           extra->>'e_mail_id' AS contact_email,
                           extra->>'city' AS city,
                           extra->>'state' AS state,
                           extra->>'pin_code' AS pin_code,
                           total_value_usd AS trade_value
                    FROM trade_records
                    WHERE {commodity_clause}
                      AND (consignee_id IS NOT NULL OR consignee_name IS NOT NULL)
                )
                SELECT NULL::uuid AS company_id,
                       company_name,
                       MAX(address_full) AS address_full,
                       MAX(country) AS country,
                       MAX(contact_phone) AS contact_phone,
                       MAX(contact_email) AS contact_email,
                       MAX(city) AS city,
                       MAX(state) AS state,
                       MAX(pin_code) AS pin_code,
                       COUNT(*) AS trade_count,
                       SUM(COALESCE(trade_value, 0)) AS total_value_usd
                FROM commodity_trades
                WHERE company_name IS NOT NULL
                GROUP BY company_name
                ORDER BY trade_count DESC NULLS LAST, total_value_usd DESC NULLS LAST
                LIMIT {limit}
            """.format(commodity_clause=commodity_clause, limit=limit)

        if seeker_type == "buyer":
            rows = await self.db.fetch(_commodity_pool_query("buyer"), *params)
        else:
            rows = await self.db.fetch(_commodity_pool_query("seller"), *params)
            if not rows:
                # If importer/consignee data is missing, fall back to exporter/supplier.
                rows = await self.db.fetch(_commodity_pool_query("buyer"), *params)
        candidates = []
        for row in rows:
            entry = dict(row)
            entry["source_table"] = "trade_records"
            candidates.append(entry)
        return candidates

    async def _global_fallback_matches(
        self, seeker: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        if not self.db:
            return []
        limit = self._limit_from_context(context or {}, "fallback_global", 25)
        rows = await self.db.fetch(
            f"""
            SELECT id AS company_id,
                   name AS company_name,
                   country,
                   city,
                   state,
                   pin_code,
                   address_full,
                   contact_info,
                   total_trade_value_usd
            FROM companies
            WHERE id IS NOT NULL
            ORDER BY total_trade_value_usd DESC NULLS LAST
            LIMIT {limit}
            """
        )
        candidates = []
        for row in rows:
            if row.get("company_id") == seeker.get("id"):
                continue
            entry = dict(row)
            contact = flatten_contact_info(entry.get("contact_info"))
            entry.update(contact)
            entry["source_table"] = "companies"
            candidates.append(entry)
        return candidates

    def _merge_candidates(
        self,
        bucket: Dict[str, Dict[str, Any]],
        candidates: List[Dict[str, Any]],
        source: str,
        commodity_match: Optional[bool] = None,
    ) -> None:
        for candidate in candidates:
            source_table = candidate.get("source_table") or source
            key = self._candidate_key(candidate, source_table)
            if not key:
                continue
            entry = bucket.get(key)
            if entry:
                entry.setdefault("sources", set()).add(source_table)
                entry.setdefault("strategies", set()).add(source)
                if commodity_match is True:
                    entry["commodity_match"] = True
                elif commodity_match is not None and entry.get("commodity_match") is None:
                    entry["commodity_match"] = commodity_match
                for field in [
                    "company_id",
                    "company_name",
                    "country",
                    "address_full",
                    "contact_phone",
                    "contact_email",
                    "contact_website",
                    "total_value_usd",
                    "total_trade_value_usd",
                ]:
                    if not entry.get(field) and candidate.get(field):
                        entry[field] = candidate.get(field)
                continue
            entry = dict(candidate)
            entry["sources"] = {source_table}
            entry["strategies"] = {source}
            if commodity_match is not None:
                entry["commodity_match"] = commodity_match
            bucket[key] = entry

    def _candidate_key(self, candidate: Dict[str, Any], source_table: str) -> Optional[str]:
        if candidate.get("company_id"):
            return f"id:{candidate['company_id']}"
        name = candidate.get("company_name") or candidate.get("name")
        if not name:
            return None
        country = candidate.get("country")
        if country:
            return f"name:{self._normalize_text(name)}|{self._normalize_text(country)}"
        return f"name:{self._normalize_text(name)}"

    def _pick_strategy(self, sources_present: set[str]) -> Optional[str]:
        for strategy in [
            "historical",
            "similarity",
            "geospatial",
            "prediction",
            "commodity_pool",
            "fallback_global",
        ]:
            if strategy in sources_present:
                return strategy
        return None

    def _source_boost(self, sources: Optional[Any]) -> float:
        boosts = {
            "trade_records": 0.12,
            "trade_links": 0.1,
            "predicted_partners": 0.06,
            "companies": 0.04,
            "fallback_global": 0.0,
        }
        if not sources:
            return 0.0
        if isinstance(sources, set):
            source_list = sources
        elif isinstance(sources, list):
            source_list = set(sources)
        else:
            source_list = {sources}
        return max([boosts.get(source, 0.0) for source in source_list] or [0.0])

    def _country_preference_bonus(self, candidate_country: Optional[str], country_pref: Optional[str]) -> float:
        if not candidate_country or not country_pref:
            return 0.0
        if self._country_matches(candidate_country, country_pref):
            return 0.05
        return 0.0

    async def _company_trades_commodity(
        self,
        company: Dict[str, Any],
        commodity: str,
        hs_code: Optional[str],
        role: str,
    ) -> bool:
        if not self.db or not commodity:
            return False
        cache_key = self._metric_cache_key(company, commodity, hs_code, role)
        if cache_key is not None and cache_key in self._commodity_match_cache:
            return self._commodity_match_cache[cache_key]
        company_id = company.get("id")
        company_name = company.get("name")
        if not company_id and not company_name:
            result = False
            if cache_key is not None:
                self._commodity_match_cache[cache_key] = result
            return result
        like = f"%{commodity}%"
        if role == "buyer":
            condition = """
                (importer_id = $1 OR importer_name ILIKE $2 OR consignee_id = $1 OR consignee_name ILIKE $2)
            """
        else:
            condition = """
                (exporter_id = $1 OR exporter_name ILIKE $2 OR supplier_id = $1 OR supplier_name ILIKE $2)
            """
        row = await self.db.fetchrow(
            f"""
            SELECT 1
            FROM trade_records
            WHERE {condition}
              AND (hs_code = $3 OR product_description ILIKE $4 OR item_description ILIKE $4)
            LIMIT 1
            """,
            company_id,
            f"%{company_name}%" if company_name else None,
            hs_code,
            like,
        )
        result = bool(row)
        if cache_key is not None:
            self._commodity_match_cache[cache_key] = result
        return result

    async def _guess_hs_code(self, commodity: str) -> Optional[str]:
        if not self.db or not commodity:
            return None
        like = f"%{commodity}%"
        row = await self.db.fetchrow(
            """
            SELECT hs_code, COUNT(*) AS cnt
            FROM trade_records
            WHERE hs_code IS NOT NULL
              AND (product_description ILIKE $1 OR item_description ILIKE $1)
            GROUP BY hs_code
            ORDER BY cnt DESC
            LIMIT 1
            """,
            like,
        )
        if row and row.get("hs_code"):
            return str(row["hs_code"])
        row = await self.db.fetchrow(
            """
            SELECT hs_code, COUNT(*) AS cnt
            FROM products
            WHERE name ILIKE $1
              AND hs_code IS NOT NULL
            GROUP BY hs_code
            ORDER BY cnt DESC
            LIMIT 1
            """,
            like,
        )
        if row and row.get("hs_code"):
            return str(row["hs_code"])
        return None

    def _fallback_company(self, candidate: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        name = candidate.get("company_name") or candidate.get("name")
        if not name:
            return None
        address = candidate.get("address_full") or candidate.get("address")
        return {
            "id": candidate.get("company_id"),
            "name": name,
            "country": candidate.get("country"),
            "city": None,
            "state": None,
            "pin_code": candidate.get("pin_code"),
            "address_full": address,
            "location": candidate.get("location"),
            "is_verified": candidate.get("is_verified"),
            "contact_phone": candidate.get("contact_phone"),
            "contact_email": candidate.get("contact_email"),
            "contact_website": candidate.get("contact_website"),
            "total_trade_value_usd": candidate.get("total_trade_value_usd")
            or candidate.get("total_value_usd"),
            "extra": candidate.get("extra") or {},
        }

    def _normalize_candidate_company(
        self,
        candidate: Dict[str, Any],
        company_row: Optional[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        base = self._fallback_company(candidate) or {}
        base["city"] = candidate.get("city") or base.get("city")
        base["state"] = candidate.get("state") or base.get("state")
        base["pin_code"] = candidate.get("pin_code") or base.get("pin_code")
        if company_row:
            base["id"] = company_row.get("id") or base.get("id")
            base["name"] = company_row.get("name") or base.get("name")
            base["country"] = base.get("country") or company_row.get("country")
            base["city"] = base.get("city") or company_row.get("city")
            base["state"] = base.get("state") or company_row.get("state")
            base["pin_code"] = base.get("pin_code") or company_row.get("pin_code")
            base["address_full"] = base.get("address_full") or company_row.get("address_full")
            base["location"] = company_row.get("location") or base.get("location")
            if company_row.get("is_verified") is not None:
                base["is_verified"] = company_row.get("is_verified")
            base["total_trade_value_usd"] = (
                base.get("total_trade_value_usd") or company_row.get("total_trade_value_usd")
            )
            base["business_details"] = company_row.get("business_details")
            base["product_categories"] = company_row.get("product_categories")
            base["hs_codes_dealt"] = company_row.get("hs_codes_dealt")
            base["extra"] = company_row.get("extra") or base.get("extra")
            contact = flatten_contact_info(
                company_row.get("contact_info"),
                fallback_phone=base.get("contact_phone"),
                fallback_email=base.get("contact_email"),
                fallback_website=base.get("contact_website"),
            )
            base.update(contact)
        return base

    async def _fetch_company(self, company_id: Optional[str], name: Optional[str]) -> Optional[Dict[str, Any]]:
        if not self.db:
            return None
        cache_key = self._company_cache_key(company_id, name)
        if cache_key and cache_key in self._company_cache:
            return self._company_cache[cache_key]
        if company_id:
            row = await self.db.fetchrow(
                """
                SELECT id, name, country, city, state, pin_code, address_full, location,
                       contact_info, business_details, product_categories, hs_codes_dealt,
                       is_verified, total_trade_value_usd, extra
                FROM companies
                WHERE id = $1
                """,
                company_id,
            )
            result = dict(row) if row else None
            if cache_key:
                self._company_cache[cache_key] = result
            return result
        if not name:
            return None
        normalized = name.strip().lower()
        row = await self.db.fetchrow(
            """
            SELECT id, name, country, city, state, pin_code, address_full, location,
                   contact_info, business_details, product_categories, hs_codes_dealt,
                   is_verified, total_trade_value_usd, extra
            FROM companies
            WHERE name_normalized = $1
            LIMIT 1
            """,
            normalized,
        )
        if row:
            result = dict(row)
            if cache_key:
                self._company_cache[cache_key] = result
            return result
        row = await self.db.fetchrow(
            """
            SELECT id, name, country, city, state, pin_code, address_full, location,
                   contact_info, business_details, product_categories, hs_codes_dealt,
                   is_verified, total_trade_value_usd, extra
            FROM companies
            WHERE name ILIKE $1
            LIMIT 1
            """,
            f"%{name}%",
        )
        result = dict(row) if row else None
        if cache_key:
            self._company_cache[cache_key] = result
        return result

    async def _get_product_info(
        self, company: Dict[str, Any], commodity: str, hs_code: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        if not self.db:
            return None
        if not hs_code and not commodity:
            return None
        cache_key = None
        company_key = self._company_cache_key(company.get("id"), company.get("name"))
        if company_key:
            cache_key = (company_key, commodity or "", hs_code or "")
            if cache_key in self._product_cache:
                return self._product_cache[cache_key]
        like = f"%{commodity}%" if commodity else None
        company_id = company.get("id")
        name_like = f"%{company.get('name')}%" if company.get("name") else None
        if hs_code:
            commodity_clause = "hs_code = $3"
            params = [company_id, name_like, hs_code]
        else:
            commodity_clause = "(product_description ILIKE $3 OR item_description ILIKE $3)"
            params = [company_id, name_like, like]
        row = await self.db.fetchrow(
            f"""
            SELECT COALESCE(product_description, item_description) AS product_name,
                   AVG(COALESCE(unit_price_usd, unit_price)) AS avg_price,
                   MIN(quantity) AS min_qty
            FROM trade_records
            WHERE (
                ($1::uuid IS NOT NULL AND (exporter_id = $1 OR importer_id = $1 OR supplier_id = $1 OR consignee_id = $1))
                OR ($2::text IS NOT NULL AND (
                    exporter_name ILIKE $2 OR importer_name ILIKE $2 OR supplier_name ILIKE $2 OR consignee_name ILIKE $2
                ))
            )
              AND {commodity_clause}
            GROUP BY COALESCE(product_description, item_description)
            ORDER BY COUNT(*) DESC
            LIMIT 1
            """,
            *params,
        )
        if not row:
            result = await self._get_catalog_product_info(commodity, hs_code)
            if cache_key:
                self._product_cache[cache_key] = result
            return result
        price = row["avg_price"]
        min_qty = row["min_qty"]
        result = {
            "name": row["product_name"] or commodity,
            "price": f"{float(price):.2f}" if price is not None else None,
            "moq": f"{float(min_qty):.2f}" if min_qty is not None else None,
        }
        if cache_key:
            self._product_cache[cache_key] = result
        return result

    async def _get_catalog_product_info(
        self,
        commodity: Optional[str],
        hs_code: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        if not self.db:
            return None
        row = None
        if hs_code:
            row = await self.db.fetchrow(
                """
                SELECT name, price_value, price_unit
                FROM products
                WHERE hs_code = $1
                LIMIT 1
                """,
                hs_code,
            )
        if not row and commodity:
            row = await self.db.fetchrow(
                """
                SELECT name, price_value, price_unit
                FROM products
                WHERE name ILIKE $1
                LIMIT 1
                """,
                f"%{commodity}%",
            )
        if not row:
            return None
        price = row["price_value"]
        price_unit = row["price_unit"] or ""
        price_str = f"{float(price):.2f} {price_unit}".strip() if price is not None else None
        return {
            "name": row["name"] or commodity,
            "price": price_str,
            "moq": None,
        }

    def _fallback_product_info(
        self,
        company: Dict[str, Any],
        commodity: Optional[str],
        hs_code: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        name = None
        categories = company.get("product_categories") or []
        if categories:
            name = str(categories[0])
        hs_codes = company.get("hs_codes_dealt") or []
        if not name and hs_codes:
            name = f"HS {hs_codes[0]}"
        if not name and hs_code:
            name = f"HS {hs_code}"
        if not name and commodity:
            name = commodity
        if not name:
            return None
        return {"name": name, "price": None, "moq": None}

    async def _get_average_price_for_company(
        self,
        company: Dict[str, Any],
        commodity: str,
        hs_code: Optional[str],
        role: str,
    ) -> Optional[float]:
        if not self.db:
            return None
        cache_key = self._metric_cache_key(company, commodity, hs_code, role)
        if cache_key is not None and cache_key in self._avg_price_cache:
            return self._avg_price_cache[cache_key]
        like = f"%{commodity}%"
        if role == "buyer":
            condition = """
                (importer_id = $1 OR importer_name ILIKE $2 OR consignee_id = $1 OR consignee_name ILIKE $2)
            """
        else:
            condition = """
                (exporter_id = $1 OR exporter_name ILIKE $2 OR supplier_id = $1 OR supplier_name ILIKE $2)
            """
        row = await self.db.fetchrow(
            f"""
            SELECT AVG(COALESCE(unit_price_usd, unit_price)) AS price
            FROM trade_records
            WHERE {condition}
              AND (hs_code = $3 OR product_description ILIKE $4 OR item_description ILIKE $4)
              AND COALESCE(unit_price_usd, unit_price) IS NOT NULL
            """,
            company.get("id"),
            f"%{company.get('name')}%",
            hs_code,
            like,
        )
        result = float(row["price"]) if row and row["price"] is not None else None
        if cache_key is not None:
            self._avg_price_cache[cache_key] = result
        return result

    async def _get_primary_port(
        self,
        company: Dict[str, Any],
        commodity: str,
        hs_code: Optional[str],
        role: str,
    ) -> Optional[str]:
        if not self.db:
            return None
        cache_key = self._metric_cache_key(company, commodity, hs_code, role)
        if cache_key is not None and cache_key in self._primary_port_cache:
            return self._primary_port_cache[cache_key]
        like = f"%{commodity}%"
        if role == "buyer":
            condition = """
                (importer_id = $1 OR importer_name ILIKE $2 OR consignee_id = $1 OR consignee_name ILIKE $2)
            """
            port_expr = "COALESCE(foreign_port, indian_port)"
        else:
            condition = """
                (exporter_id = $1 OR exporter_name ILIKE $2 OR supplier_id = $1 OR supplier_name ILIKE $2)
            """
            port_expr = "COALESCE(indian_port, foreign_port)"
        row = await self.db.fetchrow(
            f"""
            SELECT {port_expr} AS port, COUNT(*) AS cnt
            FROM trade_records
            WHERE {condition}
              AND {port_expr} IS NOT NULL
              AND (hs_code = $3 OR product_description ILIKE $4 OR item_description ILIKE $4)
            GROUP BY {port_expr}
            ORDER BY cnt DESC
            LIMIT 1
            """,
            company.get("id"),
            f"%{company.get('name')}%",
            hs_code,
            like,
        )
        result = row["port"] if row else None
        if cache_key is not None:
            self._primary_port_cache[cache_key] = result
        return result

    async def _predict_price_fluctuation(self, commodity: str, hs_code: Optional[str]) -> float:
        if not self.db:
            return 0.0
        like = f"%{commodity}%"
        if not hs_code:
            hs_code = await self._guess_hs_code(commodity)
            if not hs_code:
                return 0.0
        if hs_code:
            rows = await self.db.fetch(
                """
                SELECT COALESCE(unit_price_usd, unit_price) AS price
                FROM trade_records
                WHERE hs_code = $1
                  AND COALESCE(unit_price_usd, unit_price) IS NOT NULL
                ORDER BY COALESCE(sb_date, reg_date) DESC
                LIMIT 24
                """,
                hs_code,
            )
        else:
            cutoff = datetime.utcnow().date() - timedelta(days=365 * 3)
            rows = await self.db.fetch(
                """
                SELECT COALESCE(unit_price_usd, unit_price) AS price
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND COALESCE(unit_price_usd, unit_price) IS NOT NULL
                  AND ((sb_date IS NOT NULL AND sb_date >= $2) OR (reg_date IS NOT NULL AND reg_date >= $2))
                ORDER BY COALESCE(sb_date, reg_date) DESC
                LIMIT 24
                """,
                like,
                cutoff,
            )
        prices = [float(r["price"]) for r in rows if r["price"] is not None]
        if len(prices) >= 4:
            volatility = calculate_volatility(prices, period=12)
            return round(volatility, 2)
        llm_value = await self._llm_price_fluctuation(commodity)
        return round(llm_value, 2)

    async def _llm_price_fluctuation(self, commodity: str) -> float:
        try:
            from ..utils.ai_factory import get_ai_client

            client = get_ai_client()
            analysis = await client.analyze_market(
                commodity=commodity,
                historical_prices=[],
                historical_volumes=[],
                top_countries=[],
                context={},
            )
            forecasts = (
                analysis.get("price_forecast")
                or analysis.get("price_forecasts")
                or {}
            )
            values = [float(v) for v in forecasts.values() if _is_number(v)]
            if len(values) >= 2:
                base = values[0] or 1
                delta = abs(values[1] - values[0])
                return (delta / base) * 100
        except Exception:
            return 0.0
        return 0.0

    async def _assess_risk(
        self,
        company: Dict[str, Any],
        commodity: str,
        hs_code: Optional[str],
        price_fluctuation: Optional[float] = None,
    ) -> str:
        verification = 0.2 if company.get("is_verified") else 0.0
        trade_value = company.get("total_trade_value_usd") or 0
        trade_score = normalize_score(float(trade_value), 0, 1e8)
        volatility = (
            price_fluctuation
            if price_fluctuation is not None
            else await self._predict_price_fluctuation(commodity, hs_code)
        )
        volatility_score = normalize_score(volatility, 0, 50, inverse=True)
        safety = min(1.0, verification + 0.5 * trade_score + 0.3 * volatility_score)
        risk = 1 - safety
        if risk <= 0.33:
            return "Low"
        if risk <= 0.66:
            return "Medium"
        return "High"

    def _legacy_response_from_matches(
        self,
        matches: List[Dict[str, Any]],
        strategy: Optional[str],
        distance_km: Optional[float],
    ):
        if not matches:
            return {
                "found": False,
                "predicted_partner": None,
                "distance_km": None,
                "confidence": None,
                "method": None,
            }
        top = matches[0]
        method_map = {
            "historical": "historical_match",
            "similarity": "similarity_match",
            "geospatial": "geospatial_cluster",
            "prediction": "graph_ai_inference",
            "commodity_pool": "commodity_pool",
            "fallback_global": "global_fallback",
        }
        confidence_map = {
            "historical": "high",
            "similarity": "medium",
            "geospatial": "low",
            "prediction": "inferred",
            "commodity_pool": "low",
            "fallback_global": "low",
        }
        return {
            "found": True,
            "predicted_partner": {
                "name": top["company_name"],
                "address": top.get("location"),
            },
            "distance_km": round(distance_km, 2) if distance_km is not None else None,
            "confidence": confidence_map.get(strategy),
            "method": method_map.get(strategy),
        }

    def _format_location(self, company: Dict[str, Any]) -> Optional[str]:
        return format_location(
            company.get("address_full"),
            company.get("city"),
            company.get("state"),
            company.get("country"),
            company.get("pin_code"),
        )

    def _distance_km_between(self, loc_a: Any, loc_b: Any) -> Optional[float]:
        if not loc_a or not loc_b:
            return None
        lon_a, lat_a = self._extract_lon_lat(loc_a)
        lon_b, lat_b = self._extract_lon_lat(loc_b)
        if lon_a == 0.0 and lat_a == 0.0:
            return None
        if lon_b == 0.0 and lat_b == 0.0:
            return None
        rad = math.pi / 180
        dlon = (lon_b - lon_a) * rad
        dlat = (lat_b - lat_a) * rad
        a = (math.sin(dlat / 2) ** 2) + (
            math.cos(lat_a * rad) * math.cos(lat_b * rad) * (math.sin(dlon / 2) ** 2)
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return 6371 * c

    def _extract_lon_lat(self, value) -> Tuple[float, float]:
        if value is None:
            return 0.0, 0.0
        if hasattr(value, "x") and hasattr(value, "y"):
            return float(value.x), float(value.y)
        if hasattr(value, "lon") and hasattr(value, "lat"):
            return float(value.lon), float(value.lat)
        if isinstance(value, dict) and "lon" in value and "lat" in value:
            return float(value["lon"]), float(value["lat"])
        if isinstance(value, (list, tuple)) and len(value) >= 2:
            return float(value[0]), float(value[1])
        return 0.0, 0.0


def _is_number(value: Any) -> bool:
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False
