import enum
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.pricing_schema import CostItem


class OrderStatus(str, enum.Enum):
    QUOTED = "QUOTED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAID = "PAID"
    FULFILLMENT_PENDING = "FULFILLMENT_PENDING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    CANCELLED = "CANCELLED"
    QUOTE_EXPIRED = "QUOTE_EXPIRED"


# Valid state transitions
VALID_STATE_TRANSITIONS: Dict[OrderStatus, List[OrderStatus]] = {
    OrderStatus.QUOTED: [OrderStatus.AWAITING_APPROVAL, OrderStatus.QUOTE_EXPIRED, OrderStatus.CANCELLED],
    OrderStatus.AWAITING_APPROVAL: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED, OrderStatus.QUOTE_EXPIRED],
    OrderStatus.PAYMENT_PENDING: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
    OrderStatus.PAID: [OrderStatus.FULFILLMENT_PENDING, OrderStatus.CANCELLED],
    OrderStatus.FULFILLMENT_PENDING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [],
    OrderStatus.PAYMENT_FAILED: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
    OrderStatus.CANCELLED: [],
    OrderStatus.QUOTE_EXPIRED: [],
}


class OrderRecord(BaseModel):
    """
    Persisted order entity in Zen.
    """
    order_id: str = Field(..., description="Internal Zen order reference, e.g. ord_abc123")
    quote_id: str = Field(..., description="Associated LandedCostQuote ID")
    product_id: str = Field(..., description="Canonical product ID")
    product_title: str = Field(..., description="Product title")
    merchant: Optional[str] = Field(default=None, description="Merchant domain/name")
    merchant_url: Optional[str] = Field(default=None, description="Merchant store link")
    
    # Financial fields
    product_price_source: float = Field(..., description="Price in source currency")
    source_currency: str = Field(..., description="Source currency code")
    destination_currency: str = Field(..., description="Destination currency code")
    exchange_rate: float = Field(..., description="Exchange rate applied")
    destination_country: str = Field(..., description="Buyer destination country")
    
    # Itemized Breakdown
    cost_breakdown: List[CostItem] = Field(default_factory=list, description="Itemized cost components")
    
    # Payable amount (explicitly what the buyer is charged at checkout)
    payable_amount: float = Field(..., description="Total payable amount charged via PayPal")
    estimated_total_cost: Optional[float] = Field(default=None, description="Total estimated landed cost")
    
    # PayPal transaction references
    paypal_order_id: Optional[str] = Field(default=None, description="PayPal v2 Order ID")
    paypal_capture_id: Optional[str] = Field(default=None, description="PayPal payment capture transaction ID")
    
    # State tracking
    status: OrderStatus = Field(default=OrderStatus.QUOTED, description="Current lifecycle state")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def can_transition_to(self, new_status: OrderStatus) -> bool:
        """
        Check if state transition is allowed.
        """
        allowed = VALID_STATE_TRANSITIONS.get(self.status, [])
        return new_status in allowed


class PaymentRecord(BaseModel):
    """
    Persisted payment transaction record.
    """
    payment_id: str = Field(..., description="Internal payment ID, e.g. pay_xyz123")
    order_id: str = Field(..., description="Associated Zen internal order ID")
    paypal_order_id: str = Field(..., description="PayPal Order ID")
    paypal_capture_id: Optional[str] = Field(default=None, description="PayPal Capture ID")
    amount: float = Field(..., description="Charged payment amount")
    currency: str = Field(..., description="Currency code")
    status: str = Field(..., description="Payment status: CREATED, APPROVED, COMPLETED, FAILED")
    idempotency_key: Optional[str] = Field(default=None, description="Client idempotency key if provided")
    raw_capture_response: Optional[Dict[str, Any]] = Field(default=None, description="Raw PayPal response")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

