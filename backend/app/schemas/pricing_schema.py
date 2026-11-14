from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CostItem(BaseModel):
    """
    Individual line item in the landed cost breakdown.
    """
    name: str = Field(..., description="Cost component name e.g. Product Base, Shipping, Customs Duty, Import Tax")
    amount: Optional[float] = Field(default=None, description="Amount in destination currency (null if unknown)")
    amount_source: Optional[float] = Field(default=None, description="Amount in source currency (null if unknown)")
    currency: str = Field(..., description="Destination currency code")
    currency_source: str = Field(..., description="Source currency code")
    status: str = Field(..., description="Verification status: 'verified', 'estimated', or 'unknown'")
    rate_or_detail: Optional[str] = Field(default=None, description="Explanatory rate or formula basis")


class LandedCostRequest(BaseModel):
    """
    Request payload to calculate landed cost.
    The frontend supplies product_id, optional offer_url, destination country and target currency.
    Prices are NOT trusted from frontend; they are fetched directly from trusted backend sources.
    """
    product_id: str = Field(..., description="Channel3 canonical product ID")
    offer_url: Optional[str] = Field(default=None, description="Specific merchant offer URL to calculate quote for")
    destination_country: str = Field(default="India", description="Destination country name or ISO code")
    destination_currency: str = Field(default="INR", description="Destination ISO currency code e.g. INR, USD, EUR")


class LandedCostQuote(BaseModel):
    """
    Server-side quote record for international purchase.
    Used for phase 5 checkout and guarantee of transparent pricing.
    """
    quote_id: str = Field(..., description="Unique server-generated quote reference")
    product_id: str = Field(..., description="Product ID")
    product_title: str = Field(..., description="Product title")
    merchant: Optional[str] = Field(default=None, description="Merchant domain / identity")
    merchant_url: Optional[str] = Field(default=None, description="Merchant buy URL")
    
    # Currency conversion
    source_currency: str = Field(..., description="Source merchant offer currency code e.g. EUR")
    destination_currency: str = Field(..., description="Target buyer currency code e.g. INR")
    exchange_rate: float = Field(..., description="Applied FX exchange rate (1 source = X destination)")
    rate_timestamp: datetime = Field(..., description="Timestamp of the exchange rate quote")
    
    # Product base
    product_price_source: float = Field(..., description="Verified product price in source currency")
    product_price_converted: float = Field(..., description="Product price converted into destination currency")
    
    # Line items
    breakdown: List[CostItem] = Field(default_factory=list, description="Itemized cost components")
    
    # Totals
    total_estimated_cost: Optional[float] = Field(default=None, description="Total estimated cost in destination currency (null if essential charges unknown)")
    total_is_exact: bool = Field(default=False, description="True ONLY if all components (shipping, duty, taxes) are verified")
    paypal_settlement_currency: Optional[str] = Field(default="USD", description="Settlement currency for PayPal")
    paypal_settlement_amount: Optional[float] = Field(default=None, description="Settlement amount for PayPal")
    
    # Timing & Validity
    created_at: datetime = Field(..., description="Quote generation timestamp")
    expires_at: datetime = Field(..., description="Quote expiration timestamp (e.g. 15 minutes)")
    
    # Disclaimers
    assumptions: List[str] = Field(default_factory=list, description="List of assumptions and customs/shipping disclaimers")
    warnings: List[str] = Field(default_factory=list, description="Warnings if components remain unverified or estimated")

