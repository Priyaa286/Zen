"""Enterprise security, request tracing, rate limiting, and defensive middleware."""

from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict
from typing import Callable, Dict, List, Tuple

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("zen.core.middleware")

# Content Security Policy configured to permit essential PayPal JS SDK, fonts, and assets
CSP_HEADER_VALUE = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' data: https://fonts.gstatic.com; "
    "img-src 'self' data: blob: https:; "
    "connect-src 'self' https://api-m.sandbox.paypal.com https://api-m.paypal.com https://api.frankfurter.dev; "
    "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self';"
)

MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024  # 10 MB global ceiling


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces modern browser security headers recommended by OWASP & NIST:
    - Protection against MIME confusion (X-Content-Type-Options: nosniff)
    - Clickjacking mitigation (X-Frame-Options: SAMEORIGIN)
    - Cross-site scripting filtering (X-XSS-Protection: 1; mode=block)
    - Referrer leakage limitation (Referrer-Policy: strict-origin-when-cross-origin)
    - Hardware permissions confinement (Permissions-Policy)
    - Transport Layer Security (Strict-Transport-Security: HSTS)
    - Content-Security-Policy (CSP)
    - Anti-caching directives on sensitive authentication and payment routes
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Baseline OWASP headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = CSP_HEADER_VALUE

        # Anti-caching on authentication, checkout, and account profile endpoints
        path = request.url.path
        if any(path.startswith(prefix) for prefix in ("/api/auth", "/api/checkout", "/api/payments", "/api/users")):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"

        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Assigns an immutable, unique UUID tracking identifier (X-Request-ID) to every
    inbound request. Propagates it through request.state and down to client response headers.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = req_id

        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
        return response


class InMemoryRateLimiter:
    """
    Sliding-window in-memory rate limiter per client IP address.
    Configured for sensitive authentication, payment, AI, and upload routes.
    """

    def __init__(self):
        # Maps endpoint_prefix -> (max_requests, window_seconds)
        self.limits: Dict[str, Tuple[int, int]] = {
            "/api/auth/login": (30, 60),            # 30 login attempts / min
            "/api/auth/register": (20, 60),         # 20 registrations / min
            "/api/auth/forgot-password": (10, 60),  # 10 resets / min
            "/api/checkout/create": (40, 60),       # 40 checkout creations / min
            "/api/payments/create": (40, 60),
            "/api/agent/chat": (60, 60),            # 60 AI chats / min
            "/api/upload": (30, 60),                # 30 file uploads / min
        }
        self.history: Dict[str, List[float]] = defaultdict(list)

    def is_rate_limited(self, client_ip: str, path: str) -> Tuple[bool, int]:
        now = time.time()
        for route_prefix, (max_reqs, window_sec) in self.limits.items():
            if path.startswith(route_prefix):
                key = f"{client_ip}:{route_prefix}"
                cutoff = now - window_sec
                self.history[key] = [t for t in self.history[key] if t > cutoff]

                if len(self.history[key]) >= max_reqs:
                    retry_after = int(window_sec - (now - self.history[key][0]))
                    return True, max(retry_after, 1)

                self.history[key].append(now)
                break
        return False, 0


rate_limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Enforces progressive rate limiting on sensitive API endpoints."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path

        # Check content-length header to prevent request body exhaustion
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                cl_int = int(content_length)
                if cl_int > MAX_REQUEST_BODY_BYTES:
                    logger.warning("Rejected oversized payload (%d bytes) from %s", cl_int, client_ip)
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": {
                                "code": "REQUEST_ENTITY_TOO_LARGE",
                                "message": f"Request body exceeds maximum permitted ceiling of {MAX_REQUEST_BODY_BYTES // (1024*1024)} MB.",
                            }
                        },
                    )
            except ValueError:
                pass

        is_limited, retry_after = rate_limiter.is_rate_limited(client_ip, path)
        if is_limited:
            logger.warning("Rate limit exceeded on %s by %s (retry-after: %ds)", path, client_ip, retry_after)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please throttle your requests and try again later.",
                        "retry_after_seconds": retry_after,
                    }
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
