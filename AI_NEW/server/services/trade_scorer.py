"""
Trade Scoring Service

Calculates weighted "Gravity Score" for potential trade partners.
This is a deterministic calculation (no LLM involved).
"""

from __future__ import annotations

import json
import logging
import math
import re
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ..utils.statistics import calculate_growth_rate, calculate_volatility, normalize_score
from ..services.entity_resolver import extract_trade_contact, extract_trade_location
from ..config import settings

logger = logging.getLogger(__name__)


class TradeScorer:
    """Gravity scoring implementation using 11 weighted factors."""

    UNINDEXED_LOOKUP_MIN_CHARS = 4
    UNINDEXED_LOOKBACK_DAYS = 365 * 3
    GENERIC_NAME_TOKENS = {
        "buyer",
        "seller",
        "company",
        "co",
        "inc",
        "ltd",
        "llc",
        "trading",
        "exports",
        "export",
        "imports",
        "import",
        "international",
        "global",
        "group",
    }

    BUYER_WEIGHTS = {
        "demand": 0.20,
        "source_geography": 0.15,
        "port_proximity": 0.15,
        "transport_cost": 0.10,
        "capital": 0.10,
        "financing": 0.07,
        "price_range": 0.07,
        "weather": 0.05,
        "volatility": 0.05,
        "barrier": 0.03,
        "frequency": 0.03,
    }
    SELLER_WEIGHTS = {
        "demand": 0.07,
        "source_geography": 0.20,
        "port_proximity": 0.15,
        "transport_cost": 0.10,
        "capital": 0.10,
        "financing": 0.07,
        "price_range": 0.15,
        "weather": 0.05,
        "volatility": 0.05,
        "barrier": 0.03,
        "frequency": 0.03,
    }

    def __init__(self, db):
        self.db = db
        self.weights_by_role = {
            "buyer": self._load_weights(self.BUYER_WEIGHTS),
            "seller": self._load_weights(self.SELLER_WEIGHTS),
        }

    async def score(self, request) -> dict:
        """
        Calculate gravity score(s).

        - Pair scoring (new API): returns gravity score + breakdown.
        - Batch scoring (legacy API): returns normalized scores for candidates.
        """
        if request.candidates:
            return await self._score_candidates(request)
        return await self._score_pair(request)

    async def _score_pair(self, request) -> Dict[str, Any]:
        buyer, seller = await self._resolve_buyer_seller(request)
        role_value = getattr(request, "role", None)
        role_value = role_value.value if hasattr(role_value, "value") else role_value
        breakdown = await self._calculate_breakdown(
            commodity=request.commodity,
            hs_code=request.hs_code,
            buyer=buyer,
            seller=seller,
            buyer_port=request.buyer_port,
            price_range=request.price_range,
            role=role_value,
        )
        gravity_score = round(sum(breakdown.values()), 4)
        probability = round(min(100.0, max(0.0, gravity_score * 100)), 2)
        return {
            "gravity_score": gravity_score,
            "probability": probability,
            "breakdown": breakdown,
        }

    async def _score_candidates(self, request) -> Dict[str, Any]:
        reference = request.reference_entity
        if not reference:
            raise ValueError("reference_entity is required for batch scoring")

        scores = []
        role_value = getattr(request, "role", None)
        role_value = role_value.value if hasattr(role_value, "value") else role_value
        if not role_value and request.type:
            type_value = request.type.value if hasattr(request.type, "value") else request.type
            role_value = "seller" if type_value == "buyer" else "buyer"

        for candidate in request.candidates or []:
            buyer, seller = await self._resolve_from_candidate(request, reference, candidate)
            breakdown = await self._calculate_breakdown(
                commodity=request.commodity,
                hs_code=request.hs_code,
                buyer=buyer,
                seller=seller,
                buyer_port=candidate.port,
                price_range=request.price_range,
                role=role_value,
            )
            gravity_score = sum(breakdown.values())
            scores.append(
                {
                    "name": candidate.name,
                    "company_id": candidate.company_id,
                    "gravity_score": gravity_score,
                    "breakdown": breakdown,
                }
            )

        total = sum(s["gravity_score"] for s in scores) or 1
        scored_candidates = []
        for entry in sorted(scores, key=lambda x: x["gravity_score"], reverse=True):
            probability = round((entry["gravity_score"] / total) * 100, 2)
            scored_candidates.append(
                {
                    "name": entry["name"],
                    "company_id": entry["company_id"],
                    "probability": probability,
                    "reason": "Gravity score based on trade factors",
                }
            )

        return {"scores": scored_candidates}

    async def _resolve_buyer_seller(self, request) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        buyer = None
        seller = None
        if request.buyer_id or request.buyer_name:
            buyer = await self._fetch_company(request.buyer_id, request.buyer_name)
        if request.seller_id or request.seller_name:
            seller = await self._fetch_company(request.seller_id, request.seller_name)
        if not buyer and request.buyer_name:
            buyer = await self._hydrate_party_from_trade_records(request.buyer_name, "buyer")
        if not seller and request.seller_name:
            seller = await self._hydrate_party_from_trade_records(request.seller_name, "seller")
        if not buyer and (request.buyer_name or request.buyer_country):
            buyer = {
                "id": request.buyer_id,
                "name": request.buyer_name,
                "country": request.buyer_country,
                "location": None,
                "extra": {},
            }
        if not seller and (request.seller_name or request.seller_country):
            seller = {
                "id": request.seller_id,
                "name": request.seller_name,
                "country": request.seller_country,
                "location": None,
                "extra": {},
            }
        role = getattr(request, "role", None)
        role_value = role.value if hasattr(role, "value") else role
        profile = getattr(request, "profile", None)
        if profile:
            if role_value == "buyer":
                buyer = self._apply_profile_context(buyer, profile)
            elif role_value == "seller":
                seller = self._apply_profile_context(seller, profile)
        return buyer, seller

    async def _resolve_from_candidate(self, request, reference, candidate):
        if request.type == "buyer" or getattr(request.type, "value", request.type) == "buyer":
            seller = await self._fetch_company(None, reference.name)
            buyer = await self._fetch_company(candidate.company_id, candidate.name)
        else:
            buyer = await self._fetch_company(None, reference.name)
            seller = await self._fetch_company(candidate.company_id, candidate.name)
        return buyer, seller

    async def _calculate_breakdown(
        self,
        commodity: str,
        hs_code: Optional[str],
        buyer: Optional[Dict[str, Any]],
        seller: Optional[Dict[str, Any]],
        buyer_port: Optional[str],
        price_range: Optional[Dict[str, float]],
        role: Optional[str] = None,
    ) -> Dict[str, float]:
        weights = self._select_weights(role)
        demand_score = await self._calculate_demand_factor(commodity, hs_code)
        geography_score, distance_km = self._calculate_geography_factor(buyer, seller)
        port_score = await self._calculate_port_factor(buyer_port, seller, commodity, hs_code)
        transport_score = self._calculate_transport_factor(distance_km)
        capital_score = self._calculate_capital_factor(seller)
        financing_score = self._calculate_financing_factor(buyer, seller)
        price_score = await self._calculate_price_range_factor(price_range, seller, commodity, hs_code)
        weather_score = self._calculate_weather_factor(commodity, seller)
        volatility_score = await self._calculate_volatility_factor(commodity, hs_code)
        barrier_score = self._calculate_barrier_factor(buyer, seller)
        frequency_score = await self._calculate_frequency_factor(buyer, seller, commodity, hs_code)

        return {
            "demand": round(demand_score * weights["demand"], 4),
            "source_geography": round(geography_score * weights["source_geography"], 4),
            "port_proximity": round(port_score * weights["port_proximity"], 4),
            "transport_cost": round(transport_score * weights["transport_cost"], 4),
            "capital": round(capital_score * weights["capital"], 4),
            "financing": round(financing_score * weights["financing"], 4),
            "price_range": round(price_score * weights["price_range"], 4),
            "weather": round(weather_score * weights["weather"], 4),
            "volatility": round(volatility_score * weights["volatility"], 4),
            "barrier": round(barrier_score * weights["barrier"], 4),
            "frequency": round(frequency_score * weights["frequency"], 4),
        }

    def _apply_profile_context(self, party: Optional[Dict[str, Any]], profile) -> Dict[str, Any]:
        party = party or {"id": None, "name": None, "country": None, "location": None, "extra": {}}
        if profile.country:
            party["country"] = profile.country
        if profile.location:
            party["location"] = (profile.location.lon, profile.location.lat)
        extra = dict(party.get("extra") or {})
        if profile.mean_monthly_revenue is not None:
            extra["meanMonthlyRevenue"] = profile.mean_monthly_revenue
        if profile.payment_terms:
            extra["payment_terms"] = profile.payment_terms
        if profile.credit_score is not None:
            extra["credit_score"] = profile.credit_score
        party["extra"] = extra
        return party

    async def calculate_pair_score(
        self,
        commodity: str,
        hs_code: Optional[str],
        buyer: Optional[Dict[str, Any]],
        seller: Optional[Dict[str, Any]],
        buyer_port: Optional[str] = None,
        price_range: Optional[Dict[str, float]] = None,
        role: Optional[str] = None,
    ) -> Tuple[float, Dict[str, float]]:
        breakdown = await self._calculate_breakdown(
            commodity=commodity,
            hs_code=hs_code,
            buyer=buyer,
            seller=seller,
            buyer_port=buyer_port,
            price_range=price_range,
            role=role,
        )
        return round(sum(breakdown.values()), 4), breakdown

    async def _calculate_demand_factor(self, commodity: str, hs_code: Optional[str]) -> float:
        volumes = await self._get_trade_volume_series(commodity, hs_code)
        if len(volumes) < 2:
            return 0.5
        growth = calculate_growth_rate(volumes[0], volumes[-1])
        return normalize_score(growth, -20, 20)

    def _calculate_geography_factor(
        self, buyer: Optional[Dict[str, Any]], seller: Optional[Dict[str, Any]]
    ) -> Tuple[float, Optional[float]]:
        if buyer and seller and buyer.get("location") and seller.get("location"):
            distance_km = self._distance_km(buyer["location"], seller["location"])
            return normalize_score(distance_km, 0, 20000, inverse=True), distance_km
        if buyer and seller and buyer.get("country") and seller.get("country"):
            return (0.7 if buyer["country"] == seller["country"] else 0.4), None
        return 0.5, None

    async def _calculate_port_factor(
        self,
        buyer_port: Optional[str],
        seller: Optional[Dict[str, Any]],
        commodity: str,
        hs_code: Optional[str],
    ) -> float:
        if not buyer_port:
            return 0.5
        seller_port = await self._get_primary_port(seller, commodity, hs_code)
        if not seller_port:
            return 0.4
        buyer_port_norm = buyer_port.lower()
        seller_port_norm = seller_port.lower()
        if buyer_port_norm in seller_port_norm or seller_port_norm in buyer_port_norm:
            return 1.0
        shared_tokens = set(buyer_port_norm.split()) & set(seller_port_norm.split())
        return 0.7 if shared_tokens else 0.3

    def _calculate_transport_factor(self, distance_km: Optional[float]) -> float:
        if distance_km is None:
            return 0.5
        return normalize_score(distance_km, 0, 20000, inverse=True)

    def _calculate_capital_factor(self, seller: Optional[Dict[str, Any]]) -> float:
        if not seller:
            return 0.5
        extra = seller.get("extra") or {}
        if isinstance(extra, str):
            try:
                extra = json.loads(extra) if extra.strip() else {}
            except Exception:
                extra = {}
        if not isinstance(extra, dict):
            extra = {}
        value = _safe_float(extra.get("meanMonthlyRevenue")) or _safe_float(seller.get("total_trade_value_usd")) or 0.0
        max_ref = 1e8
        return min(1.0, math.log1p(value) / math.log1p(max_ref))

    def _calculate_financing_factor(
        self, buyer: Optional[Dict[str, Any]], seller: Optional[Dict[str, Any]]
    ) -> float:
        scores = []
        for party in [buyer, seller]:
            if not party:
                continue
            score = _score_financing(party)
            if score is not None:
                scores.append(score)
        if not scores:
            return 0.5
        return sum(scores) / len(scores)

    def _load_weights(self, base_weights: Dict[str, float]) -> Dict[str, float]:
        weights = dict(base_weights)
        raw = settings.TRADE_SCORE_WEIGHTS_JSON
        if raw:
            try:
                overrides = json.loads(raw)
                for key, value in overrides.items():
                    if key in weights and isinstance(value, (int, float)):
                        weights[key] = float(value)
            except Exception as exc:
                logger.warning("invalid TRADE_SCORE_WEIGHTS_JSON: %s", exc)
        total = sum(weights.values()) or 1.0
        return {k: v / total for k, v in weights.items()}

    def _select_weights(self, role: Optional[str]) -> Dict[str, float]:
        role_value = role.value if hasattr(role, "value") else role
        if role_value in self.weights_by_role:
            return self.weights_by_role[role_value]
        return self.weights_by_role["buyer"]

    async def _calculate_price_range_factor(
        self,
        price_range: Optional[Dict[str, float]],
        seller: Optional[Dict[str, Any]],
        commodity: str,
        hs_code: Optional[str],
    ) -> float:
        if not price_range or not seller:
            return 0.5
        avg_price = await self._get_average_price(seller, commodity, hs_code)
        if avg_price is None:
            return 0.5
        min_price = price_range.get("min")
        max_price = price_range.get("max")
        if min_price is None or max_price is None:
            return 0.5
        if min_price <= avg_price <= max_price:
            return 1.0
        target = min_price if avg_price < min_price else max_price
        diff = abs(avg_price - target)
        span = max(max_price - min_price, max_price, 1)
        return max(0.0, 1 - (diff / span))

    def _calculate_weather_factor(self, commodity: str, seller: Optional[Dict[str, Any]]) -> float:
        if not seller or not seller.get("country"):
            return 0.8
        weather_data = _load_weather_risk()
        commodity_key = commodity.lower()
        country = seller.get("country")
        month_key = datetime.utcnow().strftime("%b")
        commodity_block = weather_data.get(commodity_key) or weather_data.get("default", {})
        country_block = commodity_block.get(country) or commodity_block.get("default", {})
        return _safe_float(country_block.get(month_key) or country_block.get("all") or 0.8) or 0.8

    async def _calculate_volatility_factor(self, commodity: str, hs_code: Optional[str]) -> float:
        prices = await self._get_price_series(commodity, hs_code)
        if len(prices) < 2:
            return 0.5
        volatility = calculate_volatility(prices, period=12)
        return normalize_score(volatility, 0, 50, inverse=True)

    def _calculate_barrier_factor(
        self, buyer: Optional[Dict[str, Any]], seller: Optional[Dict[str, Any]]
    ) -> float:
        if not buyer or not seller or not buyer.get("country") or not seller.get("country"):
            return 0.85
        barriers = _load_trade_barriers()
        key = f"{seller['country']}->{buyer['country']}"
        return _safe_float(barriers.get(key) or barriers.get("default") or 0.85) or 0.85

    async def _calculate_frequency_factor(
        self,
        buyer: Optional[Dict[str, Any]],
        seller: Optional[Dict[str, Any]],
        commodity: str,
        hs_code: Optional[str],
    ) -> float:
        if not buyer or not seller:
            return 0.0
        count = await self._count_trades_between(buyer, seller, commodity, hs_code)
        return round(math.tanh((count or 0) / 10), 4)

    async def _hydrate_party_from_trade_records(self, name: str, role: str) -> Optional[Dict[str, Any]]:
        if not self.db or not name:
            return None
        like = f"%{name}%"
        if role == "buyer":
            row = await self.db.fetchrow(
                """
                SELECT COALESCE(consignee_name, importer_name) AS name,
                       COALESCE(consignee_address, importer_address) AS address_full,
                       COALESCE(destination_country, origin_country) AS country,
                       extra
                FROM trade_records
                WHERE importer_name ILIKE $1
                ORDER BY COALESCE(sb_date, reg_date) DESC NULLS LAST
                LIMIT 1
                """,
                like,
            )
            if not row and self._allow_unindexed_lookup(name):
                cutoff = datetime.utcnow().date() - timedelta(
                    days=self.UNINDEXED_LOOKBACK_DAYS
                )
                row = await self.db.fetchrow(
                    """
                    SELECT COALESCE(consignee_name, importer_name) AS name,
                           COALESCE(consignee_address, importer_address) AS address_full,
                           COALESCE(destination_country, origin_country) AS country,
                           extra
                    FROM trade_records
                    WHERE consignee_name ILIKE $1
                      AND (
                        (sb_date IS NOT NULL AND sb_date >= $2)
                        OR (reg_date IS NOT NULL AND reg_date >= $2)
                      )
                    ORDER BY COALESCE(sb_date, reg_date) DESC NULLS LAST
                    LIMIT 1
                    """,
                    like,
                    cutoff,
                )
        else:
            row = await self.db.fetchrow(
                """
                SELECT COALESCE(exporter_name, supplier_name) AS name,
                       COALESCE(exporter_address, supplier_address) AS address_full,
                       COALESCE(origin_country, destination_country) AS country,
                       extra
                FROM trade_records
                WHERE exporter_name ILIKE $1
                ORDER BY COALESCE(sb_date, reg_date) DESC NULLS LAST
                LIMIT 1
                """,
                like,
            )
            if not row and self._allow_unindexed_lookup(name):
                cutoff = datetime.utcnow().date() - timedelta(
                    days=self.UNINDEXED_LOOKBACK_DAYS
                )
                row = await self.db.fetchrow(
                    """
                    SELECT COALESCE(exporter_name, supplier_name) AS name,
                           COALESCE(exporter_address, supplier_address) AS address_full,
                           COALESCE(origin_country, destination_country) AS country,
                           extra
                    FROM trade_records
                    WHERE supplier_name ILIKE $1
                      AND (
                        (sb_date IS NOT NULL AND sb_date >= $2)
                        OR (reg_date IS NOT NULL AND reg_date >= $2)
                      )
                    ORDER BY COALESCE(sb_date, reg_date) DESC NULLS LAST
                    LIMIT 1
                    """,
                    like,
                    cutoff,
                )
        if not row:
            return None
        contact = extract_trade_contact(row.get("extra"))
        location = extract_trade_location(row.get("extra"))
        return {
            "id": None,
            "name": row.get("name") or name,
            "country": row.get("country"),
            "location": None,
            "address_full": row.get("address_full"),
            "extra": {},
            **contact,
            **location,
        }

    async def _fetch_company(self, company_id: Optional[str], name: Optional[str]) -> Optional[Dict[str, Any]]:
        if not self.db:
            return None
        if company_id:
            row = await self.db.fetchrow(
                """
                SELECT id, name, country, city, state, address_full, location,
                       is_verified, total_trade_value_usd, extra
                FROM companies
                WHERE id = $1
                """,
                company_id,
            )
            return dict(row) if row else None
        if not name:
            return None
        normalized = name.strip().lower()
        row = await self.db.fetchrow(
            """
            SELECT id, name, country, city, state, address_full, location,
                   is_verified, total_trade_value_usd, extra
            FROM companies
            WHERE name_normalized = $1
            LIMIT 1
            """,
            normalized,
        )
        if row:
            return dict(row)
        row = await self.db.fetchrow(
            """
            SELECT id, name, country, city, state, address_full, location,
                   is_verified, total_trade_value_usd, extra
            FROM companies
            WHERE name ILIKE $1
            LIMIT 1
            """,
            f"%{name}%",
        )
        return dict(row) if row else None

    async def _get_trade_volume_series(self, commodity: str, hs_code: Optional[str]) -> List[float]:
        if not self.db:
            return []
        like = f"%{commodity}%"
        if hs_code:
            rows = await self.db.fetch(
                """
                SELECT date_trunc('month', COALESCE(sb_date, reg_date)) AS month,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS volume
                FROM trade_records
                WHERE hs_code = $1
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY month
                ORDER BY month ASC
                LIMIT 24
                """,
                hs_code,
            )
        else:
            cutoff = datetime.utcnow().date() - timedelta(days=365 * 3)
            rows = await self.db.fetch(
                """
                SELECT date_trunc('month', COALESCE(sb_date, reg_date)) AS month,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS volume
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND ((sb_date IS NOT NULL AND sb_date >= $2) OR (reg_date IS NOT NULL AND reg_date >= $2))
                GROUP BY month
                ORDER BY month ASC
                LIMIT 24
                """,
                like,
                cutoff,
            )
        return [float(r["volume"] or 0) for r in rows]

    async def _get_price_series(self, commodity: str, hs_code: Optional[str]) -> List[float]:
        if not self.db:
            return []
        like = f"%{commodity}%"
        if hs_code:
            rows = await self.db.fetch(
                """
                SELECT COALESCE(unit_price_usd, unit_price) AS price
                FROM trade_records
                WHERE hs_code = $1
                  AND COALESCE(unit_price_usd, unit_price) IS NOT NULL
                ORDER BY COALESCE(sb_date, reg_date) DESC
                LIMIT 60
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
                LIMIT 60
                """,
                like,
                cutoff,
            )
        return [float(r["price"]) for r in rows if r["price"] is not None]

    async def _get_average_price(
        self, seller: Dict[str, Any], commodity: str, hs_code: Optional[str]
    ) -> Optional[float]:
        if not self.db:
            return None
        seller_id = seller.get("id")
        seller_name = seller.get("name")
        if not seller_id and not seller_name:
            return None

        params: List[Any] = []
        if seller_id:
            seller_clause = "(exporter_id = $1 OR supplier_id = $1)"
            params.append(seller_id)
        else:
            seller_clause = "exporter_name ILIKE $1"
            if self._allow_unindexed_lookup(seller_name):
                seller_clause = f"({seller_clause} OR supplier_name ILIKE $1)"
            params.append(f"%{seller_name}%")

        if hs_code:
            commodity_clause = f"hs_code = ${len(params) + 1}"
            params.append(hs_code)
        else:
            commodity_clause = (
                f"(product_description ILIKE ${len(params) + 1} "
                f"OR item_description ILIKE ${len(params) + 1})"
            )
            params.append(f"%{commodity}%")

        row = await self.db.fetchrow(
            f"""
            SELECT AVG(COALESCE(unit_price_usd, unit_price)) AS price
            FROM trade_records
            WHERE {seller_clause}
              AND {commodity_clause}
              AND COALESCE(unit_price_usd, unit_price) IS NOT NULL
            """,
            *params,
        )
        if row and row["price"] is not None:
            return float(row["price"])
        return None

    async def _count_trades_between(
        self,
        buyer: Dict[str, Any],
        seller: Dict[str, Any],
        commodity: str,
        hs_code: Optional[str],
    ) -> int:
        if not self.db:
            return 0
        params: List[Any] = []
        conditions: List[str] = []

        seller_id = seller.get("id")
        seller_name = seller.get("name")
        if seller_id:
            conditions.append(f"(exporter_id = ${len(params) + 1} OR supplier_id = ${len(params) + 1})")
            params.append(seller_id)
        elif seller_name:
            name_clause = f"exporter_name ILIKE ${len(params) + 1}"
            if self._allow_unindexed_lookup(seller_name):
                name_clause = f"({name_clause} OR supplier_name ILIKE ${len(params) + 1})"
            conditions.append(name_clause)
            params.append(f"%{seller_name}%")
        else:
            return 0

        buyer_id = buyer.get("id")
        buyer_name = buyer.get("name")
        if buyer_id:
            conditions.append(
                f"(importer_id = ${len(params) + 1} OR consignee_id = ${len(params) + 1})"
            )
            params.append(buyer_id)
        elif buyer_name:
            conditions.append(
                f"(importer_name ILIKE ${len(params) + 1} OR consignee_name ILIKE ${len(params) + 1})"
            )
            params.append(f"%{buyer_name}%")
        else:
            return 0

        if hs_code:
            conditions.append(f"hs_code = ${len(params) + 1}")
            params.append(hs_code)
        else:
            conditions.append(
                f"(product_description ILIKE ${len(params) + 1} OR item_description ILIKE ${len(params) + 1})"
            )
            params.append(f"%{commodity}%")

        where_clause = " AND ".join(conditions)
        row = await self.db.fetchrow(
            f"""
            SELECT COUNT(*) AS cnt
            FROM trade_records
            WHERE {where_clause}
            """,
            *params,
        )
        return int(row["cnt"]) if row else 0

    async def _get_primary_port(
        self, seller: Optional[Dict[str, Any]], commodity: str, hs_code: Optional[str]
    ) -> Optional[str]:
        if not self.db or not seller:
            return None
        params: List[Any] = []
        conditions: List[str] = []

        seller_id = seller.get("id")
        seller_name = seller.get("name")
        if seller_id:
            conditions.append(f"(exporter_id = ${len(params) + 1} OR supplier_id = ${len(params) + 1})")
            params.append(seller_id)
        elif seller_name:
            name_clause = f"exporter_name ILIKE ${len(params) + 1}"
            if self._allow_unindexed_lookup(seller_name):
                name_clause = f"({name_clause} OR supplier_name ILIKE ${len(params) + 1})"
            conditions.append(name_clause)
            params.append(f"%{seller_name}%")
        else:
            return None

        if hs_code:
            conditions.append(f"hs_code = ${len(params) + 1}")
            params.append(hs_code)
        else:
            conditions.append(
                f"(product_description ILIKE ${len(params) + 1} OR item_description ILIKE ${len(params) + 1})"
            )
            params.append(f"%{commodity}%")

        conditions.append("indian_port IS NOT NULL")
        where_clause = " AND ".join(conditions)
        row = await self.db.fetchrow(
            f"""
            SELECT indian_port AS port, COUNT(*) AS cnt
            FROM trade_records
            WHERE {where_clause}
            GROUP BY indian_port
            ORDER BY cnt DESC
            LIMIT 1
            """,
            *params,
        )
        return row["port"] if row else None

    def _distance_km(self, loc_a, loc_b) -> float:
        lon_a, lat_a = _extract_lon_lat(loc_a)
        lon_b, lat_b = _extract_lon_lat(loc_b)
        rad = math.pi / 180
        dlon = (lon_b - lon_a) * rad
        dlat = (lat_b - lat_a) * rad
        a = math.sin(dlat / 2) ** 2 + math.cos(lat_a * rad) * math.cos(lat_b * rad) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return 6371 * c

    def _allow_unindexed_lookup(self, name: Optional[str]) -> bool:
        if not name:
            return False
        tokens = [token for token in re.split(r"[^a-z0-9]+", name.lower()) if token]
        if not tokens:
            return False
        meaningful = [
            token
            for token in tokens
            if token not in self.GENERIC_NAME_TOKENS
            and len(token) >= self.UNINDEXED_LOOKUP_MIN_CHARS
        ]
        return bool(meaningful)


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _score_financing(party: Dict[str, Any]) -> Optional[float]:
    extra = party.get("extra") or {}
    if isinstance(extra, str):
        try:
            extra = json.loads(extra) if extra.strip() else {}
        except Exception:
            extra = {}
    if not isinstance(extra, dict):
        extra = {}
    candidates = []
    for key in ["financing_score", "financingScore", "financing_score_pct", "credit_score", "creditScore"]:
        if key not in extra:
            continue
        raw = _safe_float(extra.get(key))
        if raw is None:
            continue
        if 0 <= raw <= 1:
            candidates.append(raw)
        elif 1 < raw <= 100:
            candidates.append(raw / 100)
        elif 300 <= raw <= 900:
            candidates.append(normalize_score(raw, 300, 850))

    terms = (extra.get("payment_terms") or extra.get("paymentTerms") or "").lower()
    if terms:
        if "lc" in terms or "letter of credit" in terms:
            candidates.append(0.75)
        elif "advance" in terms or "prepaid" in terms:
            candidates.append(0.65)
        elif "net 30" in terms or "net30" in terms:
            candidates.append(0.55)

    if party.get("is_verified"):
        candidates.append(0.6)

    if not candidates:
        return None

    avg = sum(candidates) / len(candidates)
    return max(0.0, min(1.0, avg))


def _extract_lon_lat(value):
    if value is None:
        return 0.0, 0.0
    if hasattr(value, "x") and hasattr(value, "y"):
        return float(value.x), float(value.y)
    if isinstance(value, (list, tuple)) and len(value) >= 2:
        return float(value[0]), float(value[1])
    return 0.0, 0.0


@lru_cache()
def _load_weather_risk() -> Dict[str, Any]:
    path = Path(__file__).resolve().parents[2] / "shared" / "config" / "weather_risk.json"
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


@lru_cache()
def _load_trade_barriers() -> Dict[str, Any]:
    path = Path(__file__).resolve().parents[2] / "shared" / "config" / "trade_barriers.json"
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}
