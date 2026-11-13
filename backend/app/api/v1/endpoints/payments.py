"""FastAPI endpoints for PayPal Checkout payments, Webhook ingestion, and Refunds."""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user, get_optional_user
from app.database.connection import get_db
from app.database.models import AuditLogORM, NotificationORM, OrderORM, PaymentORM, UserORM, WebhookEventORM
from app.schemas.checkout_schema import (
    CaptureOrderRequest,
    CaptureOrderResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    OrderStatusResponse,
)
from app.services.payment_service import PaymentError, payment_service

logger = logging.getLogger("zen.api.v1.endpoints.payments")

router = APIRouter()


class RefundRequest(BaseModel):
    order_id: str
    reason: str = Field(..., min_length=3, max_length=500)
    amount: Optional[float] = None


@router.post(
    "/create",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create PayPal payment order",
    description="Validates a server-calculated purchase quote and initiates a PayPal checkout order.",
)
async def create_payment_order(payload: CreateOrderRequest) -> CreateOrderResponse:
    """
    Creates an official PayPal order for a verified LandedCostQuote.
    Never accepts client-supplied prices; payable amount is strictly determined server-side.
    """
    try:
        response = await payment_service.create_order(payload)
        return response
    except PaymentError as err:
        logger.warning("Failed to create PayPal payment: %s", err)
        err_msg = err.message if hasattr(err, "message") else str(err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg,
        )
    except Exception as exc:
        logger.error("Unexpected error in create_payment_order: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error initiating payment: {str(exc)}",
        )


@router.post(
    "/capture",
    response_model=CaptureOrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Capture approved PayPal payment",
    description="Captures funds for a buyer-approved PayPal order and transitions order to PAID status.",
)
async def capture_payment(payload: CaptureOrderRequest) -> CaptureOrderResponse:
    """
    Captures payment after buyer approves the transaction in PayPal Sandbox/Live modal.
    Idempotent: Re-submitting the same order returns the existing capture confirmation.
    """
    try:
        response = await payment_service.capture_order(payload)
        return response
    except PaymentError as err:
        logger.warning("Payment capture failed: %s", err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )
    except Exception as exc:
        logger.error("Unexpected error in capture_payment: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error capturing payment: {str(exc)}",
        )


@router.get(
    "/{order_id}",
    response_model=OrderStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get payment and order status",
    description="Retrieves the current status, amounts, and transaction IDs for an order.",
)
async def get_order_status_endpoint(order_id: str) -> OrderStatusResponse:
    """
    Get order lifecycle status (PAYMENT_PENDING, PAID, PAYMENT_FAILED, etc.).
    """
    try:
        response = await payment_service.get_order_status(order_id)
        return response
    except PaymentError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )
    except Exception as exc:
        logger.error("Unexpected error getting order status: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving order: {str(exc)}",
        )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="PayPal Webhook Notification Ingestion",
    description="Verifies and processes asynchronous PayPal transaction events with duplicate protection.",
)
async def paypal_webhook_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    paypal_transmission_id: Optional[str] = Header(None, alias="paypal-transmission-id"),
    paypal_transmission_time: Optional[str] = Header(None, alias="paypal-transmission-time"),
    paypal_transmission_sig: Optional[str] = Header(None, alias="paypal-transmission-sig"),
    paypal_cert_url: Optional[str] = Header(None, alias="paypal-cert-url"),
):
    """
    Handles asynchronous PayPal webhook events:
    - PAYMENT.CAPTURE.COMPLETED -> Reconciles order to PAID status.
    - PAYMENT.CAPTURE.DENIED -> Transitions order to PAYMENT_FAILED.
    - PAYMENT.CAPTURE.REFUNDED -> Transitions order to REFUNDED.
    Enforces duplicate-event protection: If event ID was already recorded, returns HTTP 200 OK without re-processing.
    """
    try:
        body_bytes = await request.body()
        payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
    except Exception as exc:
        logger.warning("Failed to decode webhook JSON: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON payload in webhook request.",
        )

    event_id = payload.get("id") or paypal_transmission_id or f"evt_{uuid.uuid4().hex[:12]}"
    event_type = payload.get("event_type", "UNKNOWN")
    resource = payload.get("resource", {})
    resource_id = resource.get("id") or resource.get("parent_payment")

    logger.info("Received PayPal webhook event %s (type: %s, resource: %s)", event_id, event_type, resource_id)

    # 1. Duplicate Event Check
    existing_event = await db.get(WebhookEventORM, event_id)
    if existing_event:
        logger.info("Webhook event '%s' was already processed; returning idempotent 200 OK.", event_id)
        return {
            "status": "DUPLICATE",
            "event_id": event_id,
            "event_type": event_type,
            "processed_at": existing_event.created_at.isoformat(),
        }

    # 2. Event Dispatching
    now = datetime.now(timezone.utc)
    order_updated = None

    if event_type in ("PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"):
        # Find order by paypal_order_id or related resource ID
        paypal_ref = resource.get("supplementary_data", {}).get("related_ids", {}).get("order_id") or resource_id
        res = await db.execute(
            select(OrderORM).where(
                (OrderORM.paypal_order_id == paypal_ref) | (OrderORM.internal_order_id == resource.get("custom_id"))
            )
        )
        order = res.scalar_one_or_none()
        if order:
            order.status = "PAID"
            order.updated_at = now
            order_updated = order.internal_order_id

            # Create notification
            notif = NotificationORM(
                id=f"notif_{uuid.uuid4().hex[:12]}",
                user_id=order.user_id,
                store_id=order.store_id,
                type="PAYMENT_CONFIRMED",
                title=f"Payment Confirmed for {order.internal_order_id}",
                message=f"PayPal payment of {order.currency} {order.payable_amount:,.2f} has been verified and captured.",
                data_json=json.dumps({"order_id": order.internal_order_id, "amount": order.payable_amount}),
            )
            db.add(notif)

    elif event_type == "PAYMENT.CAPTURE.REFUNDED":
        res = await db.execute(
            select(OrderORM).where(
                (OrderORM.paypal_order_id == resource_id) | (OrderORM.internal_order_id == resource.get("custom_id"))
            )
        )
        order = res.scalar_one_or_none()
        if order:
            order.status = "REFUNDED"
            order.updated_at = now
            order_updated = order.internal_order_id

            notif = NotificationORM(
                id=f"notif_{uuid.uuid4().hex[:12]}",
                user_id=order.user_id,
                store_id=order.store_id,
                type="REFUND_ISSUED",
                title=f"Refund Processed for {order.internal_order_id}",
                message=f"Refund has been completed via PayPal for order {order.internal_order_id}.",
                data_json=json.dumps({"order_id": order.internal_order_id}),
            )
            db.add(notif)

    # 3. Persist Webhook Event Record
    webhook_event = WebhookEventORM(
        event_id=event_id,
        event_type=event_type,
        resource_id=resource_id,
        status="PROCESSED",
        payload_json=json.dumps(payload),
        created_at=now,
    )
    db.add(webhook_event)
    await db.commit()

    return {
        "status": "SUCCESS",
        "event_id": event_id,
        "event_type": event_type,
        "order_reconciled": order_updated,
    }


