"""
Phase 6-9 tests for the AI Shopping Agent Orchestration endpoint.

POST /api/v1/agent/shop

Coverage:
- NL extraction → needs_info when fields missing
- Discovery flow: search + quote + rank
- Checkout approval flow: creates PayPal order from approved quote
- Financial safety: verify no client-supplied price is used
- Error handling: search failure, quote failure, PayPal failure
- API contract: response schema validation
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.chat import Budget, Destination, ShoppingRequirements
from app.schemas.pricing_schema import CostItem, LandedCostQuote
from app.schemas.product_schema import (
    NormalizedProduct,
    ProductSearchMetadata,
    ProductSearchResponse,
)
from app.services.pricing_service import QUOTES_STORE


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_requirements(product: str = "Sony headphones") -> ShoppingRequirements:
    return ShoppingRequirements(
        product=product,
        destination=Destination(country="India", city="Mumbai"),
        budget=Budget(amount=20000.0, currency="INR"),
        delivery_deadline_days=30,
    )


def _make_product(
    pid: Optional[str] = None,
    price: float = 250.0,
    title: Optional[str] = None,
) -> NormalizedProduct:
    pid = pid or f"prod_{uuid.uuid4().hex[:8]}"
    return NormalizedProduct(
        id=pid,
        title=title or f"Sony WH-1000XM5 ({pid[:8]})",
        price=price,
        currency="EUR",
        merchant="amazon.de",
        merchant_url="https://amazon.de/dp/test",
        shipping_status="unknown",
    )


def _make_quote(
    product_id: str,
    total: float = 25000.0,
    dest_currency: str = "INR",
    exact: bool = False,
) -> LandedCostQuote:
    now = datetime.now(timezone.utc)
    return LandedCostQuote(
        quote_id=f"qte_{uuid.uuid4().hex[:8]}",
        product_id=product_id,
        product_title="Sony WH-1000XM5",
        merchant="amazon.de",
        merchant_url="https://amazon.de/dp/test",
        source_currency="EUR",
        destination_currency=dest_currency,
        exchange_rate=90.0,
        rate_timestamp=now,
        product_price_source=250.0,
        product_price_converted=22500.0,
        breakdown=[
            CostItem(
                name="Product",
                amount=22500.0,
                amount_source=250.0,
                currency=dest_currency,
                currency_source="EUR",
                status="verified",
            )
        ],
        total_estimated_cost=total,
        total_is_exact=exact,
        created_at=now,
        expires_at=now + timedelta(minutes=15),
        assumptions=[],
        warnings=[],
    )


def _mock_search(products=None, alternatives=None) -> ProductSearchResponse:
    prods = products or [_make_product()]
    return ProductSearchResponse(
        products=prods,
        alternative_products=alternatives or [],
        metadata=ProductSearchMetadata(query="Sony headphones", total_results=len(prods)),
        status="success",
        message="Found products.",
    )


def _mock_chat_ok(requirements=None):
    from app.schemas.chat import ChatResponse
    return ChatResponse(
        message="Got it.",
        requirements=requirements or _make_requirements(),
        missing_information=[],
        status="success",
    )


# ---------------------------------------------------------------------------
# 1. needs_info when extraction fails
# ---------------------------------------------------------------------------

def test_shop_needs_info_when_extraction_fails(client):
    from app.schemas.chat import ChatResponse
    mock_resp = ChatResponse(
        message="Please provide more details.",
        requirements=None,
        missing_information=["product", "destination", "budget", "delivery_deadline"],
        status="partial",
    )
    with patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=mock_resp):
        resp = client.post("/api/v1/agent/shop", json={"message": "buy something"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "needs_info"
    assert "product" in data["missing_information"]


# ---------------------------------------------------------------------------
# 2. Full discovery flow returns ranked results
# ---------------------------------------------------------------------------

def test_shop_discovery_returns_results(client):
    product = _make_product()
    quote = _make_quote(product.id, total=24500.0)

    with (
        patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=_mock_chat_ok()),
        patch("app.agents.orchestrator.product_service.search_products", new_callable=AsyncMock, return_value=_mock_search([product])),
        patch("app.agents.orchestrator.pricing_service.calculate_landed_cost", new_callable=AsyncMock, return_value=quote),
    ):
        resp = client.post("/api/v1/agent/shop", json={
            "message": "Sony headphones to India under 25000 INR",
            "destination_currency": "INR",
            "destination_country": "India",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "results"
    assert len(data["products"]) == 1
    assert data["products"][0]["rank"] == 1
    assert data["products"][0]["is_recommended"] is True
    assert data["products"][0]["quote"] is not None
    assert data["total_products_found"] >= 1


# ---------------------------------------------------------------------------
# 3. Products ranked by total estimated cost ascending
# ---------------------------------------------------------------------------

def test_shop_products_ranked_by_cost(client):
    p1 = _make_product(price=300.0)
    p2 = _make_product(price=200.0)
    q1 = _make_quote(p1.id, total=35000.0)
    q2 = _make_quote(p2.id, total=24000.0)
    quote_map = {p1.id: q1, p2.id: q2}

    async def mock_quote(req):
        return quote_map[req.product_id]

    with (
        patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=_mock_chat_ok()),
        patch("app.agents.orchestrator.product_service.search_products", new_callable=AsyncMock, return_value=_mock_search([p1, p2])),
        patch("app.agents.orchestrator.pricing_service.calculate_landed_cost", side_effect=mock_quote),
    ):
        resp = client.post("/api/v1/agent/shop", json={
            "message": "Sony headphones to India",
            "destination_currency": "INR",
            "destination_country": "India",
        })

    assert resp.status_code == 200
    products = resp.json()["products"]
    assert len(products) == 2
    assert products[0]["quote"]["total_estimated_cost"] == 24000.0
    assert products[1]["quote"]["total_estimated_cost"] == 35000.0


# ---------------------------------------------------------------------------
# 4. Checkout approval creates PayPal order
# ---------------------------------------------------------------------------

def test_shop_checkout_on_approval(client):
    quote_id = f"qte_{uuid.uuid4().hex[:8]}"
    quote = _make_quote("prod_123", total=24000.0, exact=False)
    quote = quote.model_copy(update={"quote_id": quote_id})
    QUOTES_STORE[quote_id] = quote

    paypal_order_id = f"PP-{uuid.uuid4().hex[:8]}"
    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_pp:
        mock_pp.return_value = {
            "id": paypal_order_id,
            "status": "CREATED",
            "links": [{"href": "https://sandbox.paypal.com/approve", "rel": "approve"}],
        }
        resp = client.post("/api/v1/agent/shop", json={
            "message": "buy it",
            "approve_quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "checkout"
    assert data["checkout"]["paypal_order_id"] == paypal_order_id
    assert data["checkout"]["approval_url"] == "https://sandbox.paypal.com/approve"
    assert data["checkout"]["payable_amount"] > 0
    assert "ESTIMATE" in data["checkout"]["safety_note"].upper()


# ---------------------------------------------------------------------------
# 5. Estimated quote charges product price only, not total
# ---------------------------------------------------------------------------

def test_checkout_estimated_quote_charges_product_price_only(client):
    quote_id = f"qte_{uuid.uuid4().hex[:8]}"
    quote = _make_quote("prod_fin", total=30000.0, exact=False)
    # product_price_source = 250.0 EUR, product_price_converted = 22500 INR
    quote = quote.model_copy(update={"quote_id": quote_id})
    QUOTES_STORE[quote_id] = quote

    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_pp:
        mock_pp.return_value = {
            "id": f"PP-{uuid.uuid4().hex[:8]}",
            "status": "CREATED",
            "links": [{"href": "https://sandbox.paypal.com/approve", "rel": "approve"}],
        }
        resp = client.post("/api/v1/agent/shop", json={
            "message": "buy",
            "approve_quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
        })

    assert resp.status_code == 200
    call_kwargs = mock_pp.call_args.kwargs
    # Must charge source product price (250.0 EUR), not total estimated (30000 INR)
    assert call_kwargs["currency"] == "EUR"
    assert abs(call_kwargs["amount"] - 250.0) < 1.0


# ---------------------------------------------------------------------------
# 6. Checkout requires return_url and cancel_url
# ---------------------------------------------------------------------------

def test_checkout_missing_urls_returns_error(client):
    resp = client.post("/api/v1/agent/shop", json={
        "message": "buy",
        "approve_quote_id": "qte_nonexistent",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert "url" in data["message"].lower()


# ---------------------------------------------------------------------------
# 7. Expired/missing quote returns error
# ---------------------------------------------------------------------------

def test_checkout_expired_quote_returns_error(client):
    resp = client.post("/api/v1/agent/shop", json={
        "message": "buy",
        "approve_quote_id": "qte_does_not_exist_xyz_abc",
        "return_url": "https://zen.shop/success",
        "cancel_url": "https://zen.shop/cancel",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert "expired" in data["message"].lower() or "not found" in data["message"].lower()


# ---------------------------------------------------------------------------
# 8. Search failure propagates gracefully
# ---------------------------------------------------------------------------

def test_shop_search_failure_returns_error(client):
    failed_search = ProductSearchResponse(
        products=[],
        alternative_products=[],
        metadata=ProductSearchMetadata(query="Sony headphones", total_results=0),
        status="error",
        message="Channel3 upstream error",
    )
    with (
        patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=_mock_chat_ok()),
        patch("app.agents.orchestrator.product_service.search_products", new_callable=AsyncMock, return_value=failed_search),
    ):
        resp = client.post("/api/v1/agent/shop", json={"message": "find sony"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "error"


# ---------------------------------------------------------------------------
# 9. Quote failure is non-fatal (graceful degradation)
# ---------------------------------------------------------------------------

def test_shop_quote_failure_does_not_crash(client):
    product = _make_product()
    with (
        patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=_mock_chat_ok()),
        patch("app.agents.orchestrator.product_service.search_products", new_callable=AsyncMock, return_value=_mock_search([product])),
        patch("app.agents.orchestrator.pricing_service.calculate_landed_cost", new_callable=AsyncMock, side_effect=ValueError("No offers")),
    ):
        resp = client.post("/api/v1/agent/shop", json={
            "message": "Sony headphones to India",
            "destination_currency": "INR",
            "destination_country": "India",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "results"
    assert len(data["products"]) == 1
    assert data["products"][0]["quote"] is None
    assert data["products"][0]["quote_error"] is not None


# ---------------------------------------------------------------------------
# 10. API contract: required keys always present
# ---------------------------------------------------------------------------

def test_shop_response_always_has_required_keys(client):
    from app.schemas.chat import ChatResponse
    mock_resp = ChatResponse(
        message="More info needed.",
        requirements=None,
        missing_information=["product"],
        status="partial",
    )
    with patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=mock_resp):
        resp = client.post("/api/v1/agent/shop", json={"message": "buy something"})
    assert resp.status_code == 200
    data = resp.json()
    for key in ["status", "message", "products", "alternative_products", "missing_information", "warnings"]:
        assert key in data, f"Missing required key: {key}"


# ---------------------------------------------------------------------------
# 11. Product-Price Budget vs Landed-Cost Budget Distinction
# ---------------------------------------------------------------------------

def test_shop_budget_distinction_product_vs_landed_cost(client):
    """
    Test when product base price is under budget (e.g. 140 EUR < 150 EUR),
    but total estimated landed cost exceeds budget (e.g. 185 EUR > 150 EUR).
    The system must disclose that product price is in-budget while landed cost is not,
    and must never claim the landed cost is within budget.
    """
    product = _make_product(price=140.0)
    # Quote with source EUR and destination EUR for direct comparison
    quote = _make_quote(product.id, total=185.0, exact=False, dest_currency="EUR")
    quote = quote.model_copy(update={
        "product_price_source": 140.0,
        "product_price_converted": 140.0,
        "total_estimated_cost": 185.0,
        "exchange_rate": 1.0,
        "destination_currency": "EUR",
    })

    req = ShoppingRequirements(
        product="Sennheiser headphones",
        destination=Destination(country="Germany", city="Berlin"),
        budget=Budget(amount=150.0, currency="EUR"),
        delivery_deadline_days=10,
    )

    with (
        patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=_mock_chat_ok(req)),
        patch("app.agents.orchestrator.product_service.search_products", new_callable=AsyncMock, return_value=_mock_search([product])),
        patch("app.agents.orchestrator.pricing_service.calculate_landed_cost", new_callable=AsyncMock, return_value=quote),
    ):
        resp = client.post("/api/v1/agent/shop", json={
            "message": "Sennheiser headphones under 150 EUR to Germany",
            "destination_currency": "EUR",
            "destination_country": "Germany",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "results"
    budget_status = data.get("budget_status")
    assert budget_status is not None
    assert budget_status["product_price_in_budget"] is True
    assert budget_status["landed_cost_in_budget"] is False
    assert "within your stated budget" in budget_status["explanation"]
    assert "exceeds your budget due to international shipping" in budget_status["explanation"]


# ---------------------------------------------------------------------------
# 12. Ranking: Exact Product Category Ranks Above Related Category in Agent
# ---------------------------------------------------------------------------

def test_shop_exact_category_ranks_above_related_earbuds(client):
    """
    Ensure the orchestrator ranks the exact product (Headphones) at rank 1 with is_recommended=True,
    even if related earbuds are cheaper.
    """
    earbuds = _make_product(title="Sennheiser ACCENTUM Open Wireless Earbuds", price=89.99)
    headphones = _make_product(title="Sennheiser Accentum Wireless Headphones", price=129.90)

    q_eb = _make_quote(earbuds.id, total=11000.0)
    q_hp = _make_quote(headphones.id, total=15000.0)
    quote_map = {earbuds.id: q_eb, headphones.id: q_hp}

    async def mock_quote(req):
        return quote_map[req.product_id]

    req = ShoppingRequirements(
        product="Sennheiser Accentum wireless headphones",
        destination=Destination(country="India", city="Mumbai"),
        budget=Budget(amount=20000.0, currency="INR"),
        delivery_deadline_days=20,
    )

    with (
        patch("app.agents.orchestrator.shopping_agent.process_message", new_callable=AsyncMock, return_value=_mock_chat_ok(req)),
        patch("app.agents.orchestrator.product_service.search_products", new_callable=AsyncMock, return_value=_mock_search([earbuds, headphones])),
        patch("app.agents.orchestrator.pricing_service.calculate_landed_cost", side_effect=mock_quote),
    ):
        resp = client.post("/api/v1/agent/shop", json={
            "message": "Sennheiser Accentum wireless headphones to India",
            "destination_currency": "INR",
            "destination_country": "India",
        })

    assert resp.status_code == 200
    products = resp.json()["products"]
    assert len(products) == 2
    # Headphones must rank 1st despite higher total cost because it is an exact category match
    assert products[0]["product"]["id"] == headphones.id
    assert products[0]["rank"] == 1
    assert products[0]["is_recommended"] is True
    assert "Exact product match" in products[0]["ranking_note"]

    # Earbuds ranked 2nd and labeled as related item
    assert products[1]["product"]["id"] == earbuds.id
    assert products[1]["rank"] == 2
    assert "Related item" in products[1]["ranking_note"]


# ---------------------------------------------------------------------------
# 13. INR Destination Quote Creates EUR PayPal Order & Ignores Client Tampering
# ---------------------------------------------------------------------------

def test_shop_checkout_inr_destination_creates_eur_paypal_order(client):
    """
    Verify that an INR destination quote creates a EUR PayPal order,
    that client-supplied price/currency manipulation is ignored/rejected,
    and that the displayed INR estimate is kept intact and separate.
    """
    quote_id = f"qte_eur_trans_{uuid.uuid4().hex[:8]}"
    # Quote: 129.90 EUR source, 11691.0 INR converted, 14500.0 INR estimated total landed cost
    now = datetime.now(timezone.utc)
    quote = LandedCostQuote(
        quote_id=quote_id,
        product_id="zNQps8G",
        product_title="Sennheiser Accentum Wireless Headphones",
        merchant="global.sennheiser-hearing.com",
        merchant_url="https://global.sennheiser-hearing.com/accentum",
        source_currency="EUR",
        destination_currency="INR",
        exchange_rate=90.0,
        rate_timestamp=now,
        product_price_source=129.90,
        product_price_converted=11691.0,
        breakdown=[
            CostItem(
                name="Product Base Price",
                amount=11691.0,
                amount_source=129.90,
                currency="INR",
                currency_source="EUR",
                status="verified",
            )
        ],
        total_estimated_cost=14500.0,
        total_is_exact=False,
        created_at=now,
        expires_at=now + timedelta(minutes=15),
        assumptions=[],
        warnings=[],
    )
    QUOTES_STORE[quote_id] = quote

    paypal_order_id = f"PP-EUR-{uuid.uuid4().hex[:8]}"
    with patch("app.services.payment_service.paypal_client.create_order", new_callable=AsyncMock) as mock_pp:
        mock_pp.return_value = {
            "id": paypal_order_id,
            "status": "CREATED",
            "links": [{"href": "https://sandbox.paypal.com/approve", "rel": "approve"}],
        }

        # Client attempts to pass a malicious price or currency (should be completely ignored by server)
        resp = client.post("/api/v1/agent/shop", json={
            "message": "Approve quote",
            "approve_quote_id": quote_id,
            "return_url": "https://zen.shop/success",
            "cancel_url": "https://zen.shop/cancel",
            # Tampering attempt:
            "amount": 1.00,
            "currency": "USD",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "checkout"
    checkout = data["checkout"]

    # 1. PayPal transaction amount must be the verified quote source amount (129.90 EUR), NEVER INR or 1.00 USD!
    assert checkout["payable_amount"] == 129.90
    assert checkout["currency"] == "EUR"
    assert checkout["currency"] != "INR"

    # 2. PayPal client was called with EUR 129.90, NEVER INR
    call_kwargs = mock_pp.call_args.kwargs
    assert call_kwargs["amount"] == 129.90
    assert call_kwargs["currency"] == "EUR"
    assert call_kwargs["currency"] != "INR"

    # 3. Customer INR landed cost estimate is kept separate and intact
    assert checkout["destination_currency"] == "INR"
    assert checkout["estimated_landed_cost"] == 14500.0
    assert "not included in this PayPal charge" in checkout["safety_note"]



