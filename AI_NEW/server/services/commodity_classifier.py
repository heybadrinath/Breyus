"""Commodity classification helper for mainstream vs niche mapping."""

from __future__ import annotations

import json
import logging
import re
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

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
    name: str
    normalized: str
    category: Optional[str]
    source: str


class CommodityClassifier:
    """Classify commodities using the mainstream vs niche mapping."""

    def __init__(self, mapping_path: Optional[Path] = None) -> None:
        self.mapping_path = mapping_path or self._default_mapping_path()
        self.mapping = self._load_mapping()
        self.mainstream_entries, self.niche_entries = self._build_entries()

    def _default_mapping_path(self) -> Path:
        resolved = Path(__file__).resolve()
        env_path = os.getenv("COMMODITY_MAPPING_PATH")
        candidates = []
        if env_path:
            candidates.append(Path(env_path))
        candidates.append(resolved.parents[3] / "context" / "mainstream-niche-mapping.json")
        candidates.append(resolved.parents[2] / "context" / "mainstream-niche-mapping.json")
        candidates.append(resolved.parents[1] / "context" / "mainstream-niche-mapping.json")
        for candidate in candidates:
            if candidate.exists():
                return candidate
        return candidates[0]

    def _load_mapping(self) -> Dict[str, Any]:
        try:
            return json.loads(self.mapping_path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            logger.warning("Commodity mapping not found at %s", self.mapping_path)
        except json.JSONDecodeError as exc:
            logger.warning("Commodity mapping invalid JSON (%s): %s", self.mapping_path, exc)
        except Exception as exc:
            logger.warning("Commodity mapping failed to load (%s): %s", self.mapping_path, exc)
        return {}

    def _build_entries(self) -> Tuple[List[CommodityEntry], List[CommodityEntry]]:
        mainstream_entries: List[CommodityEntry] = []
        niche_entries: List[CommodityEntry] = []

        mainstream = self.mapping.get("mainstream", {})
        for name, category in self._flatten_mainstream(mainstream):
            mainstream_entries.append(
                CommodityEntry(
                    name=name,
                    normalized=normalize_text(name),
                    category=category,
                    source="mainstream",
                )
            )

        added_for_coverage = self.mapping.get("added_for_coverage", {})
        for name in added_for_coverage.get("mainstream", []) or []:
            mainstream_entries.append(
                CommodityEntry(
                    name=name,
                    normalized=normalize_text(name),
                    category="added_for_coverage",
                    source="added_for_coverage",
                )
            )

        for name in self.mapping.get("niche_overrides", []) or []:
            niche_entries.append(
                CommodityEntry(
                    name=name,
                    normalized=normalize_text(name),
                    category="niche_override",
                    source="niche_override",
                )
            )

        for name in added_for_coverage.get("niche", []) or []:
            niche_entries.append(
                CommodityEntry(
                    name=name,
                    normalized=normalize_text(name),
                    category="added_for_coverage",
                    source="added_for_coverage",
                )
            )

        return mainstream_entries, niche_entries

    def _flatten_mainstream(self, node: Any, prefix: str = "") -> Iterable[Tuple[str, Optional[str]]]:
        if isinstance(node, list):
            for name in node:
                yield name, prefix or None
        elif isinstance(node, dict):
            for key, value in node.items():
                category = f"{prefix}/{key}" if prefix else key
                yield from self._flatten_mainstream(value, category)

    def normalize(self, text: str) -> str:
        return normalize_text(text)

    def classify(self, commodity: str) -> Dict[str, Optional[str]]:
        normalized = normalize_text(commodity)
        if not normalized:
            return {
                "type": "niche",
                "match_strategy": "none",
                "matched_name": None,
                "matched_category": None,
                "matched_source": None,
            }

        match, strategy = self._find_best_match(normalized, self.niche_entries)
        if match:
            return {
                "type": "niche",
                "match_strategy": strategy,
                "matched_name": match.name,
                "matched_category": match.category,
                "matched_source": match.source,
            }

        match, strategy = self._find_best_match(normalized, self.mainstream_entries)
        if match:
            return {
                "type": "mainstream",
                "match_strategy": strategy,
                "matched_name": match.name,
                "matched_category": match.category,
                "matched_source": match.source,
            }

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
        best_entry: Optional[CommodityEntry] = None
        best_score = -1
        best_strategy = "none"
        query_tokens = _tokenize(normalized_query)

        for entry in entries:
            strategy = self._match_strategy(normalized_query, query_tokens, entry)
            if not strategy:
                continue
            score = self._score_match(strategy, entry)
            if score > best_score:
                best_score = score
                best_entry = entry
                best_strategy = strategy

        return best_entry, best_strategy

    def _match_strategy(
        self,
        normalized_query: str,
        query_tokens: List[str],
        entry: CommodityEntry,
    ) -> Optional[str]:
        entry_tokens = _tokenize(entry.normalized)
        if normalized_query == entry.normalized:
            return "exact"
        if entry_tokens and all(token in query_tokens for token in entry_tokens):
            return "contains"
        if query_tokens and all(token in entry_tokens for token in query_tokens):
            return "within"
        if entry.normalized in normalized_query or normalized_query in entry.normalized:
            return "partial"
        return None

    def _score_match(self, strategy: str, entry: CommodityEntry) -> int:
        priority = {
            "exact": 4,
            "contains": 3,
            "within": 2,
            "partial": 1,
        }
        return priority.get(strategy, 0) * 100 + len(_tokenize(entry.normalized))
