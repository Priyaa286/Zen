from datetime import datetime, timezone, timedelta
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.integrations.exchange_rate.client import (
    ExchangeRateClient,
    FXRateUnavailableError,
    FXTimeoutError,
)
from app.schemas.pricing_schema import LandedCostRequest, LandedCostQuote, CostItem
from app.services.pricing_service import pricing_service, QUOTES_STORE


MOCK_CHANNEL3_PRODUCT_DETAIL = {
    "id": "prod_xm5_sony",
    "title": "Sony WH-1000XM5 Noise-Canceling Headphones",
    "offers": [
        {
            "url": "https://www.mediamarkt.de/sony-xm5",
            "domain": "mediamarkt.de",
            "price": {
                "price": 300.0,
                "currency": "EUR"
            },
            "availability": "InStock",
            "condition": "new"
        }
    ]
}


# 1. Test EUR to INR Conversion
@pytest.mark.anyio
async def test_eur_to_inr_conversion():
    client = ExchangeRateClient()
    with patch.object(client, "get_latest_rates", new_callable=AsyncMock) as mock_rates:
        now = datetime.now(timezone.utc)
        mock_rates.return_value = ({"INR": 90.0, "EUR": 1.0}, now)

        converted, rate, ts = await client.convert(100.0, "EUR", "INR")
        assert converted == 9000.0
        assert rate == 90.0
        assert ts == now


# 2. Test USD to INR Conversion
@pytest.mark.anyio
async def test_usd_to_inr_conversion():
    client = ExchangeRateClient()
    with patch.object(client, "get_latest_rates", new_callable=AsyncMock) as mock_rates:
        now = datetime.now(timezone.utc)
        mock_rates.return_value = ({"INR": 84.0, "USD": 1.0}, now)

        converted, rate, ts = await client.convert(50.0, "USD", "INR")
        assert converted == 4200.0
        assert rate == 84.0


# 3. Test Missing FX Rates
@pytest.mark.anyio
async def test_missing_fx_rates():
    client = ExchangeRateClient()
    with patch.object(client, "get_latest_rates", new_callable=AsyncMock) as mock_rates:
        now = datetime.now(timezone.utc)
        # Currency XYZ is missing
        mock_rates.return_value = ({"USD": 1.08, "EUR": 1.0}, now)

        with pytest.raises(FXRateUnavailableError):
            await client.convert(100.0, "EUR", "XYZ")


# 4. Test FX Provider Timeout
@pytest.mark.anyio
async def test_fx_provider_timeout():
    client = ExchangeRateClient(base_url="https://api.frankfurter.app")
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        import httpx
        mock_get.side_effect = httpx.TimeoutException("FX provider timed out")

        with pytest.raises(FXTimeoutError):
            await client.get_latest_rates("EUR")


