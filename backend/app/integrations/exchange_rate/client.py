from datetime import datetime, timezone
import logging
from typing import Dict, Optional, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger("zen.integrations.exchange_rate")


class FXError(Exception):
    """Base exception for FX operations."""
    pass


class FXTimeoutError(FXError):
    """Raised when FX provider times out."""
    pass


class FXRateUnavailableError(FXError):
    """Raised when an FX rate cannot be obtained."""
    pass


class ExchangeRateClient:
    """
    Asynchronous client for real-time exchange rates.
    Uses configurable FX provider (e.g. Frankfurter API) with caching and rate timestamps.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        cache_ttl_seconds: Optional[int] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.FX_PROVIDER_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.FX_PROVIDER_API_KEY
        self.cache_ttl = cache_ttl_seconds if cache_ttl_seconds is not None else settings.FX_CACHE_TTL_SECONDS
        self.timeout = timeout if timeout is not None else settings.FX_TIMEOUT
        self._cached_rates: Dict[str, Dict[str, float]] = {}
        self._cached_timestamps: Dict[str, datetime] = {}

    async def get_latest_rates(self, base_currency: str = "EUR") -> Tuple[Dict[str, float], datetime]:
        """
        Fetch latest rates for a base currency from the configured FX provider.
        Returns:
            Tuple of (rates_dict, rate_timestamp)
        """
        base = base_currency.strip().upper()
        now = datetime.now(timezone.utc)

        # Check in-memory cache
        if base in self._cached_rates and base in self._cached_timestamps:
            cached_time = self._cached_timestamps[base]
            age_seconds = (now - cached_time).total_seconds()
            if age_seconds < self.cache_ttl:
                return self._cached_rates[base], cached_time

        url = f"{self.base_url}/latest?from={base}"
        headers: Dict[str, str] = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    rates = data.get("rates", {})
                    rates[base] = 1.0

                    # Parse rate date if provided, else use current UTC timestamp
                    rate_date_str = data.get("date")
                    if rate_date_str:
                        try:
                            rate_dt = datetime.fromisoformat(rate_date_str).replace(tzinfo=timezone.utc)
                        except Exception:
                            rate_dt = now
                    else:
                        rate_dt = now

                    self._cached_rates[base] = rates
                    self._cached_timestamps[base] = rate_dt
                    logger.info("Refreshed FX rates from provider for base %s", base)
                    return rates, rate_dt
                else:
                    logger.error("FX provider returned status %d: %s", response.status_code, response.text)
                    raise FXError(f"FX provider error (HTTP {response.status_code})")

        except httpx.TimeoutException as exc:
            logger.error("FX provider request timed out after %.1f seconds", self.timeout)
            raise FXTimeoutError(f"FX provider timed out after {self.timeout} seconds") from exc
        except httpx.RequestError as exc:
            logger.error("Network error contacting FX provider: %s", exc)
            raise FXError(f"Network error contacting FX provider: {str(exc)}") from exc

    async def convert(
        self,
        amount: float,
        from_currency: str,
        to_currency: str,
    ) -> Tuple[float, float, datetime]:
        """
        Convert an amount from from_currency to to_currency using live FX rates.
        Returns:
            Tuple of (converted_amount, exchange_rate, rate_timestamp)
        """
        from_curr = from_currency.strip().upper()
        to_curr = to_currency.strip().upper()

        if from_curr == to_curr:
            now = datetime.now(timezone.utc)
            return round(amount, 2), 1.0, now

        rates, rate_time = await self.get_latest_rates(base_currency=from_curr)
        if to_curr not in rates:
            raise FXRateUnavailableError(f"No FX rate available for conversion from {from_curr} to {to_curr}")

        rate = rates[to_curr]
        converted = round(amount * rate, 2)
        return converted, rate, rate_time


exchange_rate_client = ExchangeRateClient()
