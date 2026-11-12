from typing import Any, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """
    Standardized detailed error payload.
    """
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[Any] = Field(default=None, description="Additional context or validation errors")


class ErrorResponse(BaseModel):
    """
    Top-level standardized error envelope.
    """
    error: ErrorDetail