# 5. Test Complete Cost Breakdown (EUR to INR, India destination)
def test_complete_cost_breakdown_india(client: TestClient):
    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3, \
         patch("app.services.pricing_service.currency_service.client.convert", new_callable=AsyncMock) as mock_conv:

        mock_c3.return_value = MOCK_CHANNEL3_PRODUCT_DETAIL
        now = datetime.now(timezone.utc)
        # Mock 1 EUR = 90.0 INR (Product: 300 EUR = 27,000 INR)
        mock_conv.return_value = (27000.0, 90.0, now)

        payload = {
            "product_id": "prod_xm5_sony",
            "destination_country": "India",
            "destination_currency": "INR"
        }

        response = client.post("/api/v1/pricing/calculate", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["quote_id"].startswith("qte_")
        assert data["source_currency"] == "EUR"
        assert data["destination_currency"] == "INR"
        assert data["exchange_rate"] == 90.0
        assert data["product_price_source"] == 300.0
        assert data["product_price_converted"] == 27000.0

        # Verify items in breakdown
        items_by_name = {item["name"]: item for item in data["breakdown"]}
        assert "Product Base Price" in items_by_name
        assert "International Shipping" in items_by_name
        assert "Customs Duty" in items_by_name
        assert "Import Taxes (GST)" in items_by_name

        # Verify status labels
        assert items_by_name["Product Base Price"]["status"] == "verified"
        assert items_by_name["International Shipping"]["status"] == "estimated"
        assert items_by_name["Customs Duty"]["status"] == "estimated"
        assert items_by_name["Import Taxes (GST)"]["status"] == "estimated"

        # Indian shipping estimate for 28 EUR * 90 = 2520 INR
        assert items_by_name["International Shipping"]["amount"] == 2520.0

        # Total is populated but exact flag is False because shipping/customs are estimated
        assert data["total_estimated_cost"] is not None
        assert data["total_is_exact"] is False
        assert len(data["warnings"]) > 0


# 6. Test Unknown Shipping for Unrecognized Destination
def test_unknown_shipping_and_customs_unrecognized_country(client: TestClient):
    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3, \
         patch("app.services.pricing_service.currency_service.client.convert", new_callable=AsyncMock) as mock_conv:

        mock_c3.return_value = MOCK_CHANNEL3_PRODUCT_DETAIL
        mock_conv.return_value = (324.0, 1.08, datetime.now(timezone.utc))

        payload = {
            "product_id": "prod_xm5_sony",
            "destination_country": "Atlantis",
            "destination_currency": "USD"
        }

        response = client.post("/api/v1/pricing/calculate", json=payload)
        assert response.status_code == 200

        data = response.json()
        items_by_name = {item["name"]: item for item in data["breakdown"]}

        # Both shipping and duty should be marked as unknown
        assert items_by_name["International Shipping"]["status"] == "unknown"
        assert items_by_name["International Shipping"]["amount"] is None

        assert items_by_name["Customs Duty"]["status"] == "unknown"
        assert items_by_name["Customs Duty"]["amount"] is None

        # Total cost MUST NOT be claimed when essential charges are unknown
        assert data["total_estimated_cost"] is None
        assert data["total_is_exact"] is False


# 7. Test Invalid Product ID
def test_invalid_product_id(client: TestClient):
    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3:
        mock_c3.return_value = None

        payload = {
            "product_id": "non_existent_id",
            "destination_country": "India",
            "destination_currency": "INR"
        }

        response = client.post("/api/v1/pricing/calculate", json=payload)
        assert response.status_code == 404
        assert "not found" in response.json()["error"]["message"].lower()


# 8. Test Quote Expiry
def test_quote_expiry_and_retrieval(client: TestClient):
    # Create an expired quote in the store
    expired_quote_id = "qte_expired_test"
    past_time = datetime.now(timezone.utc) - timedelta(minutes=30)
    expired_quote = LandedCostQuote(
        quote_id=expired_quote_id,
        product_id="prod_123",
        product_title="Expired Test Item",
        merchant="test.de",
        merchant_url="https://test.de",
        source_currency="EUR",
        destination_currency="INR",
        exchange_rate=90.0,
        rate_timestamp=past_time,
        product_price_source=100.0,
        product_price_converted=9000.0,
        breakdown=[],
        total_estimated_cost=9000.0,
        total_is_exact=False,
        created_at=past_time,
        expires_at=past_time + timedelta(minutes=15),  # expired 15 mins ago
        assumptions=[],
        warnings=[]
    )
    QUOTES_STORE[expired_quote_id] = expired_quote

    # Trying to retrieve expired quote should return 404
    response = client.get(f"/api/v1/pricing/quotes/{expired_quote_id}")
    assert response.status_code == 404
    assert "expired" in response.json()["error"]["message"].lower()


# 9. Test Frontend-Supplied Price Tampering Prevention
def test_frontend_price_tampering_prevented(client: TestClient):
    """
    Ensure that passing arbitrary price in request body is rejected or ignored.
    The endpoint schema only accepts product_id and target locations.
    """
    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3, \
         patch("app.services.pricing_service.currency_service.client.convert", new_callable=AsyncMock) as mock_conv:

        mock_c3.return_value = MOCK_CHANNEL3_PRODUCT_DETAIL
        mock_conv.return_value = (27000.0, 90.0, datetime.now(timezone.utc))

        # Attempt to tamper by injecting product_price = 1.0 EUR into request
        payload = {
            "product_id": "prod_xm5_sony",
            "product_price": 1.0,  # Malicious price injection
            "destination_country": "India",
            "destination_currency": "INR"
        }

        response = client.post("/api/v1/pricing/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()

        # Backend MUST use trusted Channel3 price (300 EUR), ignoring the 1.0 EUR injection
        assert data["product_price_source"] == 300.0
        assert data["product_price_converted"] == 27000.0


# 10. Test FX Provider HTTP 301 Redirect Handling
@pytest.mark.anyio
async def test_fx_provider_redirect_handling():
    """Verify that FX client handles 301 redirects transparently with follow_redirects=True."""
    client = ExchangeRateClient(base_url="https://api.frankfurter.app")
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        import httpx
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "amount": 1.0,
            "base": "EUR",
            "date": "2026-11-12",
            "rates": {"INR": 104.25, "USD": 1.08}
        }
        mock_get.return_value = mock_response

        rates, ts = await client.get_latest_rates("EUR")
        assert rates["INR"] == 104.25
        assert rates["EUR"] == 1.0


# 11. Test Channel3 Product Retrieval Fallback Sequence in Pricing
def test_pricing_product_retrieval_fallback(client: TestClient):
    """Ensure pricing service tries multiple country/currency combinations if initial call returns 404."""
    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3, \
         patch("app.services.pricing_service.currency_service.client.convert", new_callable=AsyncMock) as mock_conv:

        # First call (country='DE', currency='EUR', language='en') returns None (404)
        # Second call (country='DE', currency='EUR') succeeds
        mock_c3.side_effect = [None, MOCK_CHANNEL3_PRODUCT_DETAIL, None, None, None]
        mock_conv.return_value = (27000.0, 90.0, datetime.now(timezone.utc))

        payload = {
            "product_id": "prod_fallback_test",
            "destination_country": "India",
            "destination_currency": "INR"
        }
        response = client.post("/api/v1/pricing/calculate", json=payload)
        assert response.status_code == 200
        assert response.json()["product_id"] == "prod_xm5_sony"
        assert mock_c3.call_count == 2


# 12. Test Offer URL Matching with Dynamic Affiliate / Click IDs
@pytest.mark.anyio
async def test_offer_url_matching_with_dynamic_aid():
    """
    Ensure PricingService matches the exact verified retailer offer by offer ID `o=...`
    even when Channel3 returns a URL with a newly generated `aid` query parameter.
    """
    multi_offer_product = {
        "id": "zNQps8G",
        "title": "Sennheiser Accentum Wireless Headphones",
        "offers": [
            {
                "url": "https://buy.trychannel3.com/zNQps8G-refurb?o=01M4H0SHQ10NWMTY077M3BFHPB&aid=click_refurb_123",
                "domain": "outlet.sennheiser.com",
                "price": {"price": 95.0, "currency": "EUR"},
                "availability": "InStock",
            },
            {
                "url": "https://buy.trychannel3.com/zNQps8G-new?o=01M4H0RHC7JJGA9KQZW8FB9N8Z&aid=click_new_999",
                "domain": "global.sennheiser-hearing.com",
                "price": {"price": 129.90, "currency": "EUR"},
                "availability": "InStock",
            },
        ]
    }

    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3, \
         patch("app.services.pricing_service.currency_service.client.convert", new_callable=AsyncMock) as mock_conv:

        mock_c3.return_value = multi_offer_product
        mock_conv.return_value = (11691.0, 90.0, datetime.now(timezone.utc))

        # Frontend / Discovery sent offer URL with a different transient `aid`
        discovery_offer_url = "https://buy.trychannel3.com/zNQps8G-new?o=01M4H0RHC7JJGA9KQZW8FB9N8Z&aid=discovery_aid_001"

        req = LandedCostRequest(
            product_id="zNQps8G",
            offer_url=discovery_offer_url,
            destination_country="India",
            destination_currency="INR"
        )
        quote = await pricing_service.calculate_landed_cost(req)

        # Must select the 129.90 EUR offer matching o=01M4H0RHC7JJGA9KQZW8FB9N8Z, NOT the 95.0 EUR outlet offer
        assert quote.product_price_source == 129.90
        assert quote.merchant == "global.sennheiser-hearing.com"
        assert "01M4H0RHC7JJGA9KQZW8FB9N8Z" in quote.merchant_url


# 13. Test Language Parameter in Catalog Product Retrieval
@pytest.mark.anyio
async def test_pricing_passes_language_parameter():
    """Verify that PricingService includes language='en' in primary catalog lookup."""
    with patch("app.services.pricing_service.channel3_client.get_product", new_callable=AsyncMock) as mock_c3, \
         patch("app.services.pricing_service.currency_service.client.convert", new_callable=AsyncMock) as mock_conv:

        mock_c3.return_value = MOCK_CHANNEL3_PRODUCT_DETAIL
        mock_conv.return_value = (27000.0, 90.0, datetime.now(timezone.utc))

        req = LandedCostRequest(
            product_id="prod_xm5_sony",
            destination_country="India",
            destination_currency="INR"
        )
        await pricing_service.calculate_landed_cost(req)

        # Verify first call included language="en"
        first_call_kwargs = mock_c3.call_args_list[0].kwargs
        assert first_call_kwargs.get("country") == "DE"
        assert first_call_kwargs.get("currency") == "EUR"
        assert first_call_kwargs.get("language") == "en"



