from datetime import datetime
import logging
from typing import Optional, Tuple
from app.integrations.exchange_rate.client import (
    ExchangeRateClient,
    FXError,
    FXRateUnavailableError,
    FXTimeoutError,
    exchange_rate_client,
)
from app.schemas.chat import normalize_currency_code

logger = logging.getLogger("zen.services.currency")


class CurrencyService:
    """
    Service responsible for converting monetary amounts using verified FX rates.
    """

    def __init__(self, client: Optional[ExchangeRateClient] = None):
        self.client = client or exchange_rate_client

    async def get_conversion(
        self,
        amount: float,
        source_currency: str,
        destination_currency: str,
    ) -> Tuple[float, float, datetime]:
        """
        Convert an amount from source to destination currency.
        Normalizes currency codes and calls the real FX client.
        
        Returns:
            (converted_amount, exchange_rate, rate_timestamp)
        """
        src = normalize_currency_code(source_currency)
        dest = normalize_currency_code(destination_currency)

        if not src or not dest:
            raise FXError(f"Invalid currency code: source='{source_currency}', destination='{destination_currency}'")

        return await self.client.convert(amount, src, dest)


currency_service = CurrencyService()

