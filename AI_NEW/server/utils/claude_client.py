"""
Claude AI Client Implementation

Anthropic Claude API integration for market analysis.
"""

import asyncio
import logging
import time
import json
from typing import Dict, List, Any
import anthropic

from ..config import settings
from .ai_client_base import AIClientBase

logger = logging.getLogger(__name__)


class ClaudeClient(AIClientBase):
    """Claude AI client implementation."""

    def __init__(self):
        """Initialize Claude client with API key from settings."""
        self.api_key = settings.ANTHROPIC_API_KEY
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("ANTHROPIC_API_KEY not set. ClaudeClient running in mock mode.")
        self.model = settings.LLM_MODEL

    def get_provider_name(self) -> str:
        """Return provider name."""
        return "claude"

    async def analyze_market(
        self,
        commodity: str,
        historical_prices: List[float],
        historical_volumes: List[float],
        top_countries: List[Dict[str, Any]],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate market analysis using Claude.

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

        if not self.client:
            logger.info(
                "Claude mock response (no API key)",
                extra={"commodity": commodity, "provider": "claude", "model": self.model, "details": {"prompt_chars": prompt_chars}},
            )
            return self._get_fallback_analysis(commodity)

        start = time.perf_counter()
        try:
            response = await asyncio.to_thread(
                self.client.messages.create,
                model=self.model,
                max_tokens=2048,
                temperature=0.7,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.content[0].text
            parsed = self._parse_market_analysis(content)
            duration_ms = int((time.perf_counter() - start) * 1000)

            logger.info(
                "Claude market analysis completed",
                extra={
                    "commodity": commodity,
                    "model": self.model,
                    "provider": "claude",
                    "duration_ms": duration_ms,
                    "details": {
                        "prompt_chars": prompt_chars,
                        "response_chars": len(content or ""),
                    },
                },
            )

            return parsed

        except Exception as exc:
            duration_ms = int((time.perf_counter() - start) * 1000)
            logger.error(
                "Claude API error",
                exc_info=exc,
                extra={
                    "commodity": commodity,
                    "provider": "claude",
                    "model": self.model,
                    "duration_ms": duration_ms,
                },
            )
            return self._get_fallback_analysis(commodity)

    def _parse_market_analysis(self, content: str) -> Dict[str, Any]:
        """Parse Claude's response into structured format."""
        try:
            # Clean content to extract JSON
            cleaned = content.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(cleaned)
            return parsed
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse AI JSON response", exc_info=exc, extra={"content": content[:200]})
            fallback = self._get_fallback_analysis("Unknown")
            fallback["raw_text"] = content
            return fallback

    def _safe_float(self, value: str):
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
