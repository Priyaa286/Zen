from typing import Any, Dict, Optional, Tuple
from app.schemas.pricing_schema import CostItem

# Reference estimates for cross-border logistics when carrier API is not connected
# These are strictly flagged with status="estimated" and never presented as verified.
ESTIMATED_SHIPPING_TABLE = {
    # Destination country -> (base_amount_eur, min_days, max_days, courier_description)
    "india": (28.0, 10, 18, "Standard International Air Freight (Logistics Estimate)"),
    "in": (28.0, 10, 18, "Standard International Air Freight (Logistics Estimate)"),
    "united states": (22.0, 7, 14, "Transatlantic Standard Courier (Logistics Estimate)"),
    "usa": (22.0, 7, 14, "Transatlantic Standard Courier (Logistics Estimate)"),
    "us": (22.0, 7, 14, "Transatlantic Standard Courier (Logistics Estimate)"),
    "united kingdom": (12.0, 4, 8, "European Standard Courier (Logistics Estimate)"),
    "uk": (12.0, 4, 8, "European Standard Courier (Logistics Estimate)"),
    "germany": (5.0, 2, 4, "Domestic German Courier (Standard)"),
    "de": (5.0, 2, 4, "Domestic German Courier (Standard)"),
}


class ShippingService:
    """
    Service responsible for shipping estimation and carrier verification.
    Adheres strictly to the requirement:
    - Never invent a shipping amount and present it as verified.
    - If verified carrier API is unavailable, mark shipping as estimated or unknown.
    """

    def get_shipping_cost(
        self,
        origin_country: str,
        destination_country: str,
        source_currency: str,
        destination_currency: str,
        exchange_rate: float,
    ) -> CostItem:
        """
        Calculates shipping item with explicit verification status.
        """
        clean_dest = destination_country.strip().lower()

        if clean_dest in ESTIMATED_SHIPPING_TABLE:
            base_eur, min_d, max_d, desc = ESTIMATED_SHIPPING_TABLE[clean_dest]
            amount_dest = round(base_eur * exchange_rate, 2)
            return CostItem(
                name="International Shipping",
                amount=amount_dest,
                amount_source=base_eur,
                currency=destination_currency,
                currency_source=source_currency,
                status="estimated",
                rate_or_detail=f"{desc} (~{min_d}-{max_d} business days). Carrier quote pending at checkout.",
            )
        else:
            return CostItem(
                name="International Shipping",
                amount=None,
                amount_source=None,
                currency=destination_currency,
                currency_source=source_currency,
                status="unknown",
                rate_or_detail="Carrier quote unavailable for destination country. Must be verified with merchant.",
            )


shipping_service = ShippingService()

