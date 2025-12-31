"""
AI Client Factory

Factory pattern for creating AI client instances based on configuration.
"""

import logging
from typing import Optional

from ..config import settings
from .ai_client_base import AIClientBase
from .claude_client import ClaudeClient

logger = logging.getLogger(__name__)


class AIClientFactory:
    """Factory for creating AI client instances."""

    _instance: Optional[AIClientBase] = None

    @classmethod
    def get_client(cls, provider: Optional[str] = None) -> AIClientBase:
        """
        Get AI client instance.

        Uses singleton pattern to reuse client instances.

        Args:
            provider: AI provider name ('claude', 'gemini', etc.)
                     If None, uses AI_PROVIDER from settings

        Returns:
            AI client instance

        Raises:
            ValueError: If provider is not supported
        """
        provider = provider or settings.AI_PROVIDER

        # Return cached instance if provider hasn't changed
        if cls._instance and cls._instance.get_provider_name() == provider:
            return cls._instance

        # Create new instance based on provider
        if provider == "claude":
            cls._instance = ClaudeClient()
        elif provider == "gemini":
            try:
                from .gemini_client import GeminiClient
            except ImportError as exc:
                logger.error("Gemini client dependency missing: %s", exc)
                raise ValueError(
                    "Gemini client requires google-genai. "
                    "Install dependency or set AI_PROVIDER=claude."
                ) from exc
            cls._instance = GeminiClient()
        else:
            logger.error(f"Unsupported AI provider: {provider}")
            raise ValueError(
                f"Unsupported AI provider: {provider}. "
                f"Supported providers: claude, gemini"
            )

        model = settings.LLM_MODEL if provider == "claude" else settings.GEMINI_MODEL
        logger.info(
            "AI client initialized",
            extra={"provider": provider, "model": model},
        )
        return cls._instance

    @classmethod
    def reset(cls):
        """Reset cached client instance (useful for testing)."""
        cls._instance = None


# Convenience function for getting current AI client
def get_ai_client() -> AIClientBase:
    """Get the configured AI client instance."""
    return AIClientFactory.get_client()
