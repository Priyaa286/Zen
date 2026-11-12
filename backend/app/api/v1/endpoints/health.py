from fastapi import APIRouter
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check (v1 API)",
    description="Returns backend health status, application version, and runtime environment."
)
async def api_v1_health() -> HealthResponse:
    """
    Versioned API health-check endpoint.
    """
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        version=settings.VERSION
    )

