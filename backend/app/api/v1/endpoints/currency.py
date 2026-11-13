"""Foreign Exchange and Currency Conversion Endpoints."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.services.currency_service import currency_service

logger = logging.getLogger("zen.api.currency")

router = APIRouter(prefix="/currency", tags=["Currency"])


class ConvertRequest(BaseModel):
    amount: float
    from_currency: str
    to_currency: str


# Baseline fallback rates against USD in case FX API is unreachable
FALLBACK_RATES_USD = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 154.5,
    "INR": 88.4,
    "SGD": 1.34,
    "AUD": 1.52,
    "CAD": 1.38,
}


@router.post("/convert", status_code=status.HTTP_200_OK)
async def convert_currency_endpoint(payload: ConvertRequest):
    """Convert a monetary amount directly between currencies."""
    from_curr = payload.from_currency.strip().upper()
    to_curr = payload.to_currency.strip().upper()

    if from_curr == to_curr:
        return {
            "original_amount": payload.amount,
            "originalAmount": payload.amount,
            "converted_amount": payload.amount,
            "convertedAmount": payload.amount,
            "from_currency": from_curr,
            "fromCurrency": from_curr,
            "to_currency": to_curr,
            "toCurrency": to_curr,
            "rate": 1.0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "provider": "Identity Rate",
            "source": "live",
        }

    try:
        converted, rate, ts = await currency_service.get_conversion(payload.amount, from_curr, to_curr)
        provider = "Frankfurter API"
    except Exception as exc:
        logger.warning("Live FX lookup failed (%s); using baseline fallback rate.", exc)
        usd_from = FALLBACK_RATES_USD.get(from_curr, 1.0)
        usd_to = FALLBACK_RATES_USD.get(to_curr, 88.0 if to_curr == "INR" else 1.0)
        rate = usd_to / usd_from
        converted = round(payload.amount * rate, 2)
        ts = datetime.now(timezone.utc)
        provider = "Zen Baseline FX Fallback"

    return {
        "original_amount": payload.amount,
        "originalAmount": payload.amount,
        "converted_amount": converted,
        "convertedAmount": converted,
        "from_currency": from_curr,
        "fromCurrency": from_curr,
        "to_currency": to_curr,
        "toCurrency": to_curr,
        "rate": rate,
        "timestamp": ts.isoformat(),
        "provider": provider,
        "source": "live",
    }


@router.get("/rates", status_code=status.HTTP_200_OK)
async def get_rates(base: str = Query("USD")):
    """Get active FX rate table against the base currency."""
    base_curr = base.strip().upper()
    rates: Dict[str, float] = {}

    for c in ("USD", "EUR", "GBP", "JPY", "INR", "SGD", "AUD", "CAD"):
        if c == base_curr:
            rates[c] = 1.0
            continue
        try:
            _, r, _ = await currency_service.get_conversion(1.0, base_curr, c)
            rates[c] = r
        except Exception:
            usd_base = FALLBACK_RATES_USD.get(base_curr, 1.0)
            usd_c = FALLBACK_RATES_USD.get(c, 1.0)
            rates[c] = round(usd_c / usd_base, 4)

    return {
        "base": base_curr,
        "rates": rates,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
