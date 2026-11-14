"""Payment service – orchestrates PayPal order creation and capture.

Architecture:
- SQLite with SQLAlchemy async & repository layer is the authoritative persistent store.
- Validates quote authenticity, expiration, and financial breakdown before calling PayPal.
- Separates verified product price from estimated shipping/customs duties:
  The payable checkout charge sent to PayPal is strictly based on verified retailer pricing,
  protecting the buyer from being automatically charged estimated/unverified sums.
- Enforces idempotency for payment captures.
- Transitions order statuses: QUOTED -> PAYMENT_PENDING -> PAID / PAYMENT_FAILED.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlalchemy import select as _sa_select

from app.core.config import settings
from app.database.connection import AsyncSessionLocal
from app.database.models import OrderORM, PaymentORM, QuoteORM
from app.integrations.paypal.client import paypal_client
from app.models.order import OrderStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.quote_repository import QuoteRepository
from app.schemas.checkout_schema import (
    CaptureOrderRequest,
    CaptureOrderResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    OrderStatusResponse,
)
from app.services.pricing_service import PricingService, pricing_service

logger = logging.getLogger("zen.services.payment")


class PaymentError(Exception):
    """Base exception for payment-related failures."""
    def __init__(self, message: str, status_code: int = 400, error_code: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code


# PayPal supported decimal precision map
# Standard currencies use 2 decimal places. Currencies like JPY, TWD, HUF use 0 decimal places.
ZERO_DECIMAL_CURRENCIES = {"JPY", "HUF", "TWD"}


def round_for_currency(amount: float, currency: str) -> float:
    """Round amount according to the currency's supported decimal precision for PayPal."""
    curr = currency.upper().strip()
    if curr in ZERO_DECIMAL_CURRENCIES:
        return float(round(amount))
    return round(amount, 2)