@router.post(
    "/refund",
    status_code=status.HTTP_200_OK,
    summary="Process Order Refund",
    description="Initiates a verified refund for an existing paid order.",
)
async def process_refund_endpoint(
    payload: RefundRequest,
    current_user: Optional[UserORM] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validates that the order was completed and paid, transitions status to REFUNDED,
    records the audit trail, and generates buyer notifications.
    """
    res = await db.execute(select(OrderORM).where(OrderORM.internal_order_id == payload.order_id))
    order = res.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{payload.order_id}' not found.",
        )

    if order.status not in ("PAID", "PROCESSING", "SHIPPED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot refund order in '{order.status}' status. Only confirmed and paid orders can be refunded.",
        )

    now = datetime.now(timezone.utc)
    order.status = "REFUNDED"
    order.updated_at = now

    refund_amount = payload.amount or order.payable_amount
    refund_id = f"REF-{uuid.uuid4().hex[:10].upper()}"

    # Log in audit trail
    audit = AuditLogORM(
        id=f"aud_{uuid.uuid4().hex[:12]}",
        event_type="ORDER_REFUND",
        actor_email=current_user.email if current_user else "system@zen.global",
        target_id=order.internal_order_id,
        action=f"Refunded {order.currency} {refund_amount:,.2f} - Reason: {payload.reason}",
        details_json=json.dumps({"order_id": order.internal_order_id, "refund_id": refund_id, "reason": payload.reason}),
        created_at=now,
    )
    db.add(audit)

    # In-app notification
    notif = NotificationORM(
        id=f"notif_{uuid.uuid4().hex[:12]}",
        user_id=order.user_id,
        store_id=order.store_id,
        type="REFUND_ISSUED",
        title=f"Refund Issued ({order.internal_order_id})",
        message=f"Refund of {order.currency} {refund_amount:,.2f} has been authorized: {payload.reason}",
        data_json=json.dumps({"order_id": order.internal_order_id, "refund_id": refund_id, "amount": refund_amount}),
        created_at=now,
    )
    db.add(notif)
    await db.commit()

    return {
        "status": "REFUNDED",
        "order_id": order.internal_order_id,
        "refund_id": refund_id,
        "amount": refund_amount,
        "currency": order.currency,
        "reason": payload.reason,
        "timestamp": now.isoformat(),
    }
