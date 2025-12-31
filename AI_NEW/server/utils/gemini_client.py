"""
Google Gemini AI Client Implementation

Google Gemini API integration for market analysis.
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Any, Optional

from google import genai
from google.genai import types

from ..config import settings
from .ai_client_base import AIClientBase

logger = logging.getLogger(__name__)

def _analysis_string_schema() -> dict:
    return {"type": "string", "maxLength": 280}


def _analysis_section_schema() -> dict:
    return {
        "type": "object",
        "required": ["general_info", "choice", "suggestion"],
        "properties": {
            "general_info": _analysis_string_schema(),
            "choice": _analysis_string_schema(),
            "suggestion": _analysis_string_schema(),
        },
    }


ANALYSIS_RESPONSE_SCHEMA = {
    "type": "object",
    "required": [
        "market",
        "supply_chain",
        "ground_check",
        "futures",
        "demand_forecast",
        "price_forecast",
        "summary",
        "recommendations",
    ],
    "properties": {
        "market": {
            "type": "object",
            "required": ["export_side", "import_side", "price_range"],
            "properties": {
                "export_side": _analysis_section_schema(),
                "import_side": _analysis_section_schema(),
                "price_range": _analysis_section_schema(),
            },
        },
        "supply_chain": {
            "type": "object",
            "required": ["ports_movement", "transport_costs", "financing_support"],
            "properties": {
                "ports_movement": _analysis_section_schema(),
                "transport_costs": _analysis_section_schema(),
                "financing_support": _analysis_section_schema(),
            },
        },
        "ground_check": {
            "type": "object",
            "required": ["weather_storage", "market_barriers", "trade_frequency"],
            "properties": {
                "weather_storage": _analysis_section_schema(),
                "market_barriers": _analysis_section_schema(),
                "trade_frequency": _analysis_section_schema(),
            },
        },
        "futures": {
            "type": "object",
            "required": ["open_interest", "contract_price", "volatility", "prediction"],
            "properties": {
                "open_interest": _analysis_string_schema(),
                "contract_price": _analysis_string_schema(),
                "volatility": _analysis_string_schema(),
                "prediction": _analysis_string_schema(),
            },
        },
        "demand_forecast": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["country", "month3", "month6", "month9"],
                "properties": {
                    "country": {"type": "string"},
                    "month3": {"type": "number"},
                    "month6": {"type": "number"},
                    "month9": {"type": "number"},
                },
            },
        },
        "price_forecast": {
            "type": "object",
            "required": ["month3", "month6", "month9"],
            "properties": {
                "month3": {"type": "number"},
                "month6": {"type": "number"},
                "month9": {"type": "number"},
            },
        },
        "summary": _analysis_string_schema(),
        "recommendations": {
            "type": "array",
            "items": _analysis_string_schema(),
        },
    },
}


class GeminiClient(AIClientBase):
    """Google Gemini AI client implementation."""

    def __init__(self):
        """Initialize Gemini client with API key from settings."""
        self.api_keys = [
            key.strip()
            for key in (settings.GEMINI_API_KEY or "").split(",")
            if key.strip()
        ]
        if not self.api_keys:
            raise ValueError("GEMINI_API_KEY is not set.")
        self._key_index = 0
        self.client = genai.Client(api_key=self.api_keys[self._key_index])
        self.model = settings.GEMINI_MODEL

    def get_provider_name(self) -> str:
        """Return provider name."""
        return "gemini"

    async def analyze_market(
        self,
        commodity: str,
        historical_prices: List[float],
        historical_volumes: List[float],
        top_countries: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate market analysis using Gemini.

        Args:
            commodity: Commodity name
            historical_prices: List of historical prices
            historical_volumes: List of historical volumes
            top_countries: List of top trading countries with data
            context: Additional market context

        Returns:
            Structured analysis dict
        """
        prompt = self._build_market_analysis_prompt(
            commodity, historical_prices, historical_volumes, top_countries, context
        )
        prompt_chars = len(prompt)

        last_exc: Exception | None = None
        max_attempts = max(1, len(self.api_keys))
        for attempt in range(max_attempts):
            try:
                start = time.perf_counter()
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=4096,
                        response_mime_type="application/json",
                        response_schema=ANALYSIS_RESPONSE_SCHEMA,
                    ),
                )

                content = getattr(response, "text", None) or ""
                if getattr(response, "candidates", None):
                    try:
                        parts = response.candidates[0].content.parts
                        parts_text = "".join(
                            part.text for part in parts
                            if getattr(part, "text", None)
                        )
                        if parts_text and (not content or len(parts_text) > len(content)):
                            content = parts_text
                    except (AttributeError, IndexError, TypeError):
                        pass

                parsed = None
                parsed_response = getattr(response, "parsed", None)
                if parsed_response is not None:
                    if hasattr(parsed_response, "model_dump"):
                        parsed_response = parsed_response.model_dump()
                    if isinstance(parsed_response, dict):
                        parsed = parsed_response

                if parsed is None:
                    parsed = self._parse_market_analysis(content)
                else:
                    parsed.setdefault("raw_text", None)
                duration_ms = int((time.perf_counter() - start) * 1000)

                logger.info(
                    "Gemini market analysis completed",
                    extra={
                        "commodity": commodity,
                        "model": settings.GEMINI_MODEL,
                        "provider": "gemini",
                        "duration_ms": duration_ms,
                        "details": {
                            "prompt_chars": prompt_chars,
                            "response_chars": len(content or ""),
                            "key_index": self._key_index,
                            "key_count": len(self.api_keys),
                        },
                    },
                )

                return parsed

            except Exception as exc:
                last_exc = exc
                duration_ms = int((time.perf_counter() - start) * 1000) if "start" in locals() else None
                should_rotate = self._should_rotate_key(exc)
                logger.warning(
                    "Gemini API error",
                    exc_info=exc,
                    extra={
                        "commodity": commodity,
                        "provider": "gemini",
                        "model": settings.GEMINI_MODEL,
                        "duration_ms": duration_ms,
                        "details": {
                            "key_index": self._key_index,
                            "key_count": len(self.api_keys),
                            "rotate": should_rotate,
                        },
                    },
                )
                if should_rotate and self._rotate_key():
                    continue
                break

        if last_exc:
            logger.error(
                "Gemini API exhausted keys; using fallback analysis",
                extra={
                    "commodity": commodity,
                    "provider": "gemini",
                    "model": settings.GEMINI_MODEL,
                    "details": {
                        "key_index": self._key_index,
                        "key_count": len(self.api_keys),
                    },
                },
            )
        return self._get_fallback_analysis(commodity)

    def _should_rotate_key(self, exc: Exception) -> bool:
        message = str(exc).lower()
        return any(
            token in message
            for token in (
                "resource_exhausted",
                "quota",
                "rate limit",
                "too many requests",
                "429",
            )
        )

    def _rotate_key(self) -> bool:
        if len(self.api_keys) <= 1:
            return False
        self._key_index = (self._key_index + 1) % len(self.api_keys)
        self.client = genai.Client(api_key=self.api_keys[self._key_index])
        logger.info(
            "Gemini API key rotated",
            extra={
                "provider": "gemini",
                "model": settings.GEMINI_MODEL,
                "details": {
                    "key_index": self._key_index,
                    "key_count": len(self.api_keys),
                },
            },
        )
        return True

    def _parse_market_analysis(self, content: str) -> Dict[str, Any]:
        """
        Parse Gemini's response into structured format.

        Uses same parsing logic as Claude for consistency.
        """
        cleaned = content.strip()
        if cleaned:
            candidates = []
            if "```json" in cleaned:
                candidates.append(
                    cleaned.split("```json")[1].split("```")[0].strip()
                )
            elif "```" in cleaned:
                candidates.append(cleaned.split("```")[1].split("```")[0].strip())
            candidates.append(cleaned)

            extracted = []
            for candidate in candidates:
                start = candidate.find("{")
                end = candidate.rfind("}")
                if start != -1 and end != -1 and end > start:
                    extracted.append(candidate[start : end + 1])
            candidates.extend(extracted)

            expanded = []
            for candidate in candidates:
                if "\\\"" in candidate or "\\n" in candidate:
                    unescaped = candidate.replace("\\n", "\n").replace('\\"', '"')
                    expanded.append(unescaped)
                    if unescaped.startswith('"') and unescaped.endswith('"'):
                        expanded.append(unescaped[1:-1])
            candidates.extend(expanded)

            seen = set()
            for candidate in candidates:
                if not candidate or candidate in seen:
                    continue
                seen.add(candidate)
                try:
                    normalized = _normalize_json_strings(candidate)
                    parsed = json.loads(normalized)
                    if isinstance(parsed, str):
                        parsed = json.loads(parsed)
                    if isinstance(parsed, dict):
                        return parsed
                except Exception:
                    continue
            logger.warning(
                "Gemini JSON parse failed; falling back to heuristic parser",
                extra={
                    "details": {
                        "length": len(content),
                        "snippet_start": content[:400],
                        "snippet_end": content[-400:] if len(content) > 400 else content,
                    }
                },
            )
            extracted = _extract_json_sections(cleaned)
            if extracted:
                fallback = self._get_fallback_analysis("Unknown")
                merged = {
                    "market": extracted.get("market", fallback["market"]),
                    "supply_chain": extracted.get("supply_chain", fallback["supply_chain"]),
                    "ground_check": extracted.get("ground_check", fallback["ground_check"]),
                    "futures": extracted.get("futures", fallback["futures"]),
                    "summary": extracted.get("summary", fallback["summary"]),
                    "recommendations": extracted.get(
                        "recommendations", fallback["recommendations"]
                    ),
                    "demand_forecast": extracted.get("demand_forecast", {}),
                    "price_forecast": extracted.get("price_forecast", {}),
                }
                merged["raw_text"] = content
                return merged

        lines = content.strip().split("\n")
        parsed = {
            "summary": "",
            "key_insights": [],
            "weather_impact": "",
            "recommendations": [],
            "demand_forecast": {},
            "price_forecast": {},
        }

        current_section = None
        buffer = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Detect section headers
            upper_line = line.upper()
            if "MARKET SUMMARY" in upper_line or ("1." in line and "SUMMARY" in upper_line):
                if buffer and current_section == "summary":
                    parsed["summary"] = " ".join(buffer)
                current_section = "summary"
                buffer = []
            elif "KEY INSIGHTS" in upper_line or ("2." in line and "INSIGHTS" in upper_line):
                if buffer and current_section == "summary":
                    parsed["summary"] = " ".join(buffer)
                current_section = "insights"
                buffer = []
            elif "WEATHER" in upper_line or ("3." in line and "WEATHER" in upper_line):
                current_section = "weather"
                buffer = []
            elif "RECOMMENDATIONS" in upper_line or ("4." in line and "RECOMMEND" in upper_line):
                if buffer and current_section == "weather":
                    parsed["weather_impact"] = " ".join(buffer)
                current_section = "recommendations"
                buffer = []
            elif "DEMAND FORECAST" in upper_line or ("5." in line and "DEMAND" in upper_line):
                current_section = "demand"
                buffer = []
            elif "PRICE FORECAST" in upper_line or ("6." in line and "PRICE" in upper_line):
                current_section = "price"
                buffer = []
            elif line.startswith("-") or line.startswith("•") or line.startswith("*") or line.startswith("- "):
                # Bullet point
                item = line.lstrip("-•*").strip()
                if current_section == "insights" and item:
                    parsed["key_insights"].append(item)
                elif current_section == "recommendations" and item:
                    parsed["recommendations"].append(item)
            else:
                # Content line
                if current_section in ["summary", "weather"] and not line.startswith("#") and not line.startswith("**"):
                    buffer.append(line)
                elif current_section == "demand":
                    parsed_forecast = _parse_demand_line(line)
                    if parsed_forecast:
                        country, values = parsed_forecast
                    parsed["demand_forecast"][country] = values
                elif current_section == "price":
                    parsed_prices = _parse_price_line(line)
                    if parsed_prices:
                        parsed["price_forecast"].update(parsed_prices)

        # Finalize buffered content
        if buffer and current_section == "summary":
            parsed["summary"] = " ".join(buffer)
        elif buffer and current_section == "weather":
            parsed["weather_impact"] = " ".join(buffer)

        # Ensure minimum content
        if not parsed["summary"]:
            sentences = [l for l in lines if l and not l.startswith("#") and not l.startswith("**") and not l.startswith("*")]
            parsed["summary"] = " ".join(sentences[:3]) if sentences else f"Market analysis indicates {content[:100]}..."

        if not parsed["key_insights"]:
            parsed["key_insights"] = [
                "Supply and demand dynamics are shaping current market trends",
                "Price movements reflect seasonal and geographic variations",
                "Market opportunities exist with strategic positioning",
            ]

        if not parsed["recommendations"]:
            parsed["recommendations"] = [
                "Evaluate market timing for optimal entry points",
                "Implement diverse sourcing strategies to reduce risk",
                "Monitor price trends and consider hedging options",
            ]

        if not parsed["weather_impact"]:
            parsed["weather_impact"] = "Weather conditions in key production regions may impact supply availability."

        parsed["raw_text"] = content
        if "demand_forecasts" in parsed and "demand_forecast" not in parsed:
            parsed["demand_forecast"] = parsed["demand_forecasts"]
        if "price_forecasts" in parsed and "price_forecast" not in parsed:
            parsed["price_forecast"] = parsed["price_forecasts"]

        return parsed


