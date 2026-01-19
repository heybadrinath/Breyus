"""
Database Manifest Helpers

Provides functions to interact with the `pipeline_file_manifest` table
for tracking files synced from Google Drive.

This is the DB-backed manifest for the simplified Drive sync workflow.
The JSON manifest (manifest.json) remains for local pipeline tracking,
while this DB manifest tracks Drive sync state.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from .utils import log

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)


@dataclass
class ManifestEntry:
    """Represents a row in pipeline_file_manifest."""
    id: str
    source_type: str
    source_id: str
    file_name: str
    normalized_hash: Optional[str]
    status: str
    rows_inserted: int
    rows_failed: int
    target_table: Optional[str]
    error_message: Optional[str]
    drive_file_id: Optional[str]
    drive_modified_time: Optional[datetime]
    drive_md5_checksum: Optional[str]
    local_path: Optional[str]
    downloaded_at: Optional[datetime]
    processed_at: Optional[datetime]
    purged_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_row(cls, row: Dict[str, Any]) -> "ManifestEntry":
        """Create ManifestEntry from database row dict."""
        return cls(
            id=str(row["id"]),
            source_type=row["source_type"],
            source_id=row["source_id"],
            file_name=row["file_name"],
            normalized_hash=row.get("normalized_hash"),
            status=row["status"],
            rows_inserted=row.get("rows_inserted", 0) or 0,
            rows_failed=row.get("rows_failed", 0) or 0,
            target_table=row.get("target_table"),
            error_message=row.get("error_message"),
            drive_file_id=row.get("drive_file_id"),
            drive_modified_time=row.get("drive_modified_time"),
            drive_md5_checksum=row.get("drive_md5_checksum"),
            local_path=row.get("local_path"),
            downloaded_at=row.get("downloaded_at"),
            processed_at=row.get("processed_at"),
            purged_at=row.get("purged_at"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


def get_db_connection():
    """
    Create a PostgreSQL connection using environment variables.

    Environment variables:
        POSTGRES_HOST (default: localhost)
        POSTGRES_PORT (default: 5432)
        POSTGRES_DB (default: breyus_ai)
        POSTGRES_USER (default: postgres)
        POSTGRES_PASSWORD (default: empty)

    Returns:
        psycopg2 connection object
    """
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "breyus_ai"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )


def get_manifest_entry(
    source_type: str,
    source_id: str,
    conn=None
) -> Optional[ManifestEntry]:
    """
    Get a manifest entry by source_type and source_id.

    Args:
        source_type: 'local' or 'drive'
        source_id: drive file_id or local filename
        conn: Optional existing connection (will create one if not provided)

    Returns:
        ManifestEntry if found, None otherwise
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM pipeline_file_manifest
                WHERE source_type = %s AND source_id = %s
                """,
                (source_type, source_id)
            )
            row = cur.fetchone()
            return ManifestEntry.from_row(row) if row else None
    finally:
        if close_conn:
            conn.close()


def get_manifest_entry_by_filename(
    file_name: str,
    conn=None
) -> Optional[ManifestEntry]:
    """
    Get a manifest entry by file_name.

    Args:
        file_name: The filename to search for
        conn: Optional existing connection

    Returns:
        ManifestEntry if found, None otherwise
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM pipeline_file_manifest
                WHERE file_name = %s
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (file_name,)
            )
            row = cur.fetchone()
            return ManifestEntry.from_row(row) if row else None
    finally:
        if close_conn:
            conn.close()


def create_manifest_entry(
    source_type: str,
    source_id: str,
    file_name: str,
    status: str = "pending",
    drive_file_id: Optional[str] = None,
    drive_modified_time: Optional[datetime] = None,
    drive_md5_checksum: Optional[str] = None,
    local_path: Optional[str] = None,
    normalized_hash: Optional[str] = None,
    conn=None
) -> ManifestEntry:
    """
    Create a new manifest entry.

    Args:
        source_type: 'local' or 'drive'
        source_id: drive file_id or local filename
        file_name: The filename
        status: Initial status (default: 'pending')
        drive_file_id: Google Drive file ID
        drive_modified_time: Last modified time in Drive
        drive_md5_checksum: MD5 from Drive API
        local_path: Local path after download
        normalized_hash: SHA256 of file content
        conn: Optional existing connection

    Returns:
        The created ManifestEntry
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO pipeline_file_manifest (
                    source_type, source_id, file_name, status,
                    drive_file_id, drive_modified_time, drive_md5_checksum,
                    local_path, normalized_hash,
                    downloaded_at
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    CASE WHEN %s = 'downloaded' THEN NOW() ELSE NULL END
                )
                RETURNING *
                """,
                (
                    source_type, source_id, file_name, status,
                    drive_file_id, drive_modified_time, drive_md5_checksum,
                    local_path, normalized_hash,
                    status
                )
            )
            row = cur.fetchone()
            conn.commit()
            log("INFO", f"Created manifest entry for {file_name} (status={status})", "manifest_db")
            return ManifestEntry.from_row(row)
    finally:
        if close_conn:
            conn.close()


