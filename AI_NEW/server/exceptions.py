"""Custom exception classes for the AI service."""

from typing import Any, Dict, Optional


class AIServiceException(Exception):
    """Base exception for all AI service errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class DatabaseException(AIServiceException):
    """Database connection or query errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details,
        )


class CacheException(AIServiceException):
    """Redis cache errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="CACHE_ERROR",
            details=details,
        )


class ValidationException(AIServiceException):
    """Request validation errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class ResourceNotFoundException(AIServiceException):
    """Requested resource not found."""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} not found: {identifier}",
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
        )


class JobNotFoundException(AIServiceException):
    """Job ID not found in queue."""

    def __init__(self, job_id: str):
        super().__init__(
            message=f"Job not found: {job_id}",
            status_code=404,
            error_code="JOB_NOT_FOUND",
            details={"job_id": job_id},
        )


class EmbeddingException(AIServiceException):
    """Embedding model errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="EMBEDDING_ERROR",
            details=details,
        )


class PipelineException(AIServiceException):
    """Data pipeline errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="PIPELINE_ERROR",
            details=details,
        )


class NoResultsException(AIServiceException):
    """No data found for the requested filters."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="NO_RESULTS",
            details=details,
        )
