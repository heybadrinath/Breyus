"""
Embedding Service

Generates and manages vector embeddings using sentence-transformers.

Model: sentence-transformers/all-MiniLM-L12-v2
Dimensions: 384
Max Sequence: 256 tokens

Functions:
- embed_text(text: str) -> List[float]
- embed_batch(texts: List[str]) -> List[List[float]]
- find_similar(embedding: List[float], table: str, limit: int) -> List[dict]
"""

import json
import logging
from functools import lru_cache
from typing import Iterable, List, Optional

from sentence_transformers import SentenceTransformer

from ..config import settings
from ..db import postgres

logger = logging.getLogger(__name__)


@lru_cache()
def get_model() -> SentenceTransformer:
    """Load and cache the embedding model."""
    logger.info("loading embedding model", extra={"model": settings.EMBEDDING_MODEL})
    model = SentenceTransformer(settings.EMBEDDING_MODEL)
    logger.info(
        "embedding model ready",
        extra={
            "model": settings.EMBEDDING_MODEL,
            "dim": model.get_sentence_embedding_dimension(),
        },
    )
    return model


class EmbeddingService:
    """Utility wrapper for embeddings and similarity search."""

    def __init__(self, conn):
        self.conn = conn
        self.model = get_model()

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        if not text:
            return [0.0] * self.model.get_sentence_embedding_dimension()
        embedding = self.model.encode(text, convert_to_tensor=False, normalize_embeddings=True)
        return embedding.tolist()

    def embed_batch(self, texts: Iterable[str], batch_size: Optional[int] = None) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        texts_list = list(texts)
        if not texts_list:
            return []
        embeddings = self.model.encode(
            texts_list,
            batch_size=batch_size or settings.EMBEDDING_BATCH_SIZE,
            convert_to_tensor=False,
            normalize_embeddings=True,
        )
        return [emb.tolist() for emb in embeddings]

    async def find_similar(
        self,
        embedding: List[float],
        table: str,
        limit: int = 10,
        embedding_field: Optional[str] = None,
    ):
        """Find similar records using pgvector helper."""
        embedding_literal = json.dumps(embedding, separators=(",", ":"))
        return await postgres.find_similar_by_embedding(
            conn=self.conn,
            table=table,
            embedding=embedding_literal,
            limit=limit,
            embedding_field=embedding_field,
        )
