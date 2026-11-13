import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("zen.integrations.channel3")


class Channel3Error(Exception):
    """Base exception for Channel3 integration."""
    pass


class Channel3AuthError(Channel3Error):
    """Raised when authentication fails (HTTP 401 or 403)."""
    pass


class Channel3ValidationError(Channel3Error):
    """Raised when request validation fails (HTTP 422)."""
    pass


class Channel3RateLimitError(Channel3Error):
    """Raised when rate limit is exceeded (HTTP 429)."""
    pass


class Channel3TimeoutError(Channel3Error):
    """Raised when request to Channel3 times out."""
    pass


class Channel3Client:
    """
    Asynchronous client for Channel3 Product Discovery API.
    Interacts with:
    - POST /v1/search (Canonical product search)
    - GET /v1/products/{product_id} (Detailed product & retailer offers enrichment)
    using x-api-key authentication.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.CHANNEL3_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.CHANNEL3_API_KEY
        self.timeout = timeout if timeout is not None else settings.CHANNEL3_TIMEOUT

    def _get_headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        config: Optional[Dict[str, Any]] = None,
        limit: int = 20,
        page_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute product search via Channel3 POST /v1/search.
        """
        url = f"{self.base_url}/v1/search"
        headers = self._get_headers()

        payload: Dict[str, Any] = {
            "query": query,
            "limit": limit,
        }
        if filters:
            payload["filters"] = filters
        if config:
            payload["config"] = config
        if page_token:
            payload["page_token"] = page_token

        logger.info("Channel3 search request: query='%s', limit=%d", query, limit)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)

                if response.status_code in (401, 403):
                    logger.error("Channel3 authentication failed (status: %d)", response.status_code)
                    raise Channel3AuthError(
                        f"Channel3 authentication failed with status {response.status_code}. Verify CHANNEL3_API_KEY."
                    )
                if response.status_code == 422:
                    logger.error("Channel3 validation error (status: 422): %s", response.text)
                    raise Channel3ValidationError(
                        f"Channel3 request validation failed (status 422): {response.text}"
                    )
                if response.status_code == 429:
                    logger.warning("Channel3 rate limit exceeded (status: 429)")
                    raise Channel3RateLimitError("Channel3 rate limit exceeded. Please retry later.")

                response.raise_for_status()
                return response.json()

        except httpx.TimeoutException as exc:
            logger.error("Channel3 request timed out after %.1f seconds: %s", self.timeout, exc)
            raise Channel3TimeoutError(f"Channel3 request timed out after {self.timeout} seconds.") from exc

        except (Channel3AuthError, Channel3ValidationError, Channel3RateLimitError):
            raise

        except httpx.HTTPStatusError as exc:
            logger.error("Channel3 HTTP error %d: %s", exc.response.status_code, exc.response.text)
            raise Channel3Error(
                f"Channel3 returned HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc

        except httpx.RequestError as exc:
            logger.error("Channel3 connection error: %s", exc)
            raise Channel3Error(f"Network error contacting Channel3: {str(exc)}") from exc

        except Exception as exc:
            logger.error("Unexpected error contacting Channel3: %s", exc)
            raise Channel3Error(f"Unexpected error communicating with Channel3: {str(exc)}") from exc

    async def get_product(
        self,
        product_id: str,
        country: Optional[str] = None,
        currency: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch full product details and live merchant offers via GET /v1/products/{product_id}.
        """
        url = f"{self.base_url}/v1/products/{product_id}"
        headers = self._get_headers()
        params: Dict[str, str] = {}
        if country:
            params["country"] = country
        if currency:
            params["currency"] = currency
        if language:
            params["language"] = language

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    return response.json()
                logger.warning(
                    "Channel3 get_product returned status %d for product %s",
                    response.status_code,
                    product_id,
                )
                return None
        except Exception as exc:
            logger.warning("Channel3 get_product failed for product %s: %s", product_id, exc)
            return None


channel3_client = Channel3Client()
