"""
Schemas for the AI shopping agent orchestration API (Phase 6).

The /agent/shop endpoint accepts a natural-language shopping request and returns
a structured response containing: extracted requirements, ranked product results
with landed-cost quotes, a recommended product, and (after buyer approval) a
PayPal checkout order.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.chat import ShoppingRequirements
from app.schemas.pricing_schema import LandedCostQuote
from app.schemas.product_schema import NormalizedProduct


class ShopRequest(BaseModel):
    """Natural-language shopping request submitted to the AI agent."""
    message: str = Field(
        ...,
        min_length=1,
        description="User's natural-language shopping request",
    )
    destination_currency: str = Field(
        default="INR",
        description="Destination (buyer) currency code, e.g. INR, USD, GBP",
    )
    destination_country: str = Field(
        default="India",
        description="Buyer's destination country for shipping and customs estimation",
    )
    # Explicit buyer approval of a previously-returned quote
    approve_quote_id: Optional[str] = Field(
        default=None,
        description=(
            "Quote ID to approve for checkout. When set, the agent creates a "
            "PayPal order for this quote. return_url and cancel_url are required."
        ),
    )
    return_url: Optional[str] = Field(
        default=None,
        description="Redirect URL after PayPal buyer approval (required with approve_quote_id)",
    )
    cancel_url: Optional[str] = Field(
        default=None,
        description="Redirect URL if buyer cancels (required with approve_quote_id)",
    )


class RankedProduct(BaseModel):
    """A product result with its associated landed-cost quote and ranking metadata."""
    rank: int = Field(..., description="Rank in the results list (1 = best match)")
    product: NormalizedProduct = Field(..., description="Normalized product data")
    quote: Optional[LandedCostQuote] = Field(
        default=None,
        description="Landed cost quote for this product",
    )
    quote_error: Optional[str] = Field(
        default=None,
        description="Error message if quote calculation failed",
    )
    is_recommended: bool = Field(default=False)
    ranking_note: Optional[str] = Field(default=None)


class CheckoutResult(BaseModel):
    """Result of initiating a PayPal checkout order after buyer approval."""
    paypal_order_id: str = Field(..., description="PayPal order identifier")
    approval_url: str = Field(..., description="URL the buyer must visit to approve payment")
    payable_amount: float = Field(..., description="Amount the buyer will be charged in the PayPal transaction")
    currency: str = Field(..., description="Currency of the PayPal transaction (e.g. EUR)")
    quote_id: str = Field(..., description="Zen quote ID this order is linked to")
    status: str = Field(default="CREATED")
    safety_note: str = Field(
        default="",
        description="Financial safety note explaining what is included in the charge",
    )
    destination_currency: Optional[str] = Field(
        default=None,
        description="Customer destination currency (e.g. INR) used for landed cost display",
    )
    estimated_landed_cost: Optional[float] = Field(
        default=None,
        description="Estimated customer landed cost in destination currency (disclosed separately)",
    )


class BudgetStatus(BaseModel):
    """
    Distinguishes product base price budget from estimated landed-cost budget.
    """
    budget_amount: Optional[float] = Field(default=None, description="User stated budget cap")
    budget_currency: Optional[str] = Field(default=None, description="Budget currency code")
    product_price_in_budget: Optional[bool] = Field(
        default=None,
        description="Whether top product base price is within stated budget",
    )
    landed_cost_in_budget: Optional[bool] = Field(
        default=None,
        description="Whether total estimated landed cost is within stated budget",
    )
    explanation: str = Field(
        default="",
        description="Clear disclosure distinguishing base price from shipping/customs landed cost",
    )


class ShopResponse(BaseModel):
    """
    Full response from the /agent/shop endpoint.

    status values:
    - 'needs_info'  → AI extracted partial requirements; missing_information is populated
    - 'results'     → Products and quotes returned; awaiting buyer selection/approval
    - 'checkout'    → Buyer approved a quote; checkout contains PayPal order details
    - 'error'       → Unrecoverable error
    """
    status: str = Field(..., description="needs_info | results | checkout | error")
    message: str = Field(..., description="Human-readable summary or assistant message")

    requirements: Optional[ShoppingRequirements] = Field(default=None)
    missing_information: List[str] = Field(default_factory=list)

    products: List[RankedProduct] = Field(default_factory=list)
    alternative_products: List[RankedProduct] = Field(default_factory=list)
    total_products_found: int = Field(default=0)

    budget_status: Optional[BudgetStatus] = Field(
        default=None,
        description="Distinction between product-price budget and landed-cost budget",
    )

    checkout: Optional[CheckoutResult] = Field(default=None)

    search_query_used: Optional[str] = Field(default=None)
    warnings: List[str] = Field(default_factory=list)

