"""Commodity classification helper - fetches from admin portal API."""

from __future__ import annotations

import httpx
import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


def normalize_text(text: str) -> str:
    """Normalize commodity text for matching."""
    if not text:
        return ""
    normalized = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return re.sub(r"\s+", " ", normalized).strip()


def _tokenize(normalized: str) -> List[str]:
    return [token for token in normalized.split() if token]


@dataclass(frozen=True)
class CommodityEntry:
    """Represents a commodity entry with its metadata for classification."""

    name: str
    normalized: str
    aliases: Tuple[str, ...]  # Tuple of alias names
    normalized_aliases: Tuple[str, ...]  # Tuple of normalized aliases
    category: Optional[str]
    hs_code_prefix: Optional[str]  # From API
    source: str


class CommodityClassifier:
    """Classify commodities using admin portal API.

    This classifier fetches commodity data from the NestJS backend's internal
    endpoint, which serves as the single source of truth for commodity
    classifications (mainstream vs niche).

    The classifier uses lazy loading - it only fetches data when first needed,
    and caches the results in memory for subsequent calls.
    """

    def __init__(self) -> None:
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")
        self.mainstream_entries: List[CommodityEntry] = []
        self.niche_entries: List[CommodityEntry] = []
        self._loaded = False

    async def _ensure_loaded(self) -> None:
        """Lazy load commodities from backend API."""
        if self._loaded:
            return
        await self._fetch_commodities()
        self._loaded = True

    async def _fetch_commodities(self) -> None:
        """Fetch commodities from NestJS internal endpoint."""
        url = f"{self.backend_url}/public/content/internal/commodities"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json().get("data", {})

                self.mainstream_entries = self._build_entries(
                    data.get("mainstream", []), "mainstream"
                )
                self.niche_entries = self._build_entries(
                    data.get("niche", []), "niche"
                )
                logger.info(
                    "Loaded %d mainstream and %d niche commodities from API",
                    len(self.mainstream_entries),
                    len(self.niche_entries),
                )
        except httpx.HTTPError as exc:
            logger.error("HTTP error fetching commodities from %s: %s", url, exc)
        except Exception as exc:
            logger.error("Failed to fetch commodities from %s: %s", url, exc)

    def _build_entries(self, items: List[dict], source: str) -> List[CommodityEntry]:
        """Build CommodityEntry objects from API response."""
        entries = []
        for item in items:
            name = item.get("name", "")
            aliases = item.get("aliases", []) or []
            entries.append(
                CommodityEntry(
                    name=name,
                    normalized=normalize_text(name),
                    aliases=tuple(aliases),
                    normalized_aliases=tuple(normalize_text(a) for a in aliases),
                    category=item.get("category"),
                    hs_code_prefix=item.get("hsCodePrefix"),
                    source=source,
                )
            )
        return entries

    def normalize(self, text: str) -> str:
        """Public normalize method for external use."""
        return normalize_text(text)

    async def classify(self, commodity: str) -> Dict[str, Optional[str]]:
        """Classify a commodity as mainstream or niche (async).

        Args:
            commodity: The commodity name to classify.

        Returns:
            A dictionary containing:
            - type: "mainstream" or "niche"
            - match_strategy: How the match was found (exact, contains, within, partial, none)
            - matched_name: The name of the matched commodity entry
            - matched_category: The category of the matched commodity
            - matched_source: The source (mainstream/niche)
        """
        await self._ensure_loaded()

        normalized = normalize_text(commodity)
        if not normalized:
            return {
                "type": "niche",
                "match_strategy": "none",
                "matched_name": None,
                "matched_category": None,
                "matched_source": None,
            }

        # Check niche first (priority - niche classifications take precedence)
        match, strategy = self._find_best_match(normalized, self.niche_entries)
        if match:
            return {
                "type": "niche",
                "match_strategy": strategy,
                "matched_name": match.name,
                "matched_category": match.category,
                "matched_source": match.source,
            }

        # Check mainstream
        match, strategy = self._find_best_match(normalized, self.mainstream_entries)
        if match:
            return {
                "type": "mainstream",
                "match_strategy": strategy,
                "matched_name": match.name,
                "matched_category": match.category,
                "matched_source": match.source,
            }

        # Default to niche if no match
        return {
            "type": "niche",
            "match_strategy": "none",
            "matched_name": None,
            "matched_category": None,
            "matched_source": None,
        }

    def _find_best_match(
        self,
        normalized_query: str,
        entries: List[CommodityEntry],
    ) -> Tuple[Optional[CommodityEntry], str]:
        """Find best matching entry using fuzzy strategies + aliases.

        The matching algorithm checks both the main name and all aliases
        for each commodity entry, returning the best match across all names.
        """
        best_entry: Optional[CommodityEntry] = None
        best_score = -1
        best_strategy = "none"
        query_tokens = _tokenize(normalized_query)

        for entry in entries:
            # Check main name AND all aliases
            names_to_check = [entry.normalized] + list(entry.normalized_aliases)

            for name in names_to_check:
                strategy = self._match_strategy(normalized_query, query_tokens, name)
                if not strategy:
                    continue
                score = self._score_match(strategy, name)
                if score > best_score:
                    best_score = score
                    best_entry = entry
                    best_strategy = strategy

        return best_entry, best_strategy

    def _match_strategy(
        self,
        normalized_query: str,
        query_tokens: List[str],
        entry_name: str,
    ) -> Optional[str]:
        """Determine match strategy between query and entry name.

        Strategies (in order of priority):
        - exact: Query exactly matches entry name
        - contains: Entry name tokens are all present in query
        - within: Query tokens are all present in entry name
        - partial: Substring match in either direction
        """
        entry_tokens = _tokenize(entry_name)
        if normalized_query == entry_name:
            return "exact"
        if entry_tokens and all(token in query_tokens for token in entry_tokens):
            return "contains"
        if query_tokens and all(token in entry_tokens for token in query_tokens):
            return "within"
        if entry_name in normalized_query or normalized_query in entry_name:
            return "partial"
        return None

    def _score_match(self, strategy: str, entry_name: str) -> int:
        """Calculate match score for ranking.

        Higher priority strategies get higher base scores.
        Longer entry names get slight preference (more specific matches).
        """
        priority = {
            "exact": 4,
            "contains": 3,
            "within": 2,
            "partial": 1,
        }
        return priority.get(strategy, 0) * 100 + len(_tokenize(entry_name))

    async def refresh(self) -> None:
        """Force refresh commodities from API.

        Call this method to reload the commodity data from the backend,
        useful when admin has updated classifications.
        """
        self._loaded = False
        await self._ensure_loaded()
