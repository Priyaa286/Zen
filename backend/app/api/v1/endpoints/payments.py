"""FastAPI endpoints for PayPal Checkout payments (Phase 5).

Endpoints:
- POST /api/v1/payments/create   -> Create PayPal order from verified LandedCostQuote
- POST /api/v1/payments/capture  -> Capture PayPal payment for approved order
- GET  /api/v1/payments/{order_id} -> Query order and payment status
"""

import logging
from fastapi import APIRouter, HTTPException, status

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

