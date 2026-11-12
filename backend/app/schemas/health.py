from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Standard schema for system health responses.
    """
    status: str = Field(default="healthy", description="Current health status of the backend service")
    app_name: str = Field(..., description="Application name")
    environment: str = Field(..., description="Active runtime environment")
    version: str = Field(..., description="Application version")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of health check")

