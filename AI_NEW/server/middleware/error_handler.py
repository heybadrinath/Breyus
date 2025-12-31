"""Global error handling middleware for FastAPI."""

import logging
import traceback
from typing import Callable

from fastapi import Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..exceptions import AIServiceException

logger = logging.getLogger(__name__)


async def error_handler_middleware(
    request: Request, call_next: Callable
) -> Response:
    """
    Global error handling middleware.

    Catches all exceptions and returns standardized error responses.
    """
    try:
        response = await call_next(request)
        return response
    except AIServiceException as exc:
        # Custom application exceptions
        logger.error(
            f"{exc.error_code}: {exc.message}",
            extra={
                "error_code": exc.error_code,
                "status_code": exc.status_code,
                "details": exc.details,
                "path": request.url.path,
                "method": request.method,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "statusCode": exc.status_code,
                "message": exc.message,
                "error": exc.error_code,
                "details": exc.details,
            },
        )
    except RequestValidationError as exc:
        # Pydantic validation errors
        logger.warning(
            f"Validation error: {exc}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
        return JSONResponse(
            status_code=422,
            content={
                "statusCode": 422,
                "message": "Request validation failed",
                "error": "VALIDATION_ERROR",
                "details": {"errors": exc.errors()},
            },
        )
    except StarletteHTTPException as exc:
        # Starlette HTTP exceptions (404, 405, etc.)
        logger.warning(
            f"HTTP {exc.status_code}: {exc.detail}",
            extra={
                "status_code": exc.status_code,
                "path": request.url.path,
                "method": request.method,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "statusCode": exc.status_code,
                "message": exc.detail,
                "error": "HTTP_ERROR",
                "details": {},
            },
        )
    except Exception as exc:
        # Unexpected errors
        logger.error(
            f"Unhandled exception: {exc}",
            exc_info=True,
            extra={
                "path": request.url.path,
                "method": request.method,
                "request_id": getattr(request.state, "request_id", None),
                "traceback": traceback.format_exc(),
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "statusCode": 500,
                "message": "Internal server error",
                "error": "INTERNAL_ERROR",
                "details": {
                    "type": type(exc).__name__,
                    "message": str(exc),
                },
            },
        )
