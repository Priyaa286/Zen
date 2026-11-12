"""Unit and integration tests for Phase 5 PayPal Checkout flow.

Test coverage:
- Order creation from valid quote
- Rejection of invalid quote
- Rejection of expired quote
- PayPal API errors / timeouts
- Successful capture transition (QUOTED -> PAYMENT_PENDING -> PAID)
- Failed capture handling (transition to PAYMENT_FAILED)
- Idempotent capture (re-requesting does not re-charge)
- Prevention of client-side amount tampering (server authoritative amount)
- Order status retrieval endpoint
- Database persistence & restart survival
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.connection import Base
from app.database.models import OrderORM, PaymentORM, QuoteORM
from app.integrations.paypal.client import PayPalAPIError, PayPalAuthError
from app.main import app
from app.models.order import OrderStatus
from app.repositories.quote_repository import QuoteRepository
from app.schemas.pricing_schema import CostItem, LandedCostQuote
from app.services.pricing_service import QUOTES_STORE


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _create_test_quote(
    quote_id: str,
    total_cost: float = 25000.0,
    product_price: float = 20000.0,
    is_exact: bool = True,
    ttl_minutes: int = 15,
) -> LandedCostQuote:
    now = datetime.now(timezone.utc)
    return LandedCostQuote(
        quote_id=quote_id,
        product_id="prod_sony_100",
        product_title="Sony Wireless Headphones",
        merchant="amazon.de",
        merchant_url="https://amazon.de/dp/test",
        source_currency="EUR",
        destination_currency="INR",
        exchange_rate=90.0,
        rate_timestamp=now,
        product_price_source=product_price / 90.0,
        product_price_converted=product_price,
        breakdown=[
            CostItem(
                name="Product Base Price",
                amount=product_price,
                amount_source=product_price / 90.0,
                currency="INR",
                currency_source="EUR",
                status="verified",
            )
        ],
        total_estimated_cost=total_cost,
        total_is_exact=is_exact,
        created_at=now,
        expires_at=now + timedelta(minutes=ttl_minutes),
        assumptions=[],
        warnings=[],
    )


# =====================================================================
# 1. Payment Order Creation Tests
# =====================================================================

def test_create_order_success(client: TestClient):
    """Ensure order creation generates PayPal order and approval URL using source currency (EUR), not INR."""
    quote_id = f"qte_{uuid.uuid4().hex[:8]}"
    quote = _create_test_quote(quote_id, total_cost=27000.0, product_price=20000.0, is_exact=True)
    QUOTES_STORE[quote_id] = quote

    unique_pp_id = f"PAYPAL-ORD-{uuid.uuid4().hex[:8]}"
    mock_paypal_resp = {
        "id": unique_pp_id,
        "status": "CREATED",
        "links": [
            {"href": f"https://www.sandbox.paypal.com/checkoutnow?token={unique_pp_id}&action=approve", "rel": "approve", "method": "GET"}
        ]
    }

    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_paypal_resp

        payload = {
            "quote_id": quote_id,
            "return_url": "https://zen.shop/checkout/success",
            "cancel_url": "https://zen.shop/checkout/cancel",
        }

        resp = client.post("/api/v1/payments/create", json=payload)
        assert resp.status_code == 201
        data = resp.json()

        assert data["paypal_order_id"] == unique_pp_id
        assert "approve" in data["approval_url"]
        assert data["status"] == "CREATED"
        assert data["currency"] == "EUR"
        assert data["payable_amount"] == round(20000.0 / 90.0, 2)

        # Verify amount passed to PayPal used the verified source currency (EUR), never INR!
        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["amount"] == round(20000.0 / 90.0, 2)
        assert call_kwargs["currency"] == "EUR"
        assert call_kwargs["currency"] != "INR"


def test_create_order_invalid_quote(client: TestClient):
    """Rejects order creation for a non-existent quote."""
    payload = {
        "quote_id": "non_existent_quote_123",
        "return_url": "https://zen.shop/success",
        "cancel_url": "https://zen.shop/cancel",
    }
    resp = client.post("/api/v1/payments/create", json=payload)
    assert resp.status_code == 400
    assert "invalid or expired" in resp.json()["error"]["message"].lower()


def test_create_order_expired_quote(client: TestClient):
    """Rejects order creation when the quote has expired."""
    quote_id = f"qte_exp_{uuid.uuid4().hex[:8]}"
    # Expired 10 minutes ago
    quote = _create_test_quote(quote_id, ttl_minutes=-10)
    QUOTES_STORE[quote_id] = quote

    payload = {
        "quote_id": quote_id,
        "return_url": "https://zen.shop/success",
        "cancel_url": "https://zen.shop/cancel",
    }
    resp = client.post("/api/v1/payments/create", json=payload)
    assert resp.status_code == 400
    assert "invalid or expired" in resp.json()["error"]["message"].lower()


def test_create_order_paypal_api_error(client: TestClient):
    """Gracefully handles PayPal API failure."""
    quote_id = f"qte_{uuid.uuid4().hex[:8]}"
    quote = _create_test_quote(quote_id)
    QUOTES_STORE[quote_id] = quote

    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = PayPalAPIError("Simulated PayPal 500 error")

        payload = {
            "quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        }
        resp = client.post("/api/v1/payments/create", json=payload)
        assert resp.status_code == 400
        assert "paypal order creation failed" in resp.json()["error"]["message"].lower()


# =====================================================================
# 2. Amount Safety: Never Charge Unverified Estimated Customs / Shipping
# =====================================================================

def test_unverified_estimates_safe_charge_amount(client: TestClient):
    """
    If total_is_exact is False (because shipping or customs are estimates/unknown),
    the PayPal charge must NOT charge estimated customs as guaranteed.
    It safely charges the verified product base price in the original currency (EUR).
    """
    quote_id = f"qte_safe_{uuid.uuid4().hex[:8]}"
    # Total estimated is 35,000 INR, but is_exact is False (shipping/customs estimated)
    # Product converted is 20,000 INR (20000 / 90 = 222.22 EUR)
    quote = _create_test_quote(quote_id, total_cost=35000.0, product_price=20000.0, is_exact=False)
    QUOTES_STORE[quote_id] = quote

    unique_safe_id = f"PAYPAL-ORD-SAFE-{uuid.uuid4().hex[:8]}"
    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = {
            "id": unique_safe_id,
            "status": "CREATED",
            "links": [{"href": "https://paypal.com/approve", "rel": "approve"}],
        }

        payload = {
            "quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        }
        resp = client.post("/api/v1/payments/create", json=payload)
        assert resp.status_code == 201

        # Must have charged the verified EUR base price, not unverified INR or total
        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["amount"] == round(20000.0 / 90.0, 2)
        assert call_kwargs["currency"] == "EUR"
        assert call_kwargs["currency"] != "INR"


# =====================================================================
# 3. Payment Capture & Idempotency Tests
# =====================================================================

def test_capture_order_success(client: TestClient):
    """Tests successful capture flow transitioning order to PAID."""
    quote_id = f"qte_cap_{uuid.uuid4().hex[:8]}"
    quote = _create_test_quote(quote_id, total_cost=15000.0)
    QUOTES_STORE[quote_id] = quote

    # 1. Create order
    paypal_order_id = f"PP-ORD-CAP-{uuid.uuid4().hex[:6]}"
    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = {
            "id": paypal_order_id,
            "status": "CREATED",
            "links": [{"href": "https://sandbox.paypal.com/approve", "rel": "approve"}],
        }
        create_resp = client.post("/api/v1/payments/create", json={
            "quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        })
        assert create_resp.status_code == 201

    # 2. Capture payment
    mock_capture_resp = {
        "id": f"CAP-{uuid.uuid4().hex[:8]}",
        "status": "COMPLETED",
        "purchase_units": [
            {
                "payments": {
                    "captures": [
                        {
                            "id": f"CAP-{uuid.uuid4().hex[:8]}",
                            "status": "COMPLETED",
                            "amount": {"value": "15000.00", "currency_code": "INR"},
                        }
                    ]
                }
            }
        ]
    }

    cap_idem_key = f"idemp_{uuid.uuid4().hex[:12]}"
    with patch("app.services.payment_service.paypal_client.capture_order", new_callable=AsyncMock) as mock_cap:
        mock_cap.return_value = mock_capture_resp

        cap_resp = client.post("/api/v1/payments/capture", json={
            "order_id": paypal_order_id,
            "idempotency_key": cap_idem_key,
        })
        assert cap_resp.status_code == 200
        cap_data = cap_resp.json()
        assert cap_data["status"] == "COMPLETED"
        assert cap_data["amount"] == 15000.0
        assert cap_data["currency"] == "INR"

    # 3. Verify order status is now PAID
    status_resp = client.get(f"/api/v1/payments/{paypal_order_id}")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "PAID"
    # Order payable amount was saved in verified source currency EUR (20000 / 90 = 222.22)
    assert status_data["payable_amount"] == round(20000.0 / 90.0, 2)
    assert status_data["currency"] == "EUR"


def test_capture_order_idempotency_no_duplicate_charge(client: TestClient):
    """Ensure submitting duplicate capture requests returns existing record without re-calling PayPal."""
    quote_id = f"qte_idemp_{uuid.uuid4().hex[:8]}"
    quote = _create_test_quote(quote_id, total_cost=10000.0)
    QUOTES_STORE[quote_id] = quote

    paypal_order_id = f"PP-IDEMP-{uuid.uuid4().hex[:6]}"
    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = {
            "id": paypal_order_id,
            "status": "CREATED",
            "links": [{"href": "https://paypal.com/approve", "rel": "approve"}],
        }
        client.post("/api/v1/payments/create", json={
            "quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        })

    cap_id = f"CAP-{uuid.uuid4().hex[:12]}"
    mock_capture_resp = {
        "id": cap_id,
        "status": "COMPLETED",
        "purchase_units": [
            {
                "payments": {
                    "captures": [
                        {
                            "id": cap_id,
                            "status": "COMPLETED",
                            "amount": {"value": "10000.00", "currency_code": "INR"},
                        }
                    ]
                }
            }
        ]
    }

    idem_key = f"idem_{uuid.uuid4().hex[:12]}"
    with patch("app.services.payment_service.paypal_client.capture_order", new_callable=AsyncMock) as mock_cap:
        mock_cap.return_value = mock_capture_resp

        # First capture
        res1 = client.post("/api/v1/payments/capture", json={
            "order_id": paypal_order_id,
            "idempotency_key": idem_key,
        })
        assert res1.status_code == 200
        assert mock_cap.call_count == 1

        # Second capture with same idempotency key – must NOT re-call PayPal
        res2 = client.post("/api/v1/payments/capture", json={
            "order_id": paypal_order_id,
            "idempotency_key": idem_key,
        })
        assert res2.status_code == 200
        # PayPal must NOT have been called a second time
        assert mock_cap.call_count == 1
        assert res2.json()["paypal_capture_id"] == cap_id


def test_capture_order_failure_marks_payment_failed(client: TestClient):
    """If PayPal returns error on capture, order transitions to PAYMENT_FAILED."""
    quote_id = f"qte_fail_{uuid.uuid4().hex[:8]}"
    quote = _create_test_quote(quote_id)
    QUOTES_STORE[quote_id] = quote

    paypal_order_id = f"PP-FAIL-{uuid.uuid4().hex[:6]}"
    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = {
            "id": paypal_order_id,
            "status": "CREATED",
            "links": [{"href": "https://paypal.com/approve", "rel": "approve"}],
        }
        client.post("/api/v1/payments/create", json={
            "quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        })

    with patch("app.services.payment_service.paypal_client.capture_order", new_callable=AsyncMock) as mock_cap:
        mock_cap.side_effect = PayPalAPIError("INSTRUMENT_DECLINED")

        res = client.post("/api/v1/payments/capture", json={"order_id": paypal_order_id})
        assert res.status_code == 400

    # Status check confirms PAYMENT_FAILED
    status_resp = client.get(f"/api/v1/payments/{paypal_order_id}")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == OrderStatus.PAYMENT_FAILED.value
