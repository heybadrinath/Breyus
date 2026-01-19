"""
Google Drive Utilities

Shared utilities for Google Drive operations used by both
local upload and VPS fetch scripts.

Uses direct REST API calls with requests library for simplicity.
OAuth2 authentication via refresh token.

Environment Variables:
    GDRIVE_FOLDER_ID: Target folder ID in Google Drive
    GDRIVE_CLIENT_ID: OAuth 2.0 client ID
    GDRIVE_CLIENT_SECRET: OAuth 2.0 client secret
    GDRIVE_REFRESH_TOKEN: OAuth 2.0 refresh token (from drive_auth.py)
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, BinaryIO

import requests
from dotenv import load_dotenv

from .utils import log, ensure_dir

# Load .env file from AI_NEW directory
_script_dir = Path(__file__).parent
_ai_dir = _script_dir.parent.parent
_env_file = _ai_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

# Google API endpoints
TOKEN_URL = "https://oauth2.googleapis.com/token"
DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3"

# Chunk size for resumable uploads (10MB - balance between speed and reliability)
# Larger chunks = fewer requests but more likely to fail on unstable connections
CHUNK_SIZE = 10 * 1024 * 1024

# Retry configuration
MAX_RETRIES = 5
RETRY_BACKOFF_BASE = 2  # Exponential backoff: 2, 4, 8, 16, 32 seconds


@dataclass
class DriveFile:
    """Represents a file in Google Drive."""
    id: str
    name: str
    mime_type: str
    size: int
    md5_checksum: Optional[str]
    modified_time: Optional[datetime]

    @classmethod
    def from_api_response(cls, data: Dict[str, Any]) -> "DriveFile":
        """Create DriveFile from Google Drive API response."""
        modified_time = None
        if data.get("modifiedTime"):
            # Parse ISO format: "2024-01-15T10:30:00.000Z"
            modified_str = data["modifiedTime"].replace("Z", "+00:00")
            try:
                modified_time = datetime.fromisoformat(modified_str)
            except ValueError:
                pass

        return cls(
            id=data["id"],
            name=data["name"],
            mime_type=data.get("mimeType", ""),
            size=int(data.get("size", 0)),
            md5_checksum=data.get("md5Checksum"),
            modified_time=modified_time,
        )


class DriveAuthError(Exception):
    """Raised when authentication fails."""
    pass


class DriveAPIError(Exception):
    """Raised when a Drive API call fails."""
    pass


def _format_duration(seconds: float) -> str:
    """Format seconds into human-readable duration (HH:MM:SS or MM:SS)."""
    if seconds < 0:
        return "--:--"

    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes:02d}:{secs:02d}"


class ProgressTracker:
    """
    Tracks upload progress and provides live terminal updates.

    Updates display every UPDATE_INTERVAL bytes for smooth progress visualization.
    """
    UPDATE_INTERVAL = 100 * 1024  # Update every 100KB for smooth display

    def __init__(self, file_name: str, total_size: int, chunk_start: int = 0):
        self.file_name = file_name
        self.total_size = total_size
        self.chunk_start = chunk_start  # Offset for multi-chunk uploads
        self.bytes_sent = 0
        self.start_time = time.time()
        self.last_update_bytes = 0

    def update(self, bytes_just_sent: int):
        """Called as bytes are sent. Updates display if interval reached."""
        self.bytes_sent += bytes_just_sent
        total_uploaded = self.chunk_start + self.bytes_sent

        # Only update display every UPDATE_INTERVAL bytes for performance
        if self.bytes_sent - self.last_update_bytes >= self.UPDATE_INTERVAL or total_uploaded >= self.total_size:
            self.last_update_bytes = self.bytes_sent
            self._render_progress(total_uploaded)

    def _render_progress(self, uploaded: int):
        """Render the progress bar to terminal."""
        percent = (uploaded / self.total_size) * 100
        elapsed = time.time() - self.start_time + 0.001  # Avoid division by zero

        # Speed calculation based on total bytes uploaded so far
        speed = uploaded / (elapsed * 1024 * 1024)

        # ETA based on remaining bytes and overall average speed
        remaining_bytes = self.total_size - uploaded
        bytes_per_sec = uploaded / elapsed if elapsed > 0 else 1
        eta_seconds = remaining_bytes / bytes_per_sec if bytes_per_sec > 0 else 0

        # Format strings
        elapsed_str = _format_duration(elapsed)
        eta_str = _format_duration(eta_seconds) if eta_seconds > 0 else "--:--"
        uploaded_mb = uploaded / (1024 * 1024)
        total_mb = self.total_size / (1024 * 1024)

        # Progress bar (20 chars wide)
        bar_width = 20
        filled = int(bar_width * percent / 100)
        bar = "█" * filled + "░" * (bar_width - filled)

        print(
            f"\r  [{bar}] {percent:5.1f}% | {uploaded_mb:.1f}/{total_mb:.1f} MB | {speed:.1f} MB/s | {elapsed_str} elapsed | ETA: {eta_str}  ",
            end="",
            flush=True,
        )


class ProgressFileWrapper:
    """
    Wraps file data to track read progress for live updates.

    Used with requests library to get real-time upload progress
    instead of waiting for chunk completion.
    """
    def __init__(self, data: bytes, tracker: ProgressTracker):
        self.data = data
        self.tracker = tracker
        self.position = 0
        self.length = len(data)

    def read(self, size: int = -1) -> bytes:
        """Read data and update progress tracker."""
        if size == -1:
            size = self.length - self.position

        chunk = self.data[self.position:self.position + size]
        self.position += len(chunk)

        if chunk and self.tracker:
            self.tracker.update(len(chunk))

        return chunk

    def __len__(self) -> int:
        return self.length


def get_drive_config() -> Dict[str, str]:
    """
    Get Drive configuration from environment variables.

    Returns:
        Dict with folder_id, client_id, client_secret, refresh_token

    Raises:
        ValueError: If required environment variables are missing
    """
    config = {
        "folder_id": os.getenv("GDRIVE_FOLDER_ID", ""),
        "client_id": os.getenv("GDRIVE_CLIENT_ID", ""),
        "client_secret": os.getenv("GDRIVE_CLIENT_SECRET", ""),
        "refresh_token": os.getenv("GDRIVE_REFRESH_TOKEN", ""),
    }

    missing = [k for k, v in config.items() if not v]
    if missing:
        raise ValueError(
            f"Missing required environment variables: {', '.join(f'GDRIVE_{k.upper()}' for k in missing)}"
        )

    return config


def authenticate() -> str:
    """
    Get access token using refresh token.

    Uses OAuth 2.0 refresh token flow to get a new access token.

    Returns:
        Access token string

    Raises:
        DriveAuthError: If authentication fails
    """
    config = get_drive_config()

    response = requests.post(
        TOKEN_URL,
        data={
            "client_id": config["client_id"],
            "client_secret": config["client_secret"],
            "refresh_token": config["refresh_token"],
            "grant_type": "refresh_token",
        },
    )

    if response.status_code != 200:
        error_data = response.json() if response.content else {}
        error_msg = error_data.get("error_description", response.text)
        raise DriveAuthError(f"Failed to get access token: {error_msg}")

    data = response.json()
    return data["access_token"]


def _get_headers(access_token: str) -> Dict[str, str]:
    """Get common headers for Drive API requests."""
    return {
        "Authorization": f"Bearer {access_token}",
    }


def list_drive_files(
    folder_id: Optional[str] = None,
    access_token: Optional[str] = None,
    page_size: int = 100,
) -> List[DriveFile]:
    """
    List all files in a Google Drive folder.

    Args:
        folder_id: Drive folder ID (uses GDRIVE_FOLDER_ID if not provided)
        access_token: Access token (authenticates if not provided)
        page_size: Number of files per page (max 1000)

    Returns:
        List of DriveFile objects

    Raises:
        DriveAPIError: If API call fails
    """
    if access_token is None:
        access_token = authenticate()

    if folder_id is None:
        config = get_drive_config()
        folder_id = config["folder_id"]

    headers = _get_headers(access_token)
    files: List[DriveFile] = []
    page_token: Optional[str] = None

    # Only list CSV files (normalized files)
    query = f"'{folder_id}' in parents and trashed = false and mimeType = 'text/csv'"

    while True:
        params: Dict[str, Any] = {
            "q": query,
            "fields": "nextPageToken, files(id, name, mimeType, size, md5Checksum, modifiedTime)",
            "pageSize": page_size,
        }
        if page_token:
            params["pageToken"] = page_token

        response = requests.get(
            f"{DRIVE_API_BASE}/files",
            headers=headers,
            params=params,
        )

        if response.status_code != 200:
            raise DriveAPIError(f"Failed to list files: {response.text}")

        data = response.json()
        for item in data.get("files", []):
            files.append(DriveFile.from_api_response(item))

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    log("INFO", f"Listed {len(files)} files from Drive folder", "drive_utils")
    return files


def file_exists_in_drive(
    filename: str,
    folder_id: Optional[str] = None,
    access_token: Optional[str] = None,
) -> Optional[DriveFile]:
    """
    Check if a file with the given name exists in the Drive folder.

    Args:
        filename: Name of the file to check
        folder_id: Drive folder ID (uses GDRIVE_FOLDER_ID if not provided)
        access_token: Access token (authenticates if not provided)

    Returns:
        DriveFile if found, None otherwise
    """
    if access_token is None:
        access_token = authenticate()

    if folder_id is None:
        config = get_drive_config()
        folder_id = config["folder_id"]

    headers = _get_headers(access_token)

    # Escape single quotes in filename
    safe_name = filename.replace("'", "\\'")
    query = f"'{folder_id}' in parents and name = '{safe_name}' and trashed = false"

    response = requests.get(
        f"{DRIVE_API_BASE}/files",
        headers=headers,
        params={
            "q": query,
            "fields": "files(id, name, mimeType, size, md5Checksum, modifiedTime)",
            "pageSize": 1,
        },
    )

    if response.status_code != 200:
        raise DriveAPIError(f"Failed to check file existence: {response.text}")

    data = response.json()
    files = data.get("files", [])

    if files:
        return DriveFile.from_api_response(files[0])
    return None


def download_file(
    file_id: str,
    destination: Path,
    access_token: Optional[str] = None,
    show_progress: bool = True,
) -> Path:
    """
    Download a file from Google Drive.

    Uses streaming download for large files.

    Args:
        file_id: Drive file ID to download
        destination: Local path to save the file
        access_token: Access token (authenticates if not provided)
        show_progress: Show download progress

    Returns:
        Path to the downloaded file

    Raises:
        DriveAPIError: If download fails
    """
    if access_token is None:
        access_token = authenticate()

    headers = _get_headers(access_token)

    # Get file metadata first for size
    meta_response = requests.get(
        f"{DRIVE_API_BASE}/files/{file_id}",
        headers=headers,
        params={"fields": "name, size"},
    )

    if meta_response.status_code != 200:
        raise DriveAPIError(f"Failed to get file metadata: {meta_response.text}")

    meta = meta_response.json()
    file_size = int(meta.get("size", 0))
    file_name = meta.get("name", "unknown")

    # Ensure destination directory exists
    ensure_dir(destination.parent)

    # Download with streaming
    response = requests.get(
        f"{DRIVE_API_BASE}/files/{file_id}",
        headers=headers,
        params={"alt": "media"},
        stream=True,
    )

    if response.status_code != 200:
        raise DriveAPIError(f"Failed to download file: {response.text}")

    downloaded = 0
    start_time = time.time()

    with open(destination, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)

                if show_progress and file_size > 0:
                    percent = (downloaded / file_size) * 100
                    elapsed = time.time() - start_time
                    speed = downloaded / (elapsed * 1024 * 1024) if elapsed > 0 else 0
                    print(
                        f"\r  Downloading {file_name}: {percent:.1f}% ({speed:.1f} MB/s)",
                        end="",
                        flush=True,
                    )

    if show_progress:
        print()  # New line after progress

    log("INFO", f"Downloaded {file_name} ({downloaded:,} bytes)", "drive_utils")
    return destination


def upload_file(
    local_path: Path,
    folder_id: Optional[str] = None,
    access_token: Optional[str] = None,
    show_progress: bool = True,
) -> DriveFile:
    """
    Upload a file to Google Drive using resumable upload.

    Supports large files by using resumable upload protocol.

    Args:
        local_path: Path to the local file to upload
        folder_id: Drive folder ID (uses GDRIVE_FOLDER_ID if not provided)
        access_token: Access token (authenticates if not provided)
        show_progress: Show upload progress

    Returns:
        DriveFile representing the uploaded file

    Raises:
        DriveAPIError: If upload fails
    """
    if access_token is None:
        access_token = authenticate()

    if folder_id is None:
        config = get_drive_config()
        folder_id = config["folder_id"]

    file_size = local_path.stat().st_size
    file_name = local_path.name

    # Step 1: Initiate resumable upload session
    headers = _get_headers(access_token)
    headers["Content-Type"] = "application/json"
    headers["X-Upload-Content-Type"] = "text/csv"
    headers["X-Upload-Content-Length"] = str(file_size)

    metadata = {
        "name": file_name,
        "parents": [folder_id],
    }

    init_response = requests.post(
        f"{UPLOAD_API_BASE}/files?uploadType=resumable",
        headers=headers,
        json=metadata,
    )

    if init_response.status_code not in (200, 308):
        raise DriveAPIError(f"Failed to initiate upload: {init_response.text}")

    upload_url = init_response.headers.get("Location")
    if not upload_url:
        raise DriveAPIError("No upload URL returned")

    # Step 2: Upload file in chunks with live progress
    uploaded = 0
    start_time = time.time()

    # Create progress tracker for live updates
    tracker = ProgressTracker(file_name, file_size) if show_progress else None

    with open(local_path, "rb") as f:
        while uploaded < file_size:
            chunk_start = uploaded
            chunk_end = min(uploaded + CHUNK_SIZE, file_size)
            chunk_size = chunk_end - chunk_start

            chunk_data = f.read(chunk_size)

            chunk_headers = {
                "Content-Length": str(chunk_size),
                "Content-Range": f"bytes {chunk_start}-{chunk_end - 1}/{file_size}",
            }

            # Update tracker's chunk_start for accurate overall progress
            if tracker:
                tracker.chunk_start = chunk_start
                tracker.bytes_sent = 0
                tracker.last_update_bytes = 0
                tracker.start_time = start_time  # Keep original start time for accurate ETA

            # Upload with retry logic
            last_error = None
            response = None

            for attempt in range(MAX_RETRIES):
                try:
                    # Reset tracker for retry
                    if tracker:
                        tracker.bytes_sent = 0
                        tracker.last_update_bytes = 0

                    # Wrap data for live progress tracking
                    if show_progress:
                        wrapped_data = ProgressFileWrapper(chunk_data, tracker)
                        response = requests.put(
                            upload_url,
                            headers=chunk_headers,
                            data=wrapped_data,
                            timeout=300,  # 5 minute timeout per chunk
                        )
                    else:
                        response = requests.put(
                            upload_url,
                            headers=chunk_headers,
                            data=chunk_data,
                            timeout=300,
                        )

                    # Check response
                    if response.status_code in (200, 201, 308):
                        break  # Success, exit retry loop
                    else:
                        last_error = f"HTTP {response.status_code}: {response.text}"

                except (requests.exceptions.ConnectionError,
                        requests.exceptions.Timeout,
                        requests.exceptions.ChunkedEncodingError) as e:
                    last_error = str(e)

                # If we get here, the request failed - retry with backoff
                if attempt < MAX_RETRIES - 1:
                    backoff = RETRY_BACKOFF_BASE ** attempt
                    if show_progress:
                        print(f"\n  ⚠ Connection error, retrying in {backoff}s (attempt {attempt + 2}/{MAX_RETRIES})...")
                    time.sleep(backoff)
                else:
                    # All retries exhausted
                    raise DriveAPIError(f"Failed after {MAX_RETRIES} attempts: {last_error}")

            if response is None or response.status_code not in (200, 201, 308):
                raise DriveAPIError(f"Failed to upload chunk: {last_error}")

            uploaded = chunk_end

            # Final response contains file metadata
            if response.status_code in (200, 201):
                result = response.json()
                total_time = time.time() - start_time
                avg_speed = file_size / (total_time * 1024 * 1024) if total_time > 0 else 0
                if show_progress:
                    print()  # New line after progress
                    print(f"  ✓ Completed in {_format_duration(total_time)} (avg {avg_speed:.1f} MB/s)")
                log("INFO", f"Uploaded {file_name} ({uploaded:,} bytes) in {_format_duration(total_time)}", "drive_utils")
                return DriveFile.from_api_response(result)

    raise DriveAPIError("Upload completed but no file metadata returned")


def delete_file(
    file_id: str,
    access_token: Optional[str] = None,
) -> bool:
    """
    Delete a file from Google Drive.

    Args:
        file_id: Drive file ID to delete
        access_token: Access token (authenticates if not provided)

    Returns:
        True if deleted successfully

    Raises:
        DriveAPIError: If deletion fails
    """
    if access_token is None:
        access_token = authenticate()

    headers = _get_headers(access_token)

    response = requests.delete(
        f"{DRIVE_API_BASE}/files/{file_id}",
        headers=headers,
    )

    if response.status_code not in (200, 204):
        raise DriveAPIError(f"Failed to delete file: {response.text}")

    log("INFO", f"Deleted file {file_id} from Drive", "drive_utils")
    return True


def get_file_metadata(
    file_id: str,
    access_token: Optional[str] = None,
) -> DriveFile:
    """
    Get metadata for a specific file.

    Args:
        file_id: Drive file ID
        access_token: Access token (authenticates if not provided)

    Returns:
        DriveFile with metadata

    Raises:
        DriveAPIError: If request fails
    """
    if access_token is None:
        access_token = authenticate()

    headers = _get_headers(access_token)

    response = requests.get(
        f"{DRIVE_API_BASE}/files/{file_id}",
        headers=headers,
        params={
            "fields": "id, name, mimeType, size, md5Checksum, modifiedTime",
        },
    )

    if response.status_code != 200:
        raise DriveAPIError(f"Failed to get file metadata: {response.text}")

    return DriveFile.from_api_response(response.json())