def _extract_json_sections(text: str) -> Dict[str, Any]:
    if not text:
        return {}
    sections: Dict[str, Any] = {}
    for key in (
        "market",
        "supply_chain",
        "ground_check",
        "futures",
        "demand_forecast",
        "price_forecast",
        "summary",
        "recommendations",
    ):
        value = _extract_json_value(text, key)
        if value is not None:
            sections[key] = value
    return sections


def _extract_json_value(text: str, key: str) -> Optional[Any]:
    needle = f"\"{key}\""
    idx = text.find(needle)
    if idx == -1:
        return None
    colon = text.find(":", idx + len(needle))
    if colon == -1:
        return None
    pos = colon + 1
    while pos < len(text) and text[pos].isspace():
        pos += 1
    if pos >= len(text):
        return None
    char = text[pos]
    if char in "{[":
        return _extract_bracketed_json(text, pos)
    if char == "\"":
        return _extract_string_value(text, pos)
    end = pos
    while end < len(text) and text[end] not in ",}]":
        end += 1
    raw = text[pos:end].strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def _extract_bracketed_json(text: str, start: int) -> Optional[Any]:
    opener = text[start]
    closer = "}" if opener == "{" else "]"
    depth = 0
    in_string = False
    escape = False
    for idx in range(start, len(text)):
        ch = text[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == "\"":
                in_string = False
            continue
        if ch == "\"":
            in_string = True
            continue
        if ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                snippet = text[start : idx + 1]
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    return None
    return None


def _extract_string_value(text: str, start: int) -> Optional[str]:
    escape = False
    for idx in range(start + 1, len(text)):
        ch = text[idx]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == "\"":
            snippet = text[start : idx + 1]
            try:
                return json.loads(snippet)
            except json.JSONDecodeError:
                return snippet.strip("\"")
    return None


def _parse_demand_line(line: str):
    if ":" not in line:
        return None
    country, rest = line.split(":", 1)
    values = [v.strip() for v in rest.split(",") if v.strip()]
    parsed_vals = []
    for value in values:
        cleaned = value.replace("%", "").replace("Month", "").replace("month", "").strip()
        parsed_vals.append(_safe_float(cleaned))
    parsed_vals = [v for v in parsed_vals if v is not None]
    if len(parsed_vals) >= 3:
        return country.strip(), {"month3": parsed_vals[0], "month6": parsed_vals[1], "month9": parsed_vals[2]}
    return None


def _parse_price_line(line: str):
    if ":" not in line:
        return None
    segments = [seg.strip() for seg in line.split(",") if seg.strip()]
    output = {}
    for seg in segments:
        if ":" not in seg:
            continue
        key, val = seg.split(":", 1)
        key = key.strip().lower().replace("month", "").replace(" ", "")
        value = _safe_float(val.replace("$", "").strip())
        if value is not None and key in {"3", "6", "9"}:
            output[f"month{key}"] = value
    return output or None


def _safe_float(value: str):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_json_strings(text: str) -> str:
    """Replace raw newlines inside JSON strings with spaces for lenient parsing."""
    if not text:
        return text
    result = []
    in_string = False
    escape = False
    for ch in text:
        if escape:
            result.append(ch)
            escape = False
            continue
        if ch == "\\":
            escape = True
            result.append(ch)
            continue
        if ch == '"':
            in_string = not in_string
            result.append(ch)
            continue
        if ch == "\n" and in_string:
            result.append(" ")
            continue
        result.append(ch)
    return "".join(result)
