"""
Vector Embedding Generator

Generates vector embeddings for text fields using sentence-transformers.

Functions:
    embed_table(table: str, batch_size: int = 100) -> int
    embed_text(text: str) -> List[float]
    get_embedding_model() -> SentenceTransformer
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import List, Tuple

import psycopg2
from dotenv import load_dotenv

from .utils import load_manifest, save_manifest, utc_now

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)


try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None  # type: ignore


DEFAULT_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L12-v2")


def get_embedding_model(model_name: str | None = None):
    """Load and cache embedding model; raise helpful error if missing."""
    name = model_name or DEFAULT_MODEL
    if SentenceTransformer is None:
        raise RuntimeError("sentence-transformers not installed. Install to run embeddings.")
    try:
        return SentenceTransformer(name)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to load embedding model '{name}'. "
            "Ensure the model is available locally or internet access is enabled."
        ) from exc


def embed_texts(model, texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return vectors.tolist() if hasattr(vectors, "tolist") else list(vectors)


def embed_table(table: str, batch_size: int = 1000, model_name: str | None = None, use_queue: bool = True) -> int:
    """
    Generate embeddings for rows missing vectors.
    Supports companies, trade_records, products.

    Args:
        table: Target table name
        batch_size: Number of records to process per batch
        model_name: Embedding model name (defaults to env var)
        use_queue: Track progress in embedding_queue table
    """
    model = get_embedding_model(model_name)
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )

    rows_updated = 0
    start = time.perf_counter()
    with conn:
        with conn.cursor() as cur:
            while True:
                ids, texts = _fetch_batch(cur, table, batch_size)
                if not ids:
                    break

                # Update queue status to processing
                if use_queue:
                    _update_queue_status(cur, table, ids, "processing")

                try:
                    vectors = embed_texts(model, texts)
                    _update_embeddings(cur, table, ids, vectors)

                    # Mark as completed in queue
                    if use_queue:
                        _update_queue_status(cur, table, ids, "completed")

                    # Commit per batch so Ctrl+C keeps prior progress.
                    conn.commit()
                    rows_updated += len(ids)
                    print(f"[embed] {table}: {rows_updated} rows embedded...")
                except Exception as exc:
                    # Mark as failed in queue
                    if use_queue:
                        _update_queue_status(cur, table, ids, "failed", error=str(exc))
                    raise

    conn.close()
    elapsed = time.perf_counter() - start
    print(f"[embed] table={table} updated={rows_updated} in {elapsed:.2f}s")
    _update_manifest_embedded_total()
    return rows_updated


def _update_manifest_embedded_total() -> None:
    """Update manifest summary with total embedded rows."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", ""),
        )
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM companies WHERE name_embedding IS NOT NULL")
                companies = int(cur.fetchone()[0])
                cur.execute("SELECT COUNT(*) FROM trade_records WHERE product_embedding IS NOT NULL")
                trade_records = int(cur.fetchone()[0])
                cur.execute("SELECT COUNT(*) FROM products WHERE product_embedding IS NOT NULL")
                products = int(cur.fetchone()[0])
        conn.close()
        manifest = load_manifest()
        summary = manifest.get("summary", {})
        summary["total_embedded"] = companies + trade_records + products
        summary["last_updated"] = utc_now()
        manifest["summary"] = summary
        save_manifest(manifest)
    except Exception:
        pass


def _fetch_batch(cur, table: str, batch_size: int) -> Tuple[List[str], List[str]]:
    if table == "companies":
        cur.execute(
            """
            SELECT id, COALESCE(name, '') || ' ' || COALESCE(business_details, '')
            FROM companies
            WHERE name_embedding IS NULL
            LIMIT %s
            FOR UPDATE SKIP LOCKED
            """,
            (batch_size,),
        )
    elif table == "trade_records":
        cur.execute(
            """
            SELECT id, COALESCE(product_description, '') || ' ' || COALESCE(item_description, '')
            FROM trade_records
            WHERE product_embedding IS NULL
            LIMIT %s
            FOR UPDATE SKIP LOCKED
            """,
            (batch_size,),
        )
    elif table == "products":
        cur.execute(
            """
            SELECT id, COALESCE(name, '') || ' ' || COALESCE(category, '')
            FROM products
            WHERE product_embedding IS NULL
            LIMIT %s
            FOR UPDATE SKIP LOCKED
            """,
            (batch_size,),
        )
    else:
        raise ValueError(f"Unsupported table for embedding: {table}")

    rows = cur.fetchall()
    ids = [r[0] for r in rows]
    texts = [r[1] for r in rows]
    return ids, texts


def _update_embeddings(cur, table: str, ids: List[str], vectors: List[List[float]]) -> None:
    sql = ""
    if table == "companies":
        sql = "UPDATE companies SET name_embedding = %s WHERE id = %s"
    elif table == "trade_records":
        sql = "UPDATE trade_records SET product_embedding = %s WHERE id = %s"
    elif table == "products":
        sql = "UPDATE products SET product_embedding = %s WHERE id = %s"
    else:
        raise ValueError(f"Unsupported table: {table}")

    cur.executemany(sql, list(zip(vectors, ids)))


def _update_queue_status(cur, table: str, ids: List[str], status: str, error: str = None) -> None:
    """Update embedding_queue status for tracked records."""
    embedding_field = _get_embedding_field(table)

    for record_id in ids:
        if status == "processing":
            cur.execute(
                """
                INSERT INTO embedding_queue (table_name, record_id, embedding_field, status, started_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (table_name, record_id, embedding_field)
                DO UPDATE SET status = %s, started_at = NOW()
                """,
                (table, record_id, embedding_field, status, status),
            )
        elif status == "completed":
            cur.execute(
                """
                UPDATE embedding_queue
                SET status = %s, completed_at = NOW()
                WHERE table_name = %s AND record_id = %s AND embedding_field = %s
                """,
                (status, table, record_id, embedding_field),
            )
        elif status == "failed":
            cur.execute(
                """
                UPDATE embedding_queue
                SET status = %s, retry_count = retry_count + 1, last_error = %s
                WHERE table_name = %s AND record_id = %s AND embedding_field = %s
                """,
                (status, error, table, record_id, embedding_field),
            )


def _get_embedding_field(table: str) -> str:
    """Get the embedding field name for a table."""
    if table == "companies":
        return "name_embedding"
    elif table == "trade_records":
        return "product_embedding"
    elif table == "products":
        return "product_embedding"
    else:
        raise ValueError(f"Unsupported table: {table}")
