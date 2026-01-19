"""Server configuration for the AI service."""

from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Server
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    AI_SERVER_PORT: int = Field(default=8000, description="Port FastAPI listens on")
    AI_API_KEY: str = Field(default="", description="Internal API key (backend → AI)")
    ALLOW_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="CORS allowlist"
    )
    REQUEST_LOG_SAMPLE_RATE: float = Field(
        default=1.0, description="Fraction of requests to log (0-1)"
    )
    CACHE_ENABLED: bool = Field(
        default=True,
        description="Enable response caching (Redis + Postgres)",
    )

    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "breyus_ai"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_MIN_CONN: int = 5
    POSTGRES_MAX_CONN: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_JOB_TTL_SEC: int = Field(default=900, description="Job status TTL (15m)")
    REDIS_CACHE_TTL_SEC: int = Field(default=900, description="Cache TTL (15m)")

    # LLM (Anthropic)
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "claude-3-sonnet-20240229"
    AI_PROVIDER: str = Field(default="gemini", description="AI provider: claude or gemini")

    # LLM (Gemini)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-latest"

    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L12-v2"
    EMBEDDING_BATCH_SIZE: int = 100

    # Result retention (in Postgres, not Redis)
    TTL_LINK_PREDICTION_DAYS: int = 14
    TTL_TRADE_SCORE_DAYS: int = 7
    TTL_ANALYSIS_DAYS: int = 30

    # Trade scoring weights (JSON string mapping factor -> weight)
    TRADE_SCORE_WEIGHTS_JSON: Optional[str] = Field(
        default=None,
        description="Optional JSON override for gravity score weights",
    )

    # Observability
    SERVICE_NAME: str = "breyus-ai-server"
    LOG_LEVEL: str = "INFO"

    # Pipeline
    PIPELINE_DEV_NAME: Optional[str] = Field(default=None, description="Pipeline developer name tag")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
