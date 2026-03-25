"""
Market Analysis Service

Provides LLM-powered market analysis with async processing.

Workflow:
1. initiate() - Returns jobId + initial quantitative data immediately
2. Background job calls Claude 3 Sonnet for qualitative analysis
3. Results stored in Redis with TTL
4. Client polls /results/{jobId} until COMPLETED

Analysis sections:
- Market Overview (export/import sides, price range)
- Supply Chain (ports, transport costs, financing)
- Ground Check (weather risks, barriers, frequency)
- Predictions (price volatility forecast)
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from functools import lru_cache
from pathlib import Path
import json

from ..utils.ai_factory import get_ai_client
from ..utils.statistics import (
    calculate_mean,
    calculate_volatility,
    predict_linear,
)
from ..services.entity_resolver import flatten_contact_info, format_location

logger = logging.getLogger(__name__)
MIN_HS_COVERAGE_ROWS = 100
DB_DEMAND_FORECAST_WEIGHT = 0.1


class MarketAnalyzer:
    """Placeholder for the market analysis workflow."""

    def __init__(self, db, redis):
        self.db = db
        self.redis = redis

    async def initiate(self, request) -> dict:
        """Start async analysis job and return initial data."""
        initial_charts = await self.get_initial_charts(request)
        return initial_charts

    async def get_initial_charts(self, request) -> dict:
        """
        Get initial chart data (synchronous, quick).

        Returns basic quantitative data from the database.
        This runs immediately without waiting for LLM analysis.

        To be implemented: Query trade_records for commodity trends.
        """
        logger.info(
            "analysis initial charts start",
            extra={"commodity": request.commodity, "hs_code": getattr(request, "hs_code", None)},
        )
        if not self.db:
            return {}
        commodity = request.commodity
        hs_code = getattr(request, "hs_code", None)
        scope = await self._resolve_analysis_scope(
            commodity,
            hs_code,
            min_rows=MIN_HS_COVERAGE_ROWS,
        )
        effective_hs_code = scope["hs_code_used"]
        price_series, volume_series, labels = await self._get_price_volume_series(
            commodity,
            effective_hs_code,
            months=6,
        )
        top_exporters = await self._get_top_countries(
            commodity,
            effective_hs_code,
            role="seller",
            limit=6,
        )
        top_importers = await self._get_top_countries(
            commodity,
            effective_hs_code,
            role="buyer",
            limit=6,
        )
        logger.info(
            "analysis initial charts ready",
            extra={
                "commodity": commodity,
                "hs_code": hs_code,
                "details": {
                    "points": len(labels),
                    "top_exporters": len(top_exporters),
                    "top_importers": len(top_importers),
                    "hs_code_used": effective_hs_code,
                    "hs_code_rows": scope["hs_code_rows"],
                    "hs_fallback": scope["fallback"],
                },
            },
        )
        return {
            "price_trend": {"labels": labels, "values": price_series},
            "volume_trend": {"labels": labels, "values": volume_series},
            "top_exporters": top_exporters,
            "top_importers": top_importers,
        }

    async def run_analysis(self, commodity: str, hs_code: str, market_context: dict) -> dict:
        """
        Run full market analysis (async, called by background worker).

        This will eventually call Claude LLM for qualitative analysis.

        To be implemented:
        1. Query database for trade patterns
        2. Call Claude API for market insights
        3. Return structured analysis with sections

        Args:
            commodity: Commodity name
            hs_code: HS code
            market_context: Additional context from request

        Returns:
            Complete analysis result with all sections
        """
        start = time.perf_counter()
        logger.info(
            "analysis run start",
            extra={
                "commodity": commodity,
                "hs_code": hs_code,
                "details": {
                    "role": market_context.get("role"),
                    "buyer_country": market_context.get("buyer_country"),
                    "seller_country": market_context.get("seller_country"),
                },
            },
        )
        if not self.db:
            return {}

        role = market_context.get("role")
        buyer_country = market_context.get("buyer_country")
        seller_country = market_context.get("seller_country")
        port = market_context.get("port")
        price_range = market_context.get("price_range") or {}

        scope = await self._resolve_analysis_scope(
            commodity,
            hs_code,
            min_rows=MIN_HS_COVERAGE_ROWS,
        )
        effective_hs_code = scope["hs_code_used"]
        top_countries = await self._get_top_countries(
            commodity,
            effective_hs_code,
            role=role,
            limit=6,
        )
        demand_chart = await self._build_demand_chart(
            commodity,
            effective_hs_code,
            top_countries,
            role,
        )
        capital_chart = await self._build_capital_chart(
            commodity,
            effective_hs_code,
        )
        price_chart = await self._build_price_chart(
            commodity,
            effective_hs_code,
        )
        db_stats = await self._get_db_stats(
            commodity=commodity,
            hs_code=effective_hs_code,
            buyer_country=buyer_country,
            seller_country=seller_country,
        )
        db_stats.update(
            {
                "hs_code_requested": hs_code,
                "hs_code_used": effective_hs_code,
                "hs_code_rows_with_dates": scope.get("hs_code_rows"),
                "hs_code_fallback": scope.get("fallback"),
                "hs_code_fallback_reason": scope.get("note"),
                "hs_code_min_rows": scope.get("min_rows"),
            }
        )
        db_prompt_stats = {
            "records_total": db_stats.get("records_total"),
            "records_last_12_months": db_stats.get("records_last_12_months"),
            "date_range": db_stats.get("date_range"),
            "avg_unit_price_usd": db_stats.get("avg_unit_price_usd"),
            "total_volume": db_stats.get("total_volume"),
            "route_records_last_12_months": db_stats.get("route_records_last_12_months"),
        }
        db_notes = scope.get("note")

        ai_client = get_ai_client()
        ai_result = await ai_client.analyze_market(
            commodity=commodity,
            historical_prices=price_chart.get("prices", []),
            historical_volumes=capital_chart.get("historical", []),
            top_countries=top_countries,
            context={
                "buyer_country": buyer_country,
                "seller_country": seller_country,
                "port": port,
                "price_range": price_range,
                "db_stats": db_prompt_stats,
                "db_notes": db_notes,
            },
        )

        if not demand_chart.get("countries") and ai_result.get("demand_forecast"):
            demand_chart = self._build_llm_demand_chart(ai_result.get("demand_forecast"))
        demand_chart = self._merge_llm_demand_forecast(demand_chart, ai_result.get("demand_forecast"))
        price_chart = self._merge_llm_price_forecast(price_chart, ai_result.get("price_forecast"))

        weather_impact = ai_result.get("ground_check", {}).get("weather_storage", {}).get("suggestion") or self._fallback_weather_impact(
            commodity, seller_country
        )
        trade_frequency, trade_count = await self._estimate_trade_frequency(
            commodity=commodity,
            hs_code=effective_hs_code,
            buyer_country=buyer_country,
            seller_country=seller_country,
        )
        
        # Helper to safely get nested AI result or fallback
        def get_ai_section(section, key, default=None):
            return ai_result.get(section, {}).get(key, default)

        company_contacts = await self._get_company_contacts(
            commodity,
            effective_hs_code,
            role,
        )

        result = {
            "commodity": commodity,
            "hs_code": hs_code,
            "db_stats": db_stats,
            "market_context": {
                "export_country": seller_country,
                "import_country": buyer_country,
                "nearest_port": port,
                "price_range": self._format_price_range(price_range),
                "weather_impact": weather_impact,
            },
            "charts": {
                "demand_forecast": demand_chart,
                "capital_required": capital_chart,
                "price_volatility": price_chart,
            },
            "insights": {
                "summary": ai_result.get("summary", ""),
                "key_insights": [], # Deprecated in new format, keeping for schema compatibility
                "recommendations": ai_result.get("recommendations", []),
            },
            "analysis": {
                "market": ai_result.get("market"),
                "supplyChain": ai_result.get("supply_chain"),
                "groundCheck": ai_result.get("ground_check"),
                "futures": ai_result.get("futures"),
            },
            "analysis_raw": ai_result.get("raw_text"),
            "predictions": {
                "price_volatility_next_month": price_chart.get("volatility_percent"),
                "futures_volatility": ai_result.get("futures", {}).get("prediction"),
            },
            "company_contacts": company_contacts,
        }

        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "analysis run complete",
            extra={
                "commodity": commodity,
                "hs_code": hs_code,
                "duration_ms": duration_ms,
                "details": {
                    "top_countries": len(top_countries),
                    "trade_count": trade_count,
                },
            },
        )

        return result

    async def _resolve_analysis_scope(
        self,
        commodity: str,
        hs_code: Optional[str],
        min_rows: int,
    ) -> Dict[str, Any]:
        scope = {
            "hs_code_requested": hs_code,
            "hs_code_used": hs_code,
            "hs_code_rows": None,
            "fallback": False,
            "note": None,
            "min_rows": min_rows,
        }
        if not self.db:
            scope["hs_code_used"] = None if hs_code else None
            scope["note"] = "Database unavailable; used commodity text match."
            return scope
        if not hs_code:
            scope["hs_code_used"] = None
            return scope
        row = await self.db.fetchrow(
            """
            SELECT COUNT(*) AS cnt
            FROM trade_records
            WHERE hs_code = $1
              AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
            """,
            hs_code,
        )
        count = int(row["cnt"] or 0) if row else 0
        scope["hs_code_rows"] = count
        if count < min_rows:
            scope["hs_code_used"] = None
            scope["fallback"] = True
            scope["note"] = (
                f"HS code coverage below {min_rows} records; "
                "used commodity text match."
            )
        return scope

    async def _get_db_stats(
        self,
        commodity: str,
        hs_code: Optional[str],
        buyer_country: Optional[str],
        seller_country: Optional[str],
    ) -> Dict[str, Any]:
        if not self.db or not commodity:
            return {}

        if hs_code:
            clause = "hs_code = $1"
            params: List[Any] = [hs_code]
        else:
            clause = "(product_description ILIKE $1 OR item_description ILIKE $1)"
            params = [f"%{commodity}%"]

        row = await self.db.fetchrow(
            f"""
            SELECT COUNT(*) AS records_total,
                   COUNT(*) FILTER (
                       WHERE COALESCE(sb_date, reg_date) >= NOW() - INTERVAL '12 months'
                   ) AS records_last_12_months,
                   MIN(COALESCE(sb_date, reg_date)) AS first_date,
                   MAX(COALESCE(sb_date, reg_date)) AS last_date,
                   AVG(COALESCE(unit_price_usd, unit_price)) AS avg_unit_price,
                   MIN(COALESCE(unit_price_usd, unit_price)) AS min_unit_price,
                   MAX(COALESCE(unit_price_usd, unit_price)) AS max_unit_price,
                   SUM(COALESCE(quantity, net_weight_kg, 0)) AS total_volume,
                   AVG(COALESCE(quantity, net_weight_kg, 0)) AS avg_volume
            FROM trade_records
            WHERE {clause}
            """,
            *params,
        )
        records_total = int(row["records_total"] or 0) if row else 0
        records_last_12_months = int(row["records_last_12_months"] or 0) if row else 0
        first_date = row["first_date"] if row else None
        last_date = row["last_date"] if row else None
        date_range = None
        if first_date or last_date:
            start = first_date.isoformat() if first_date else None
            end = last_date.isoformat() if last_date else None
            if start and end:
                date_range = f"{start} to {end}"
            else:
                date_range = start or end

        route_stats = {"route_records_total": None, "route_records_last_12_months": None}
        if buyer_country or seller_country:
            seller_like = f"%{seller_country}%" if seller_country else None
            buyer_like = f"%{buyer_country}%" if buyer_country else None
            route_row = await self.db.fetchrow(
                f"""
                SELECT COUNT(*) AS route_total,
                       COUNT(*) FILTER (
                           WHERE COALESCE(sb_date, reg_date) >= NOW() - INTERVAL '12 months'
                       ) AS route_last_12_months
                FROM trade_records
                WHERE {clause}
                  AND ($2::text IS NULL OR origin_country ILIKE $2)
                  AND ($3::text IS NULL OR destination_country ILIKE $3)
                """,
                *params,
                seller_like,
                buyer_like,
            )
            if route_row:
                route_stats["route_records_total"] = int(route_row["route_total"] or 0)
                route_stats["route_records_last_12_months"] = int(
                    route_row["route_last_12_months"] or 0
                )

        return {
            "match_scope": "hs_code" if hs_code else "commodity_text",
            "records_total": records_total,
            "records_last_12_months": records_last_12_months,
            "date_range": date_range,
            "avg_unit_price_usd": _safe_float(row["avg_unit_price"]) if row else None,
            "unit_price_range_usd": {
                "min": _safe_float(row["min_unit_price"]) if row else None,
                "max": _safe_float(row["max_unit_price"]) if row else None,
            },
            "total_volume": _safe_float(row["total_volume"]) if row else None,
            "avg_volume": _safe_float(row["avg_volume"]) if row else None,
            **route_stats,
        }

    async def _get_price_volume_series(
        self, commodity: str, hs_code: Optional[str], months: int = 7
    ) -> Tuple[List[float], List[float], List[str]]:
        if hs_code:
            rows = await self.db.fetch(
                """
                SELECT date_trunc('month', COALESCE(sb_date, reg_date)) AS month,
                       AVG(COALESCE(unit_price_usd, unit_price)) AS avg_price,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS total_volume
                FROM trade_records
                WHERE hs_code = $1
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY month
                ORDER BY month DESC
                LIMIT $2
                """,
                hs_code,
                months,
            )
        else:
            rows = await self.db.fetch(
                """
                SELECT date_trunc('month', COALESCE(sb_date, reg_date)) AS month,
                       AVG(COALESCE(unit_price_usd, unit_price)) AS avg_price,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS total_volume
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY month
                ORDER BY month DESC
                LIMIT $2
                """,
                f"%{commodity}%",
                months,
            )
        rows = list(reversed(rows))
        labels = [row["month"].strftime("%b %Y") for row in rows]
        prices = [float(row["avg_price"] or 0) for row in rows]
        volumes = [float(row["total_volume"] or 0) for row in rows]
        return prices, volumes, labels

    async def _get_top_countries(
        self, commodity: str, hs_code: Optional[str], role: Optional[str], limit: int = 6
    ) -> List[Dict[str, Any]]:
        if role == "buyer":
            column = "destination_country"
        else:
            column = "origin_country"
        if hs_code:
            rows = await self.db.fetch(
                f"""
                SELECT {column} AS country,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS volume
                FROM trade_records
                WHERE hs_code = $1
                  AND {column} IS NOT NULL
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY {column}
                ORDER BY volume DESC
                LIMIT $2
                """,
                hs_code,
                limit,
            )
        else:
            rows = await self.db.fetch(
                f"""
                SELECT {column} AS country,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS volume
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND {column} IS NOT NULL
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY {column}
                ORDER BY volume DESC
                LIMIT $2
                """,
                f"%{commodity}%",
                limit,
            )
        return [{"country": r["country"], "volume": float(r["volume"] or 0)} for r in rows]

    async def _build_demand_chart(
        self,
        commodity: str,
        hs_code: Optional[str],
        top_countries: List[Dict[str, Any]],
        role: Optional[str],
    ) -> Dict[str, Any]:
        if not top_countries:
            return {"countries": [], "stable_demand": [], "current_demand": [], "forecast_3m": [], "forecast_6m": [], "forecast_9m": []}

        countries = [c["country"] for c in top_countries]
        volumes_by_country = {c["country"]: [] for c in top_countries}
        column = "destination_country" if role == "buyer" else "origin_country"

        if hs_code:
            rows = await self.db.fetch(
                f"""
                SELECT {column} AS country,
                       date_trunc('month', COALESCE(sb_date, reg_date)) AS month,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS volume
                FROM trade_records
                WHERE hs_code = $1
                  AND {column} = ANY($2::text[])
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY {column}, month
                ORDER BY month DESC
                """,
                hs_code,
                countries,
            )
        else:
            rows = await self.db.fetch(
                f"""
                SELECT {column} AS country,
                       date_trunc('month', COALESCE(sb_date, reg_date)) AS month,
                       SUM(COALESCE(quantity, net_weight_kg, 0)) AS volume
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND {column} = ANY($2::text[])
                  AND (sb_date IS NOT NULL OR reg_date IS NOT NULL)
                GROUP BY {column}, month
                ORDER BY month DESC
                """,
                f"%{commodity}%",
                countries,
            )

        for row in rows:
            volumes_by_country[row["country"]].append(float(row["volume"] or 0))

        stable = []
        current = []
        predictions_raw = []
        for country in countries:
            series = volumes_by_country.get(country, [])
            stable.append(calculate_mean(series) if series else 0.0)
            current.append(series[0] if series else 0.0)
            if len(series) >= 2:
                chron = list(reversed(series))
                recent = chron[-3:] if len(chron) >= 3 else chron
                predictions_raw.append(predict_linear(recent, periods_ahead=3))
            else:
                predictions_raw.append([current[-1]] * 3)

        max_val = max(stable + current + [val for preds in predictions_raw for val in preds] + [1])
        stable_scaled = [round((v / max_val) * 100, 2) for v in stable]
        current_scaled = [round((v / max_val) * 100, 2) for v in current]

        forecast_3m = []
        forecast_6m = []
        forecast_9m = []
        for preds in predictions_raw:
            forecast_3m.append(round((preds[0] / max_val) * 100, 2))
            forecast_6m.append(round((preds[1] / max_val) * 100, 2))
            forecast_9m.append(round((preds[2] / max_val) * 100, 2))

        return {
            "countries": countries,
            "stable_demand": stable_scaled,
            "current_demand": current_scaled,
            "forecast_3m": forecast_3m,
            "forecast_6m": forecast_6m,
            "forecast_9m": forecast_9m,
        }

    async def _build_capital_chart(self, commodity: str, hs_code: Optional[str]) -> Dict[str, Any]:
        prices, volumes, labels = await self._get_price_volume_series(commodity, hs_code, months=7)
        historical = [round(v, 2) for v in volumes]
        projections = predict_linear(historical, periods_ahead=3)
        return {
            "timeline": labels or [],  # Return empty array if no data - don't use placeholders
            "historical": historical,
            "projected": [round(v, 2) for v in projections],
        }

    async def _build_price_chart(self, commodity: str, hs_code: Optional[str]) -> Dict[str, Any]:
        prices, _, labels = await self._get_price_volume_series(commodity, hs_code, months=7)
        volatility = calculate_volatility(prices, period=7)
        high = [round(p * (1 + volatility / 100), 2) for p in prices]
        low = [round(p * (1 - volatility / 100), 2) for p in prices]
        return {
            "timeline": labels or [],  # Return empty array if no data - don't use placeholders
            "prices": [round(p, 2) for p in prices],
            "volatility_high": high,
            "volatility_low": low,
            "volatility_percent": round(volatility, 2),
        }

    async def _fetch_company_contact(self, name: str) -> Optional[Dict[str, Any]]:
        if not self.db or not name:
            return None
        normalized = name.strip().lower()
        row = await self.db.fetchrow(
            """
            SELECT name, country, city, state, pin_code, address_full, contact_info
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
            SELECT name, country, city, state, pin_code, address_full, contact_info
            FROM companies
            WHERE name ILIKE $1
            LIMIT 1
            """,
            f"%{name}%",
        )
        return dict(row) if row else None

    async def _get_company_contacts(
        self,
        commodity: str,
        hs_code: Optional[str],
        role: Optional[str],
        limit: int = 6,
    ) -> List[Dict[str, Any]]:
        if not self.db or not commodity:
            return []
        if hs_code:
            commodity_clause = "hs_code = $1"
            params: List[Any] = [hs_code]
        else:
            commodity_clause = "(product_description ILIKE $1 OR item_description ILIKE $1)"
            params = [f"%{commodity}%"]
        role_value = role or "buyer"
        if role_value == "buyer":
            query = """
                WITH commodity_trades AS (
                    SELECT exporter_name AS company_name,
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
                      AND exporter_name IS NOT NULL
                    UNION ALL
                    SELECT supplier_name AS company_name,
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
                      AND supplier_name IS NOT NULL
                )
                SELECT company_name,
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
                GROUP BY company_name
                ORDER BY trade_count DESC NULLS LAST, total_value_usd DESC NULLS LAST
                LIMIT {limit}
            """.format(commodity_clause=commodity_clause, limit=limit)
        else:
            query = """
                WITH commodity_trades AS (
                    SELECT consignee_name AS company_name,
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
                      AND consignee_name IS NOT NULL
                    UNION ALL
                    SELECT importer_name AS company_name,
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
                      AND importer_name IS NOT NULL
                )
                SELECT company_name,
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
                GROUP BY company_name
                ORDER BY trade_count DESC NULLS LAST, total_value_usd DESC NULLS LAST
                LIMIT {limit}
            """.format(commodity_clause=commodity_clause, limit=limit)
        rows = await self.db.fetch(query, *params)
        contacts: List[Dict[str, Any]] = []
        for row in rows:
            entry = dict(row)
            company_row = await self._fetch_company_contact(entry.get("company_name") or "")
            contact = flatten_contact_info(
                company_row.get("contact_info") if company_row else None,
                fallback_phone=entry.get("contact_phone"),
                fallback_email=entry.get("contact_email"),
            )
            location = format_location(
                entry.get("address_full") or (company_row.get("address_full") if company_row else None),
                entry.get("city") or (company_row.get("city") if company_row else None),
                entry.get("state") or (company_row.get("state") if company_row else None),
                entry.get("country") or (company_row.get("country") if company_row else None),
                entry.get("pin_code") or (company_row.get("pin_code") if company_row else None),
            )
            contacts.append(
                {
                    "company_name": entry.get("company_name"),
                    "country": entry.get("country") or (company_row.get("country") if company_row else None),
                    "location": location,
                    "contact_phone": contact.get("contact_phone"),
                    "contact_email": contact.get("contact_email"),
                    "contact_website": contact.get("contact_website"),
                    "sources": ["trade_records"] + (["companies"] if company_row else []),
                }
            )
        return contacts

    async def _estimate_trade_frequency(
        self,
        commodity: str,
        hs_code: Optional[str],
        buyer_country: Optional[str],
        seller_country: Optional[str],
    ) -> Tuple[Optional[str], int]:
        if not self.db:
            return None, 0
        like = f"%{commodity}%"
        if hs_code:
            row = await self.db.fetchrow(
                """
                SELECT COUNT(*) AS cnt
                FROM trade_records
                WHERE hs_code = $1
                  AND COALESCE(sb_date, reg_date) >= NOW() - INTERVAL '12 months'
                  AND ($2::text IS NULL OR origin_country ILIKE $2)
                  AND ($3::text IS NULL OR destination_country ILIKE $3)
                """,
                hs_code,
                f"%{seller_country}%" if seller_country else None,
                f"%{buyer_country}%" if buyer_country else None,
            )
        else:
            row = await self.db.fetchrow(
                """
                SELECT COUNT(*) AS cnt
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND COALESCE(sb_date, reg_date) >= NOW() - INTERVAL '12 months'
                  AND ($2::text IS NULL OR origin_country ILIKE $2)
                  AND ($3::text IS NULL OR destination_country ILIKE $3)
                """,
                like,
                f"%{seller_country}%" if seller_country else None,
                f"%{buyer_country}%" if buyer_country else None,
            )
        count = int(row["cnt"] or 0) if row else 0
        if count == 0:
            return None, 0
        return f"{count:,} transactions in last 12 months", count

    async def _estimate_transport_costs(
        self,
        commodity: str,
        hs_code: Optional[str],
        port: Optional[str],
    ) -> Optional[str]:
        if not self.db:
            return None
        like = f"%{commodity}%"
        port_like = f"%{port}%" if port else None
        if hs_code:
            row = await self.db.fetchrow(
                """
                SELECT AVG(
                    COALESCE(total_value_usd, fob_value) / NULLIF(quantity, 0)
                ) AS unit_cost
                FROM trade_records
                WHERE hs_code = $1
                  AND COALESCE(total_value_usd, fob_value) IS NOT NULL
                  AND quantity IS NOT NULL
                  AND ($2::text IS NULL OR indian_port ILIKE $2 OR foreign_port ILIKE $2)
                """,
                hs_code,
                port_like,
            )
        else:
            row = await self.db.fetchrow(
                """
                SELECT AVG(
                    COALESCE(total_value_usd, fob_value) / NULLIF(quantity, 0)
                ) AS unit_cost
                FROM trade_records
                WHERE (product_description ILIKE $1 OR item_description ILIKE $1)
                  AND COALESCE(total_value_usd, fob_value) IS NOT NULL
                  AND quantity IS NOT NULL
                  AND ($2::text IS NULL OR indian_port ILIKE $2 OR foreign_port ILIKE $2)
                """,
                like,
                port_like,
            )
        cost = row["unit_cost"] if row else None
        if cost is None:
            return None
        return f"Estimated FOB proxy: ${float(cost):.2f} per unit"

    def _estimate_financing_support(self, trade_count: int) -> Optional[str]:
        if trade_count <= 0:
            return None
        if trade_count >= 1000:
            return "High financing availability; LC and DA terms common for this route."
        if trade_count >= 100:
            return "Moderate financing availability; LC and open-account terms observed."
        return "Limited financing signals; expect conservative payment terms."

    def _estimate_market_barriers(
        self,
        buyer_country: Optional[str],
        seller_country: Optional[str],
    ) -> Optional[str]:
        if not buyer_country or not seller_country:
            return None
        barriers = _load_trade_barriers()
        key = f"{seller_country}->{buyer_country}"
        value = barriers.get(key) or barriers.get("default")
        if value is None:
            return None
        score = _safe_float(value)
        if score is None:
            return None
        if score >= 0.85:
            level = "Low"
        elif score >= 0.6:
            level = "Medium"
        else:
            level = "High"
        return f"{level} barrier score ({score:.2f}) for {seller_country} to {buyer_country}."

    def _merge_llm_demand_forecast(
        self,
        chart: Dict[str, Any],
        demand_forecasts: Optional[Any],
    ):
        if not demand_forecasts:
            return chart
        if isinstance(demand_forecasts, list):
            normalized = {}
            for entry in demand_forecasts:
                if not isinstance(entry, dict):
                    continue
                country = entry.get("country")
                if not country:
                    continue
                normalized[country] = entry
            demand_forecasts = normalized
        if not isinstance(demand_forecasts, dict):
            return chart
        demand_map = {
            key.lower(): value
            for key, value in demand_forecasts.items()
            if isinstance(key, str)
        }
        countries = chart.get("countries", [])
        forecast_3m = []
        forecast_6m = []
        forecast_9m = []
        for idx, country in enumerate(countries):
            forecast = (
                demand_map.get(country.lower())
                or demand_forecasts.get(country)
                or {}
            )
            db_current = chart["current_demand"][idx] if chart.get("current_demand") else 0
            db_3m = chart["forecast_3m"][idx] if chart.get("forecast_3m") else db_current
            db_6m = chart["forecast_6m"][idx] if chart.get("forecast_6m") else db_current
            db_9m = chart["forecast_9m"][idx] if chart.get("forecast_9m") else db_current
            llm_3m = _safe_float(forecast.get("month3"))
            llm_6m = _safe_float(forecast.get("month6"))
            llm_9m = _safe_float(forecast.get("month9"))

            def blend(llm_value: Optional[float], db_value: float) -> float:
                if llm_value is None:
                    return db_value
                llm_value = max(0.0, min(100.0, llm_value))
                return round(
                    (llm_value * (1 - DB_DEMAND_FORECAST_WEIGHT))
                    + (db_value * DB_DEMAND_FORECAST_WEIGHT),
                    2,
                )

            forecast_3m.append(blend(llm_3m, db_3m))
            forecast_6m.append(blend(llm_6m, db_6m))
            forecast_9m.append(blend(llm_9m, db_9m))
        chart["forecast_3m"] = forecast_3m
        chart["forecast_6m"] = forecast_6m
        chart["forecast_9m"] = forecast_9m
        return chart

    def _build_llm_demand_chart(self, demand_forecast: Any) -> Dict[str, Any]:
        entries: List[Dict[str, Any]] = []
        if isinstance(demand_forecast, list):
            for item in demand_forecast:
                if isinstance(item, dict) and item.get("country"):
                    entries.append(item)
        elif isinstance(demand_forecast, dict):
            for key, value in demand_forecast.items():
                if not isinstance(value, dict):
                    continue
                country = value.get("country") or key
                if not country:
                    continue
                entry = dict(value)
                entry["country"] = country
                entries.append(entry)

        if not entries:
            return {
                "countries": [],
                "stable_demand": [],
                "current_demand": [],
                "forecast_3m": [],
                "forecast_6m": [],
                "forecast_9m": [],
            }

        countries: List[str] = []
        stable: List[float] = []
        current: List[float] = []
        forecast_3m: List[float] = []
        forecast_6m: List[float] = []
        forecast_9m: List[float] = []

        def clamp(value: Optional[float]) -> float:
            if value is None:
                return 0.0
            return max(0.0, min(100.0, value))

        for entry in entries:
            country = entry.get("country")
            if not country:
                continue
            m3 = _safe_float(entry.get("month3"))
            m6 = _safe_float(entry.get("month6"))
            m9 = _safe_float(entry.get("month9"))
            base = clamp(m3)
            countries.append(country)
            stable.append(base)
            current.append(base)
            forecast_3m.append(base)
            forecast_6m.append(clamp(m6))
            forecast_9m.append(clamp(m9))

        return {
            "countries": countries,
            "stable_demand": stable,
            "current_demand": current,
            "forecast_3m": forecast_3m,
            "forecast_6m": forecast_6m,
            "forecast_9m": forecast_9m,
        }

    def _merge_llm_price_forecast(self, chart: Dict[str, Any], price_forecasts: Optional[Dict[str, Any]]):
        if not price_forecasts:
            return chart
        mapped = {k.lower(): v for k, v in price_forecasts.items()}
        for label, key in [("Month3", "month3"), ("Month6", "month6"), ("Month9", "month9")]:
            value = _safe_float(mapped.get(key))
            if value is not None:
                chart.setdefault("predicted", {})[key] = value
        return chart

    def _format_price_range(self, price_range: Dict[str, Any]) -> Optional[str]:
        if not price_range:
            return None
        min_price = price_range.get("min")
        max_price = price_range.get("max")
        if min_price is None or max_price is None:
            return None
        return f"${min_price}-{max_price} per tonne"

    def _fallback_weather_impact(self, commodity: str, country: Optional[str]) -> Optional[str]:
        if not commodity or not country:
            return None
        weather = _load_weather_risk()
        commodity_key = commodity.lower()
        country_block = weather.get(commodity_key, {}).get(country)
        if not country_block:
            return f"Seasonal weather patterns in {country} may affect {commodity} production."
        low_months = [k for k, v in country_block.items() if isinstance(v, (int, float)) and v < 0.5]
        if low_months:
            return f"Lower production risk in {country} during {', '.join(low_months)} for {commodity}."
        return f"Seasonal weather patterns in {country} may affect {commodity} production."


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


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