class PaymentService:
    """High-level service used by FastAPI endpoints and the AI shopping agent."""

    def __init__(self, p_service: Optional[PricingService] = None):
        self.pricing_service = p_service or pricing_service

    async def _get_db_repos(self):
        """Helper to get async session and repositories."""
        import app.database.connection as db_conn
        if db_conn.AsyncSessionLocal is None:
            db_conn.init_engine()
        session = db_conn.AsyncSessionLocal()
        return (
            QuoteRepository(session),
            OrderRepository(session),
            PaymentRepository(session),
            session,
        )

    # ------------------------------------------------------------------
    # 1. Order creation
    # ------------------------------------------------------------------
    async def create_order(self, req: CreateOrderRequest) -> CreateOrderResponse:
        """
        Create a PayPal order corresponding to a verified LandedCostQuote.
        
        Financial Safety:
        - Quote must exist and be valid (not expired).
        - If total_is_exact is True, all components were verified; payable amount is total_estimated_cost.
        - If total_is_exact is False, shipping or duties are estimated/unknown. The buyer cannot be
          charged estimated customs/shipping as guaranteed charges. The payable deposit/checkout charge
          defaults to the verified product price (product_price_converted).
        """
        quote = await self.pricing_service.get_quote(req.quote_id)
        if not quote:
            raise PaymentError(f"Quote '{req.quote_id}' is invalid or expired.", status_code=404, error_code="QUOTE_NOT_FOUND")

        # Determine safe transaction amount & currency for PayPal.
        # Rule: Use the disclosed settlement currency (e.g. USD) when target currency is unsupported
        # by PayPal (e.g. INR), matching the frontend PayPal JS SDK configuration.
        # If quote specifies paypal_settlement_currency and paypal_settlement_amount, prioritize them.
        settlement_curr = getattr(quote, "paypal_settlement_currency", None)
        settlement_amt = getattr(quote, "paypal_settlement_amount", None)

        if settlement_curr and settlement_amt is not None and settlement_amt > 0:
            paypal_currency = settlement_curr.upper().strip()
            if paypal_currency == "INR":
                paypal_currency = "USD"
            base_amount = settlement_amt
        else:
            raw_currency = (quote.source_currency or "EUR").upper().strip()
            if raw_currency == "INR":
                paypal_currency = "EUR"
            else:
                paypal_currency = raw_currency

            if quote.total_is_exact and quote.total_estimated_cost is not None and quote.total_estimated_cost > 0 and quote.destination_currency.upper() == paypal_currency:
                base_amount = quote.total_estimated_cost
            elif quote.product_price_source > 0:
                base_amount = quote.product_price_source
            elif quote.product_price_converted > 0 and quote.exchange_rate > 0:
                base_amount = quote.product_price_converted / quote.exchange_rate
            else:
                raise PaymentError("Unable to safely determine payable amount from verified quote.", status_code=422, error_code="INVALID_QUOTE_AMOUNT")

        payable_amount = round_for_currency(base_amount, paypal_currency)

        # Build order reference and persist initially in DB as AWAITING_APPROVAL / PAYMENT_PENDING
        internal_order_id = f"ord_{uuid.uuid4().hex[:12]}"

        # Call PayPal v2 Checkout API
        try:
            paypal_resp = await paypal_client.create_order(
                amount=payable_amount,
                currency=paypal_currency,
                reference_id=internal_order_id,
                description=f"Zen Checkout: {quote.product_title[:60]}",
                return_url=req.return_url,
                cancel_url=req.cancel_url,
            )
        except Exception as exc:
            logger.error("PayPal API order creation failed: %s", exc)
            err_msg = str(exc)
            err_code = getattr(exc, "error_code", None) or "PAYPAL_CREATION_FAILED"
            status_code = getattr(exc, "status_code", None) or 502
            raise PaymentError(f"PayPal order creation failed: {err_msg}", status_code=status_code, error_code=err_code) from exc

        paypal_order_id = paypal_resp.get("id")
        links = paypal_resp.get("links", [])
        approval_url = next(
            (link.get("href") for link in links if link.get("rel") == "approve"),
            None,
        )

        if not paypal_order_id or not approval_url:
            raise PaymentError("PayPal response missing required order ID or approval link.", status_code=502, error_code="PAYPAL_RESPONSE_INVALID")

        # Persist order in SQLite database with the actual transaction currency & amount
        quote_repo, order_repo, payment_repo, session = await self._get_db_repos()
        try:
            await order_repo.create(
                internal_order_id=internal_order_id,
                quote_id=quote.quote_id,
                payable_amount=payable_amount,
                currency=paypal_currency,
                status=OrderStatus.PAYMENT_PENDING.value,
                paypal_order_id=paypal_order_id,
            )
        finally:
            await session.close()

        logger.info(
            "Created Zen order %s linked to PayPal order %s (payable: %s %s)",
            internal_order_id,
            paypal_order_id,
            payable_amount,
            paypal_currency,
        )

        return CreateOrderResponse(
            paypal_order_id=paypal_order_id,
            approval_url=approval_url,
            status=paypal_resp.get("status", "CREATED"),
            payable_amount=payable_amount,
            currency=paypal_currency,
        )

    # ------------------------------------------------------------------
    # 2. Capture payment
    # ------------------------------------------------------------------
    async def capture_order(self, req: CaptureOrderRequest) -> CaptureOrderResponse:
        """
        Capture payment for an approved order.
        Idempotent: Duplicate requests return existing capture without recharging.
        """
        quote_repo, order_repo, payment_repo, session = await self._get_db_repos()
        try:
            order = await order_repo.get(req.order_id)
            if not order:
                # Also allow lookup by paypal_order_id if the frontend passed that
                order = await order_repo.get_by_paypal_order_id(req.order_id)

            if not order:
                raise PaymentError(f"Order '{req.order_id}' was not found.")

            if not order.paypal_order_id:
                raise PaymentError(f"Order '{order.internal_order_id}' has no associated PayPal order ID.")

            # Idempotency check 1: Client idempotency key
            if req.idempotency_key:
                existing_payment = await payment_repo.get_by_idempotency_key(req.idempotency_key)
                if existing_payment and existing_payment.paypal_capture_id:
                    logger.info("Idempotent capture replay for key %s", req.idempotency_key)
                    return CaptureOrderResponse(
                        paypal_capture_id=existing_payment.paypal_capture_id,
                        status=existing_payment.status,
                        amount=existing_payment.amount,
                        currency=existing_payment.currency,
                    )

            # Idempotency check 2: Order already completed
            if order.status == OrderStatus.PAID.value:
                # Find the payment for this order
                stmt = _sa_select(PaymentORM).where(PaymentORM.internal_order_id == order.internal_order_id)
                res = await session.execute(stmt)
                existing_payment = res.scalar_one_or_none()
                if existing_payment and existing_payment.paypal_capture_id:
                    return CaptureOrderResponse(
                        paypal_capture_id=existing_payment.paypal_capture_id,
                        status=existing_payment.status,
                        amount=existing_payment.amount,
                        currency=existing_payment.currency,
                    )

            # Perform live capture with PayPal
            try:
                capture_resp = await paypal_client.capture_order(order.paypal_order_id)
            except Exception as exc:
                logger.error("PayPal capture request failed: %s", exc)
                # Mark as payment failed if PayPal explicitly rejected
                await order_repo.update_status(order.internal_order_id, OrderStatus.PAYMENT_FAILED.value)
                raise PaymentError(f"Payment capture failed: {str(exc)}") from exc

            capture_status = capture_resp.get("status", "UNKNOWN")
            
            # Extract capture transaction details from purchase_units
            capture_id = None
            captured_amount = order.payable_amount
            captured_currency = order.currency
            
            purchase_units = capture_resp.get("purchase_units", [])
            if purchase_units:
                captures = purchase_units[0].get("payments", {}).get("captures", [])
                if captures:
                    capture_item = captures[0]
                    capture_id = capture_item.get("id")
                    capture_status = capture_item.get("status", capture_status)
                    amount_data = capture_item.get("amount", {})
                    if "value" in amount_data:
                        captured_amount = float(amount_data["value"])
                    if "currency_code" in amount_data:
                        captured_currency = amount_data["currency_code"]

            # Fallback if capture_resp itself has the id
            if not capture_id:
                capture_id = capture_resp.get("id")

            # Validate that payment is genuinely COMPLETED
            if capture_status != "COMPLETED":
                await order_repo.update_status(order.internal_order_id, OrderStatus.PAYMENT_FAILED.value)
                raise PaymentError(f"PayPal capture did not complete successfully (status: {capture_status})")

            # Persist Payment record
            payment_id = f"pay_{uuid.uuid4().hex[:12]}"
            payment = PaymentORM(
                payment_id=payment_id,
                internal_order_id=order.internal_order_id,
                amount=captured_amount,
                currency=captured_currency,
                status=capture_status,
                paypal_capture_id=capture_id,
                idempotency_key=req.idempotency_key,
                created_at=datetime.now(timezone.utc),
                captured_at=datetime.now(timezone.utc),
            )
            session.add(payment)

            # Update Order status to PAID
            order.status = OrderStatus.PAID.value
            order.updated_at = datetime.now(timezone.utc)
            session.add(order)

            await session.commit()
            logger.info("Order %s marked PAID. Capture ID: %s", order.internal_order_id, capture_id)

            return CaptureOrderResponse(
                paypal_capture_id=capture_id or "",
                status=capture_status,
                amount=captured_amount,
                currency=captured_currency,
                raw_response=capture_resp,
            )
        finally:
            await session.close()

    # ------------------------------------------------------------------
    # 3. Status lookup
    # ------------------------------------------------------------------
    async def get_order_status(self, order_id: str) -> OrderStatusResponse:
        """Retrieve order and payment status by internal ID or PayPal order ID."""
        quote_repo, order_repo, payment_repo, session = await self._get_db_repos()
        try:
            order = await order_repo.get(order_id)
            if not order:
                order = await order_repo.get_by_paypal_order_id(order_id)

            if not order:
                raise PaymentError(f"Order '{order_id}' not found.")

            # Look up associated capture ID if any
            stmt = _sa_select(PaymentORM).where(PaymentORM.internal_order_id == order.internal_order_id)
            res = await session.execute(stmt)
            payment = res.scalar_one_or_none()

            return OrderStatusResponse(
                order_id=order.internal_order_id,
                status=order.status,
                payable_amount=order.payable_amount,
                currency=order.currency,
                paypal_order_id=order.paypal_order_id,
                paypal_capture_id=payment.paypal_capture_id if payment else None,
            )
        finally:
            await session.close()


payment_service = PaymentService()
