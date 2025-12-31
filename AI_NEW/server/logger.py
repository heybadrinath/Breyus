"""Enhanced logging configuration with structured logging and rotation."""

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict

from .config import settings


class StructuredFormatter(logging.Formatter):
    """Custom formatter that adds structured fields to log records."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with structured data."""
        # Base format
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "module": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields if present
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "error_code"):
            log_data["error_code"] = record.error_code
        if hasattr(record, "details"):
            log_data["details"] = record.details
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Format as structured string
        parts = [f"[{log_data['timestamp']}]", f"[{log_data['level']}]"]
        parts.append(f"[{log_data['module']}]")

        # Add request_id if available
        if "request_id" in log_data:
            parts.append(f"[{log_data['request_id'][:8]}]")

        parts.append(f"- {log_data['message']}")

        # Add context
        context_parts = []
        for key in [
            "path",
            "method",
            "status_code",
            "duration_ms",
            "error_code",
            "job_id",
            "status",
            "commodity",
            "hs_code",
            "provider",
            "model",
            "cache",
            "count",
            "rows",
            "source",
            "details",
        ]:
            if key in log_data:
                context_parts.append(f"{key}={log_data[key]}")

        if context_parts:
            parts.append("{" + ", ".join(context_parts) + "}")

        if "exception" in log_data:
            parts.append(log_data["exception"])

        return " ".join(parts)


def setup_logging() -> None:
    """
    Configure logging with console and file handlers.

    Creates:
    - Console handler (INFO and above)
    - Rotating file handler (DEBUG and above)
    - Structured formatting with correlation IDs
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / "ai_server.log"

    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Capture everything, filter at handlers

    # Remove existing handlers
    root_logger.handlers.clear()

    # Console handler (INFO+)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_formatter = StructuredFormatter(
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # File handler with rotation (DEBUG+)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_formatter = StructuredFormatter(
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncpg").setLevel(logging.WARNING)
    logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

    logging.info(
        f"Logging configured: level={settings.LOG_LEVEL}, file={log_file}"
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a module."""
    return logging.getLogger(name)


# Context manager for adding correlation data to logs
class LogContext:
    """Context manager for adding structured data to log records."""

    def __init__(self, **kwargs: Any):
        self.context = kwargs
        self.old_factory = logging.getLogRecordFactory()

    def __enter__(self):
        def record_factory(*args, **kwargs):
            record = self.old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record

        logging.setLogRecordFactory(record_factory)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        logging.setLogRecordFactory(self.old_factory)
