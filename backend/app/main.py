from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.schemas.error import ErrorDetail, ErrorResponse
from app.schemas.health import HealthResponse

# Initialize logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager for startup and shutdown events.
    """
    logger.info("Starting up %s (version: %s, env: %s)...", settings.APP_NAME, settings.VERSION, settings.ENVIRONMENT)
    try:
        from app.database.init_db import on_startup
        await on_startup()
    except Exception as exc:
        logger.error("Database startup failed: %s", exc)
    yield
    try:
        from app.database.init_db import on_shutdown
        await on_shutdown()
    except Exception as exc:
        logger.error("Database shutdown failed: %s", exc)
    logger.info("Shutting down %s...", settings.APP_NAME)


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Zen Cross-Border AI Shopping Agent Backend - PayPal AI Hackathon 2026",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Centralized Error Handling ---

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handles HTTP exceptions with a standardized error response schema.
    """
    logger.warning("HTTP %d error on %s: %s", exc.status_code, request.url.path, exc.detail)
    error_payload = ErrorResponse(
        error=ErrorDetail(
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            details=None
        )
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload.model_dump(mode="json")
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handles request validation errors from Pydantic.
    """
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    error_payload = ErrorResponse(
        error=ErrorDetail(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details=exc.errors()
        )
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_payload.model_dump(mode="json")
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handles all unexpected server errors gracefully.
    """
    logger.exception("Unhandled server error processing %s: %s", request.url.path, str(exc))
    error_payload = ErrorResponse(
        error=ErrorDetail(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected internal server error occurred."
        )
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_payload.model_dump(mode="json")
    )


# --- Endpoints ---

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check (Root)",
    tags=["Health"],
    description="Root-level health check endpoint for load balancers and orchestrators."
)
async def root_health() -> HealthResponse:
    """
    Root-level health-check endpoint.
    """
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        version=settings.VERSION
    )


# Include API v1 router under the configured prefix (e.g. /api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)

