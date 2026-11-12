import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


CURRENCY_MAP = {
    "€": "EUR",
    "EURO": "EUR",
    "EUROS": "EUR",
    "$": "USD",
    "US$": "USD",
    "DOLLAR": "USD",
    "DOLLARS": "USD",
    "₹": "INR",
    "RS": "INR",
    "RS.": "INR",
    "RUPEE": "INR",
    "RUPEES": "INR",
    "£": "GBP",
    "POUND": "GBP",
    "POUNDS": "GBP",
    "¥": "JPY",
    "YEN": "JPY",
    "C$": "CAD",
    "A$": "AUD",
    "SG$": "SGD",
}


def normalize_currency_code(val: Optional[str]) -> Optional[str]:
    """
    Standardize currency representation into an ISO-4217 3-letter code.
    - Normalizes case, whitespace, symbols, and aliases.
    - Preserves valid 3-letter ISO codes (e.g. EUR, USD, INR, GBP, JPY, CAD).
    - If empty, missing, or unrecognized, returns None (no silent assumptions).
    """
    if val is None:
        return None
    cleaned = str(val).strip().upper()
    if not cleaned:
        return None

    # Check direct aliases and symbol map
    if cleaned in CURRENCY_MAP:
        return CURRENCY_MAP[cleaned]

    # Validate standard 3-letter ISO alphabetic code
    if re.fullmatch(r"^[A-Z]{3}$", cleaned):
        return cleaned

    # Invalid / ambiguous currency format
    return None


class Destination(BaseModel):
    """
    Destination country and city for product shipment.
    """
    city: Optional[str] = Field(default=None, description="Destination city")
    country: Optional[str] = Field(default=None, description="Destination country")


class Budget(BaseModel):
    """
    Budget constraint and currency.
    """
    amount: Optional[float] = Field(default=None, description="Maximum budget amount")
    currency: Optional[str] = Field(default=None, description="Currency code, e.g. INR, USD, EUR")

    @field_validator("amount", mode="before")
    @classmethod
    def validate_amount(cls, v: Any) -> Optional[float]:
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            # Clean possible comma/currency symbol in string representation e.g. "8,000"
            clean_str = re.sub(r"[^\d.]", "", v)
            if clean_str:
                return float(clean_str)
        return None

    @field_validator("currency", mode="before")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        return normalize_currency_code(v)


class ShoppingRequirements(BaseModel):
    """
    Parsed shopping requirements from natural-language query.
    """
    product: Optional[str] = Field(default=None, description="Requested product or item")
    origin_country: Optional[str] = Field(default=None, description="Country of origin / manufacturing")
    destination: Optional[Destination] = Field(default=None, description="Delivery destination")
    budget: Optional[Budget] = Field(default=None, description="Budget cap and currency")
    delivery_deadline_days: Optional[int] = Field(default=None, description="Delivery window in days")
    preferences: List[str] = Field(default_factory=list, description="Specific preferences (material, color, style, etc.)")

    @field_validator("delivery_deadline_days", mode="before")
    @classmethod
    def validate_delivery_deadline(cls, v: Any) -> Optional[int]:
        if v is None or v == "":
            return None
        try:
            val = int(v)
            return val if val > 0 else None
        except (ValueError, TypeError):
            return None


class ChatRequest(BaseModel):
    """
    Chat message payload from the user.
    """
    message: str = Field(..., min_length=1, description="User's natural language shopping query")


class ChatResponse(BaseModel):
    """
    Validated assistant response with extracted requirements.
    """
    message: str = Field(..., description="Assistant response or summary message")
    requirements: Optional[ShoppingRequirements] = Field(default=None, description="Extracted shopping requirements")
    missing_information: List[str] = Field(default_factory=list, description="List of required shopping parameters still missing")
    status: str = Field(default="success", description="Status of the request: success, partial, or error")
