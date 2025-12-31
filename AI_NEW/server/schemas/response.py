"""Standardized API response models matching NestJS backend format."""

from typing import Any, Dict, Optional

from pydantic import BaseModel


class APIResponse(BaseModel):
    """
    Standard API response format.

    Matches the NestJS backend response structure:
    {
      "statusCode": 200,
      "message": "Success",
      "data": { ... }
    }
    """

    statusCode: int
    message: str
    data: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "statusCode": 200,
                "message": "Success",
                "data": {"result": "example"},
            }
        }


def success_response(
    data: Optional[Dict[str, Any]] = None,
    message: str = "Success",
    status_code: int = 200,
) -> Dict[str, Any]:
    """
    Create a standardized success response.

    Args:
        data: Response payload
        message: Success message
        status_code: HTTP status code (default: 200)

    Returns:
        Standardized response dictionary
    """
    return {
        "statusCode": status_code,
        "message": message,
        "data": data or {},
    }


def error_response(
    message: str,
    error_code: str = "ERROR",
    status_code: int = 500,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a standardized error response.

    Args:
        message: Error message
        error_code: Error type identifier
        status_code: HTTP status code
        details: Additional error details

    Returns:
        Standardized error response dictionary
    """
    return {
        "statusCode": status_code,
        "message": message,
        "error": error_code,
        "details": details or {},
    }
