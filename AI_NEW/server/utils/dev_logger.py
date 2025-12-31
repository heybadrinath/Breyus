"""
Developer-focused logging utility.

This module provides a dedicated logger that only outputs when
PIPELINE_DEV_NAME is set to 'developer'. It is designed for detailed
flow tracing, performance timing, and database introspection without
polluting production logs.
"""

import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional

from ..config import settings


class DevLogger:
    """
    Conditional logger for detailed developer feedback.
    
    Only logs when settings.PIPELINE_DEV_NAME == 'developer'.
    Uses print() directly to avoid interference with standard logging handlers,
    or can be configured to use a specific logger.
    """

    def __init__(self, module_name: str = ""):
        self.enabled = (settings.PIPELINE_DEV_NAME or "").lower() == "developer"
        self.module = module_name
        self._last_perf_time = {}

    def _format_msg(self, category: str, msg: str, details: Optional[Dict[str, Any]] = None) -> str:
        """Format the log message with minimal timestamp and colors (optional)."""
        ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        prefix = f"[{ts}] [{category}]"
        if self.module:
            prefix += f" [{self.module}]"
        
        out = f"{prefix} {msg}"
        if details:
            # Compact JSON representation for details
            try:
                # Use default=str to handle non-serializable objects like datetime/UUID
                detail_str = json.dumps(details, default=str, ensure_ascii=False)
                # If short enough, keep inline
                if len(detail_str) < 100:
                    out += f" {detail_str}"
                else:
                    out += f"\n    {detail_str}"
            except Exception:
                out += f" {str(details)}"
        return out

    def flow(self, step: str, **details):
        """Log a logical flow step."""
        if not self.enabled:
            return
        print(self._format_msg("FLOW", step, details))

    def db(self, operation: str, table: str, **details):
        """Log a database operation."""
        if not self.enabled:
            return
        msg = f"{operation} on {table}"
        print(self._format_msg("DB  ", msg, details))

    def perf(self, label: str, duration_ms: Optional[float] = None):
        """Log performance timing."""
        if not self.enabled:
            return
        
        if duration_ms is None:
            # Start timer logic could go here if stateful, but for now simple logging
            pass
        else:
            msg = f"{label} took {duration_ms:.2f}ms"
            print(self._format_msg("PERF", msg))

    def section(self, title: str):
        """Print a visible section separator."""
        if not self.enabled:
            return
        print(f"\n{'='*20} {title} {'='*20}")

    def error(self, msg: str, exc: Optional[Exception] = None):
         """Log an error (even in dev mode, good to see clearly)."""
         if not self.enabled:
             return
         print(self._format_msg("ERR ", msg))
         if exc:
             print(f"    Exception: {str(exc)}")