def update_manifest_status(
    source_id: str,
    status: str,
    source_type: str = "drive",
    rows_inserted: Optional[int] = None,
    rows_failed: Optional[int] = None,
    target_table: Optional[str] = None,
    error_message: Optional[str] = None,
    local_path: Optional[str] = None,
    normalized_hash: Optional[str] = None,
    conn=None
) -> Optional[ManifestEntry]:
    """
    Update the status of a manifest entry.

    Args:
        source_id: drive file_id or local filename
        status: New status
        source_type: 'local' or 'drive' (default: 'drive')
        rows_inserted: Number of rows successfully inserted
        rows_failed: Number of rows that failed
        target_table: Target database table
        error_message: Error message if failed
        local_path: Local file path
        normalized_hash: SHA256 hash of file
        conn: Optional existing connection

    Returns:
        Updated ManifestEntry or None if not found
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build dynamic update query
            updates = ["status = %s", "updated_at = NOW()"]
            params: List[Any] = [status]

            if rows_inserted is not None:
                updates.append("rows_inserted = %s")
                params.append(rows_inserted)

            if rows_failed is not None:
                updates.append("rows_failed = %s")
                params.append(rows_failed)

            if target_table is not None:
                updates.append("target_table = %s")
                params.append(target_table)

            if error_message is not None:
                updates.append("error_message = %s")
                params.append(error_message)

            if local_path is not None:
                updates.append("local_path = %s")
                params.append(local_path)

            if normalized_hash is not None:
                updates.append("normalized_hash = %s")
                params.append(normalized_hash)

            # Set timestamps based on status
            if status == "downloaded":
                updates.append("downloaded_at = NOW()")
            elif status in ("inserted", "failed"):
                updates.append("processed_at = NOW()")
            elif status == "purged":
                updates.append("purged_at = NOW()")

            params.extend([source_type, source_id])

            sql = f"""
                UPDATE pipeline_file_manifest
                SET {', '.join(updates)}
                WHERE source_type = %s AND source_id = %s
                RETURNING *
            """

            cur.execute(sql, params)
            row = cur.fetchone()
            conn.commit()

            if row:
                log("INFO", f"Updated manifest entry {source_id} -> status={status}", "manifest_db")
                return ManifestEntry.from_row(row)
            return None
    finally:
        if close_conn:
            conn.close()


def create_or_update_manifest(
    source_type: str,
    source_id: str,
    file_name: str,
    status: str,
    drive_file_id: Optional[str] = None,
    drive_modified_time: Optional[datetime] = None,
    drive_md5_checksum: Optional[str] = None,
    local_path: Optional[str] = None,
    normalized_hash: Optional[str] = None,
    conn=None
) -> ManifestEntry:
    """
    Create or update a manifest entry (upsert).

    If the entry exists, updates it. Otherwise creates a new one.

    Args:
        source_type: 'local' or 'drive'
        source_id: drive file_id or local filename
        file_name: The filename
        status: Status to set
        drive_file_id: Google Drive file ID
        drive_modified_time: Last modified time in Drive
        drive_md5_checksum: MD5 from Drive API
        local_path: Local path after download
        normalized_hash: SHA256 of file content
        conn: Optional existing connection

    Returns:
        The created or updated ManifestEntry
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO pipeline_file_manifest (
                    source_type, source_id, file_name, status,
                    drive_file_id, drive_modified_time, drive_md5_checksum,
                    local_path, normalized_hash,
                    downloaded_at
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    CASE WHEN %s = 'downloaded' THEN NOW() ELSE NULL END
                )
                ON CONFLICT (source_type, source_id) DO UPDATE SET
                    file_name = EXCLUDED.file_name,
                    status = EXCLUDED.status,
                    drive_file_id = COALESCE(EXCLUDED.drive_file_id, pipeline_file_manifest.drive_file_id),
                    drive_modified_time = COALESCE(EXCLUDED.drive_modified_time, pipeline_file_manifest.drive_modified_time),
                    drive_md5_checksum = COALESCE(EXCLUDED.drive_md5_checksum, pipeline_file_manifest.drive_md5_checksum),
                    local_path = COALESCE(EXCLUDED.local_path, pipeline_file_manifest.local_path),
                    normalized_hash = COALESCE(EXCLUDED.normalized_hash, pipeline_file_manifest.normalized_hash),
                    downloaded_at = CASE
                        WHEN EXCLUDED.status = 'downloaded' AND pipeline_file_manifest.downloaded_at IS NULL
                        THEN NOW()
                        ELSE pipeline_file_manifest.downloaded_at
                    END,
                    updated_at = NOW()
                RETURNING *
                """,
                (
                    source_type, source_id, file_name, status,
                    drive_file_id, drive_modified_time, drive_md5_checksum,
                    local_path, normalized_hash,
                    status
                )
            )
            row = cur.fetchone()
            conn.commit()
            log("INFO", f"Upserted manifest entry for {file_name} (status={status})", "manifest_db")
            return ManifestEntry.from_row(row)
    finally:
        if close_conn:
            conn.close()


def list_pending_files(conn=None) -> List[ManifestEntry]:
    """
    Get all files with status 'downloaded' (ready for insertion).

    Returns:
        List of ManifestEntry objects
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM pipeline_file_manifest
                WHERE status = 'downloaded'
                ORDER BY created_at ASC
                """
            )
            rows = cur.fetchall()
            return [ManifestEntry.from_row(row) for row in rows]
    finally:
        if close_conn:
            conn.close()


def list_failed_files(conn=None) -> List[ManifestEntry]:
    """
    Get all files with status 'failed' (for retry).

    Returns:
        List of ManifestEntry objects
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT * FROM pipeline_file_manifest
                WHERE status = 'failed'
                ORDER BY updated_at ASC
                """
            )
            rows = cur.fetchall()
            return [ManifestEntry.from_row(row) for row in rows]
    finally:
        if close_conn:
            conn.close()


def list_manifest_entries(
    status: Optional[str] = None,
    source_type: Optional[str] = None,
    limit: int = 100,
    conn=None
) -> List[ManifestEntry]:
    """
    List manifest entries with optional filters.

    Args:
        status: Filter by status (optional)
        source_type: Filter by source_type (optional)
        limit: Maximum entries to return (default: 100)
        conn: Optional existing connection

    Returns:
        List of ManifestEntry objects
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            conditions = []
            params: List[Any] = []

            if status:
                conditions.append("status = %s")
                params.append(status)

            if source_type:
                conditions.append("source_type = %s")
                params.append(source_type)

            where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
            params.append(limit)

            cur.execute(
                f"""
                SELECT * FROM pipeline_file_manifest
                {where_clause}
                ORDER BY updated_at DESC
                LIMIT %s
                """,
                params
            )
            rows = cur.fetchall()
            return [ManifestEntry.from_row(row) for row in rows]
    finally:
        if close_conn:
            conn.close()


