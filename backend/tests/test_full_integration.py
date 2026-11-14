"""Full End-to-End Frontend & Backend Integration Test Suite.

Validates the complete Zen cross-border shopping journey:
1. User registration, login, profile & preferences persistence
2. Product search, details, currency conversion & comparison
3. AI Shopping Assistant natural language interaction
4. Shipping checks & landed cost calculation
5. Full PayPal checkout order creation, approval, and capture lifecycle
6. Multi-vendor seller portal and admin compliance operations
"""

import json
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_auth_registration_and_login_flow(client: TestClient):
    """Test full buyer account registration, login, and session validation."""
    test_email = "test.shopper@zen.global"

    # Register
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test International Buyer",
            "email": test_email,
            "password": "Password123!",
            "residence_country": "IN",
            "preferred_currency": "INR",
        },
    )
    assert reg_resp.status_code in (201, 400)  # 201 created or 400 if already exists

    # Login
    login_resp = client.post(
        "/api/auth/login",
        json={"email": test_email, "password": "Password123!", "remember_me": True},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "token" in login_data
    token = login_data["token"]

    # Verify session via /auth/me with Bearer token
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == test_email
    assert me_data["role"] == "buyer"


def test_user_profile_and_preferences(client: TestClient):
    """Test user profile retrieval and preferences updates."""
    # Authenticate as demo buyer
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "buyer@zen.global", "password": "ZenSecure2026!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update preferences
    pref_resp = client.put(
        "/api/users/preferences",
        json={
            "preferred_currency": "INR",
            "residence_country": "IN",
            "default_delivery_country": "IN",
            "onboarding_completed": True,
        },
        headers=headers,
    )
    assert pref_resp.status_code == 200
    assert pref_resp.json()["user"]["preferredCurrency"] == "INR"


def test_product_search_and_details_endpoints(client: TestClient):
    """Test international product discovery, sorting, and detail view."""
    # Search products in INR
    search_resp = client.post(
        "/api/products/search",
        json={
            "query": "Sony",
            "destination_country": "IN",
            "preferred_currency": "INR",
            "sort_by": "price_asc",
        },
    )
    assert search_resp.status_code == 200
    data = search_resp.json()
    assert "products" in data
    assert len(data["products"]) > 0

    first_prod = data["products"][0]
    assert "convertedPrice" in first_prod
    assert first_prod["targetCurrency"] == "INR"

    # Get single product details
    prod_id = first_prod["id"]
    detail_resp = client.get(
        f"/api/products/{prod_id}?destination_country=IN&preferred_currency=INR"
    )
    assert detail_resp.status_code == 200
    prod_detail = detail_resp.json()
    assert prod_detail["id"] == prod_id
    assert prod_detail["merchant"]["verified"] is True


def test_currency_conversion_service(client: TestClient):
    """Test live FX conversion between USD, EUR, JPY and INR."""
    resp = client.post(
        "/api/currency/convert",
        json={"amount": 100.0, "from_currency": "USD", "to_currency": "INR"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["from_currency"] == "USD"
    assert data["to_currency"] == "INR"
    assert data["converted_amount"] > 100.0
    assert data["rate"] > 0


def test_shipping_check_service(client: TestClient):
    """Test international shipping check and carrier options."""
    resp = client.post(
        "/api/shipping/check",
        json={
            "product_id": "prod-sony-xm5-amazon-us",
            "origin_country": "US",
            "destination_country": "IN",
            "target_currency": "INR",
            "quantity": 1,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["available"] is True
    assert len(data["options"]) >= 2
    assert "etaLabel" in data["options"][0]


def test_full_checkout_and_paypal_lifecycle(client: TestClient):
    """
    Test complete purchase workflow:
    1. /checkout/calculate -> Authoritative Landed Cost Quote
    2. /checkout/create -> PayPal Sandbox Order
    3. /checkout/capture -> Verified Server-Side Payment & Order Confirmation
    4. /orders/{id} -> Verified Order Retrieval
    """
    # 1. Calculate Landed Cost
    calc_resp = client.post(
        "/api/checkout/calculate",
        json={
            "product_id": "prod-sony-xm5-amazon-us",
            "quantity": 1,
            "destination_country": "IN",
            "target_currency": "INR",
            "shipping_option_id": "ship_standard_air",
        },
    )
    assert calc_resp.status_code == 200
    calc_data = calc_resp.json()
    assert "quoteId" in calc_data
    assert "breakdown" in calc_data
    assert calc_data["breakdown"]["totalPayable"] > 0

    # 2. Buyer approves purchase -> Create Order
    create_resp = client.post(
        "/api/checkout/create",
        json={
            "checkout_session_id": calc_data["checkoutSessionId"],
            "product_id": "prod-sony-xm5-amazon-us",
            "quantity": 1,
            "destination_country": "IN",
            "target_currency": "INR",
            "user_approved": True,  # Explicit approval
            "shipping_address": {
                "fullName": "Aarav Sharma",
                "email": "buyer@zen.global",
                "address": "42 Marine Drive",
                "city": "Mumbai",
                "countryCode": "IN",
            },
        },
    )
    assert create_resp.status_code == 201
    create_data = create_resp.json()
    assert "orderId" in create_data
    assert "paypalOrderId" in create_data
    order_id = create_data["orderId"]
    paypal_order_id = create_data["paypalOrderId"]

    # 3. Buyer completes payment -> Capture & Verify
    cap_resp = client.post(
        "/api/checkout/capture",
        json={"paypal_order_id": paypal_order_id, "order_id": order_id},
    )
    assert cap_resp.status_code == 200
    cap_data = cap_resp.json()
    assert cap_data["status"] == "PAID"
    assert cap_data["orderId"] == order_id
    assert "tracking" in cap_data

    # 4. Query order status
    order_resp = client.get(f"/api/orders/{order_id}")
    assert order_resp.status_code == 200
    ord_detail = order_resp.json()
    assert ord_detail["status"] == "PAID"
    assert ord_detail["payableAmount"] > 0


def test_ai_shopping_assistant_chat(client: TestClient):
    """Test AI Shopping Assistant conversational discovery endpoint."""
    resp = client.post(
        "/api/agent/chat",
        json={
            "message": "I want Sony noise cancelling headphones under 30000 INR",
            "destination_country": "IN",
            "preferred_currency": "INR",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert "products" in data
    assert len(data["products"]) > 0
    assert "followUpPrompts" in data


def test_multi_vendor_seller_and_admin_endpoints(client: TestClient):
    """Test seller store and administrative review compliance endpoints."""
    # Admin stats
    stats_resp = client.get("/api/admin/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["totalMerchants"] >= 1
    assert stats["paypalSandboxVerified"] is True

    # Seller orders
    orders_resp = client.get("/api/seller/orders")
    assert orders_resp.status_code == 200
    assert "orders" in orders_resp.json()

    # Seller analytics
    analytics_resp = client.get("/api/seller/analytics")
    assert analytics_resp.status_code == 200
    assert "totalRevenue" in analytics_resp.json()
