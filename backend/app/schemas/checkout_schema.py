"""Schemas for checkout and PayPal payment flow.

These models are used by the FastAPI checkout endpoints (Phase 5) and the
internal payment service. They purposefully avoid exposing any internal or
secret information – only the data required for the client or the AI agent
is included.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, validator


class CreateOrderItem(BaseModel):
    """A single line‑item that will be sent to PayPal.

    The AI orchestrator builds these from the landed‑cost quote. The
    ``price`` must be expressed in the *destination* currency because that is
    what the buyer will be charged.
    """

    name: str = Field(..., description="Item name / product title")
    sku: Optional[str] = Field(None, description="Stock‑keeping unit or product identifier")
    unit_amount: float = Field(..., description="Price per unit in destination currency")
    currency: str = Field(..., description="ISO 4217 currency code, e.g. EUR")
    quantity: int = Field(..., ge=1, description="Number of units being purchased")

    @validator("unit_amount")
    def non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("unit_amount must be non‑negative")
        return v


class CreateOrderRequest(BaseModel):
    """Request payload for ``POST /payments/create``.

    ``quote_id`` links the payment to a previously generated landed‑cost quote.
    ``return_url`` and ``cancel_url`` are URLs the user will be redirected to
    after approving or cancelling the PayPal checkout.
    """

    quote_id: str = Field(..., description="Internal Zen quote identifier, e.g. q_abc123")
    return_url: str = Field(..., description="URL to return the user after successful PayPal approval")
    cancel_url: str = Field(..., description="URL to return the user if they cancel the PayPal flow")
    # Optional explicit idempotency key for the creation request – useful for retries.
    idempotency_key: Optional[str] = Field(
        None, description="Client supplied idempotency key for safe retries"
    )

    @validator("return_url", "cancel_url")
    def must_be_http(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class CreateOrderResponse(BaseModel):
    """Response returned after a PayPal order is created.

    ``paypal_order_id`` is stored in the ``OrderRecord``. ``approval_url`` is a
    one‑time URL that the frontend should open in a new tab/window for the
    customer to approve the payment.
    """

    paypal_order_id: str = Field(..., description="PayPal v2 order identifier")
    approval_url: str = Field(..., description="URL the client must redirect the buyer to for approval")
    status: str = Field(..., description="PayPal order creation status – usually 'CREATED'")
    payable_amount: Optional[float] = Field(None, description="Actual transaction amount sent to PayPal")
    currency: Optional[str] = Field(None, description="Transaction currency sent to PayPal, e.g. EUR")


class CaptureOrderRequest(BaseModel):
    """Payload for ``POST /payments/capture``.

    ``order_id`` refers to the Zen internal order (not the PayPal order). The
    service will look up the associated PayPal order internally.
    """

    order_id: str = Field(..., description="Zen internal order identifier, e.g. ord_abc123")
    # Optional idempotency key – PayPal requires the same key for safe retries.
    idempotency_key: Optional[str] = Field(
        None, description="Idempotency key for the capture request"
    )


class CaptureOrderResponse(BaseModel):
    """Result of a successful PayPal capture.

    ``paypal_capture_id`` is stored in ``PaymentRecord``. ``status`` mirrors the
    PayPal capture status (e.g. ``COMPLETED``).
    """

    paypal_capture_id: str = Field(..., description="PayPal capture transaction identifier")
    status: str = Field(..., description="Capture status returned by PayPal, e.g. COMPLETED")
    amount: float = Field(..., description="Captured amount in destination currency")
    currency: str = Field(..., description="ISO 4217 currency code of the captured amount")
    raw_response: Optional[dict] = Field(
        None, description="Full PayPal capture JSON for debugging/audit purposes"
    )


class OrderStatusResponse(BaseModel):
    """Minimal view of an order's current lifecycle state.

    Used by ``GET /payments/{order_id}`` to let the client poll for progress.
    """

    order_id: str = Field(..., description="Zen internal order identifier")
    status: str = Field(..., description="Current order state, e.g. PAYMENT_PENDING, PAID")
    payable_amount: Optional[float] = Field(
        None, description="Amount the buyer is expected to pay (destination currency)"
    )
    currency: Optional[str] = Field(None, description="Currency of the payable amount")
    paypal_order_id: Optional[str] = Field(None, description="Associated PayPal order identifier")
    paypal_capture_id: Optional[str] = Field(None, description="Associated PayPal capture identifier, if any")