def get_manifest_summary(conn=None) -> Dict[str, Any]:
    """
    Get a summary of the manifest status.

    Returns:
        Dict with counts by status and totals
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Count by status
            cur.execute(
                """
                SELECT
                    status,
                    COUNT(*) as count,
                    SUM(rows_inserted) as total_rows_inserted,
                    SUM(rows_failed) as total_rows_failed
                FROM pipeline_file_manifest
                GROUP BY status
                """
            )
            status_rows = cur.fetchall()

            # Total count
            cur.execute("SELECT COUNT(*) as total FROM pipeline_file_manifest")
            total_row = cur.fetchone()

            status_counts = {row["status"]: row["count"] for row in status_rows}
            total_inserted = sum(row["total_rows_inserted"] or 0 for row in status_rows)
            total_failed = sum(row["total_rows_failed"] or 0 for row in status_rows)

            return {
                "total_files": total_row["total"] if total_row else 0,
                "by_status": status_counts,
                "total_rows_inserted": total_inserted,
                "total_rows_failed": total_failed,
            }
    finally:
        if close_conn:
            conn.close()


def delete_manifest_entry(
    source_type: str,
    source_id: str,
    conn=None
) -> bool:
    """
    Delete a manifest entry.

    Args:
        source_type: 'local' or 'drive'
        source_id: drive file_id or local filename
        conn: Optional existing connection

    Returns:
        True if deleted, False if not found
    """
    close_conn = conn is None
    if conn is None:
        conn = get_db_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM pipeline_file_manifest
                WHERE source_type = %s AND source_id = %s
                """,
                (source_type, source_id)
            )
            deleted = cur.rowcount > 0
            conn.commit()
            if deleted:
                log("INFO", f"Deleted manifest entry: {source_type}/{source_id}", "manifest_db")
            return deleted
    finally:
        if close_conn:
            conn.close()
