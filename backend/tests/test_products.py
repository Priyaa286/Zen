import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.integrations.channel3_client import (
    Channel3AuthError,
    Channel3Client,
    Channel3TimeoutError,
    Channel3ValidationError,
)
from app.schemas.chat import Budget, Destination, ShoppingRequirements
from app.schemas.product_schema import NormalizedProduct
from app.services.product_service import product_service


MOCK_CHANNEL3_SEARCH_RESPONSE = {
    "products": [
        {
            "id": "prod_12345",
            "title": "Japanese Ceramic Matcha Tea Set with Whisk",
            "description": "Authentic handmade ceramic tea set made in Kyoto.",
            "brands": [{"id": "b_1", "name": "Kyoto Crafts"}],
            "images": [
                {
                    "url": "https://cdn.merchant.de/images/tea_set_1.jpg",
                    "cleaned_url": "https://cdn.channel3.com/clean/tea_set_1.jpg",
                    "is_main_image": True,
                    "alt_text": "Ceramic Tea Set"
                }
            ],
            "offers": [
                {
                    "url": "https://www.teashop.de/products/matcha-set",
                    "domain": "teashop.de",
                    "price": {
                        "price": 65.50,
                        "compare_at_price": 79.99,
                        "currency": "EUR"
                    },
                    "availability": "InStock",
                    "condition": "new"
                }
            ]
        }
    ],
    "next_page_token": None
}


# 1. Successful Channel3 Product Search with Verified Offers
def test_successful_channel3_product_search(client: TestClient):
    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = MOCK_CHANNEL3_SEARCH_RESPONSE

        payload = {
            "product": "ceramic tea set",
            "origin_country": "Japan",
            "preferences": ["handmade"],
            "destination": {"city": "Bengaluru", "country": "India"},
            "budget": {"amount": 8000, "currency": "INR"},
            "delivery_deadline_days": 21
        }

        response = client.post("/api/v1/products/search", json=payload)
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "success"
        assert len(data["products"]) == 1

        product = data["products"][0]
        assert product["id"] == "prod_12345"
        assert product["title"] == "Japanese Ceramic Matcha Tea Set with Whisk"
        assert product["brand"] == "Kyoto Crafts"
        assert product["price"] == 65.50
        assert product["currency"] == "EUR"
        assert product["merchant"] == "teashop.de"
        assert product["merchant_url"] == "https://www.teashop.de/products/matcha-set"
        assert product["main_image_url"] == "https://cdn.channel3.com/clean/tea_set_1.jpg"

        # Verify shipping safety requirement: shipping_status unknown, delivery_estimate None
        assert product["shipping_status"] == "unknown"
        assert product["delivery_estimate"] is None

        # Verify metadata
        assert data["metadata"]["currency"] == "EUR"
        assert data["metadata"]["locale"] == "de"
        assert data["metadata"]["total_results"] == 1


# 2. Test Offer Normalization: Scalar Price Format
def test_normalize_offer_scalar_price():
    offer_raw = {
        "url": "https://store.de/item1",
        "domain": "store.de",
        "price": 149.99,
        "compare_at_price": 199.99,
        "currency": "eur",
        "availability": "InStock",
        "condition": "new"
    }
    normalized = product_service.normalize_offer(offer_raw)
    assert normalized is not None
    assert normalized.price == 149.99
    assert normalized.compare_at_price == 199.99
    assert normalized.currency == "EUR"
    assert normalized.domain == "store.de"
    assert normalized.merchant_name is None
    assert normalized.availability == "InStock"


# 3. Test Offer Normalization: Nested Price Object
def test_normalize_offer_nested_price_object():
    offer_raw = {
        "url": "https://buy.channel3.com/abc",
        "domain": "sennheiser.com",
        "merchant_name": "Sennheiser Official",
        "price": {
            "price": 279.9,
            "compare_at_price": 320.0,
            "currency": "EUR"
        },
        "availability": "InStock",
        "condition": "new"
    }
    normalized = product_service.normalize_offer(offer_raw)
    assert normalized is not None
    assert normalized.price == 279.9
    assert normalized.compare_at_price == 320.0
    assert normalized.currency == "EUR"
    assert normalized.domain == "sennheiser.com"
    assert normalized.merchant_name == "Sennheiser Official"


# 4. Test Offer Normalization: Missing Nested Price
def test_normalize_offer_missing_nested_price():
    offer_raw = {
        "url": "https://store.de/item",
        "domain": "store.de",
        "price": {
            "price": None,
            "currency": "EUR"
        }
    }
    normalized = product_service.normalize_offer(offer_raw)
    # Must be None, never converted to 0
    assert normalized is None


# 5. Test Offer Normalization: Invalid Price Value
def test_normalize_offer_invalid_price():
    offer_raw = {
        "url": "https://store.de/item",
        "domain": "store.de",
        "price": "not-a-number",
        "currency": "EUR"
    }
    normalized = product_service.normalize_offer(offer_raw)
    assert normalized is None


# 6. Test Offer Normalization: Missing Currency
def test_normalize_offer_missing_currency():
    offer_raw = {
        "url": "https://store.de/item",
        "domain": "store.de",
        "price": 50.0,
        "currency": None
    }
    normalized = product_service.normalize_offer(offer_raw)
    assert normalized is None


# 7. Test Multiple Offers: Product Picks Best Valid Offer (Lowest Price)
def test_multiple_offers_picks_best_valid():
    raw_prod = {
        "id": "prod_multi_01",
        "title": "Dual Offer Product",
        "offers": [
            {
                "url": "https://expensive.de/p",
                "domain": "expensive.de",
                "price": {"price": 120.0, "currency": "EUR"}
            },
            {
                "url": "https://bargain.de/p",
                "domain": "bargain.de",
                "price": {"price": 89.0, "currency": "EUR"}
            },
            {
                "url": "https://invalid.de/p",
                "domain": "invalid.de",
                "price": None
            }
        ]
    }
    norm_p = product_service.normalize_product(raw_prod)
    assert len(norm_p.offers) == 2
    # Best offer is 89.0
    assert norm_p.price == 89.0
    assert norm_p.currency == "EUR"
    assert norm_p.merchant == "bargain.de"
    assert norm_p.merchant_url == "https://bargain.de/p"


# 8. Test Product with No Valid Offers
def test_product_with_no_valid_offers():
    raw_prod = {
        "id": "prod_none_01",
        "title": "Unobtainable Item",
        "offers": [
            {"price": None, "currency": "EUR"},
            {"price": "abc", "currency": "EUR"}
        ]
    }
    norm_p = product_service.normalize_product(raw_prod)
    assert norm_p.offers == []
    assert norm_p.price is None
    assert norm_p.currency is None
    assert norm_p.merchant is None
    assert norm_p.merchant_url is None


# 9. Correct Budget Filtering Using Nested Prices
def test_budget_filtering_with_nested_prices(client: TestClient):
    raw_products = {
        "products": [
            {
                "id": "p1",
                "title": "Within Budget Headphones",
                "offers": [
                    {
                        "domain": "shop1.de",
                        "price": {"price": 60.0, "currency": "EUR"}
                    }
                ]
            },
            {
                "id": "p2",
                "title": "Over Budget Headphones",
                "offers": [
                    {
                        "domain": "shop2.de",
                        "price": {"price": 160.0, "currency": "EUR"}
                    }
                ]
            }
        ]
    }

    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = raw_products

        payload = {
            "product": "Headphones",
            "budget": {"amount": 100.0, "currency": "EUR"}
        }

        response = client.post("/api/v1/products/search", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["metadata"]["budget_applied"] is True
        assert len(data["products"]) == 1
        assert data["products"][0]["id"] == "p1"
        assert data["products"][0]["price"] == 60.0


# 10. Test Brand Preference Filtering: Exact Match and Separation
def test_brand_preference_filtering_with_exact_matches(client: TestClient):
    raw_products = {
        "products": [
            {"id": "p1", "title": "Sennheiser Momentum 4", "brands": [{"name": "Sennheiser"}], "offers": []},
            {"id": "p2", "title": "Sony WH-1000XM4", "brands": [{"name": "Sony"}], "offers": []},
            {"id": "p3", "title": "Marshall Major IV", "brands": [{"name": "Marshall"}], "offers": []},
        ]
    }

    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search, \
         patch("app.services.product_service.channel3_client.get_product", new_callable=AsyncMock) as mock_get:
        mock_search.return_value = raw_products
        mock_get.return_value = None

        payload = {
            "product": "over-ear headphones",
            "preferences": ["Sony"]
        }

        response = client.post("/api/v1/products/search", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert len(data["products"]) == 1
        assert data["products"][0]["brand"] == "Sony"
        assert data["metadata"]["has_exact_brand_match"] is True

        assert len(data["alternative_products"]) == 2
        for alt in data["alternative_products"]:
            assert alt["brand"] != "Sony"


# 11. Test Brand Preference Filtering: No Exact Match Indicator
def test_brand_preference_filtering_no_matches(client: TestClient):
    raw_products = {
        "products": [
            {"id": "p1", "title": "Sennheiser Momentum 4", "brands": [{"name": "Sennheiser"}], "offers": []},
            {"id": "p2", "title": "Marshall Major IV", "brands": [{"name": "Marshall"}], "offers": []},
        ]
    }

    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search, \
         patch("app.services.product_service.channel3_client.get_product", new_callable=AsyncMock) as mock_get:
        mock_search.return_value = raw_products
        mock_get.return_value = None

        payload = {
            "product": "over-ear headphones",
            "preferences": ["Sony"]
        }

        response = client.post("/api/v1/products/search", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["metadata"]["has_exact_brand_match"] is False
        assert "No exact matches found for brand(s): Sony" in data["message"]
        assert len(data["products"]) == 2


# 12. Budget Metadata When Prices Are Missing: budget_applied=False
def test_budget_metadata_when_prices_missing(client: TestClient):
    raw_products = {
        "products": [
            {"id": "p1", "title": "Sony Headset", "brands": [{"name": "Sony"}], "offers": []}
        ]
    }

    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search, \
         patch("app.services.product_service.channel3_client.get_product", new_callable=AsyncMock) as mock_get:
        mock_search.return_value = raw_products
        mock_get.return_value = None

        payload = {
            "product": "Sony Headset",
            "budget": {"amount": 200.0, "currency": "EUR"}
        }

        response = client.post("/api/v1/products/search", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["metadata"]["budget_applied"] is False
        assert "pending or unverified" in data["metadata"]["budget_note"].lower()


# 13. Test API Key Auth, config usage, and NO context property
@pytest.mark.anyio
async def test_channel3_client_auth_header_and_config():
    client = Channel3Client(base_url="https://api.trychannel3.com", api_key="test-zen-key-secret")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: {"products": []}
        mock_response.raise_for_status = lambda: None
        mock_post.return_value = mock_response

        german_config = {
            "country": "DE",
            "currency": "EUR",
            "language": "en"
        }
        res = await client.search(query="matcha", config=german_config, limit=10)
        assert res == {"products": []}

        call_kwargs = mock_post.call_args[1]
        headers = call_kwargs.get("headers", {})
        assert headers.get("x-api-key") == "test-zen-key-secret"
        assert headers.get("Content-Type") == "application/json"
        
        json_body = call_kwargs.get("json", {})
        assert json_body["query"] == "matcha"
        assert json_body["limit"] == 10
        assert "context" not in json_body
        assert json_body.get("config") == german_config


# 14. Test Channel3 Timeout Handling
def test_channel3_timeout_handling(client: TestClient):
    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = Channel3TimeoutError("Channel3 timed out")

        payload = {"product": "headphones"}
        response = client.post("/api/v1/products/search", json=payload)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data
        assert "timed out" in data["error"]["message"].lower()


# 15. Test Channel3 Auth Failure Handling
def test_channel3_auth_failure_handling(client: TestClient):
    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = Channel3AuthError("Channel3 authentication failed with status 401.")

        payload = {"product": "running shoes"}
        response = client.post("/api/v1/products/search", json=payload)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data
        assert "authentication failed" in data["error"]["message"].lower()


# 16. Upstream HTTP 422 Handling
def test_channel3_upstream_422_handling(client: TestClient):
    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.side_effect = Channel3ValidationError(
            "Channel3 request validation failed (status 422): Extra inputs are not permitted"
        )

        payload = {"product": "ceramic bowl"}
        response = client.post("/api/v1/products/search", json=payload)

        assert response.status_code == 502
        data = response.json()
        assert "error" in data
        assert "validation failed" in data["error"]["message"].lower()


# 17. Shipping Information Not Fabricated
def test_shipping_information_not_fabricated(client: TestClient):
    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = MOCK_CHANNEL3_SEARCH_RESPONSE

        payload = {
            "product": "tea set",
            "destination": {"city": "Bengaluru", "country": "India"}
        }

        response = client.post("/api/v1/products/search", json=payload)
        data = response.json()
        for p in data["products"]:
            assert p["shipping_status"] == "unknown"
            assert p["delivery_estimate"] is None


# 18. Exact Product Matches Prioritized Over Related Products (Headphones vs Earbuds)
def test_exact_product_ranking_over_related_earbuds(client: TestClient):
    """
    Ensure exact product category (Over-ear Headphones) is ranked above related
    products in a different category (Earbuds), even if earbuds have a lower price.
    """
    earbuds = {
        "id": "prod_earbuds",
        "title": "Sennheiser ACCENTUM Open Wireless Earbuds",
        "offers": [{"url": "http://store.de/eb", "price": 89.99, "currency": "EUR"}]
    }
    headphones = {
        "id": "prod_headphones",
        "title": "Sennheiser Accentum Wireless Over-Ear Headphones",
        "offers": [{"url": "http://store.de/hp", "price": 129.90, "currency": "EUR"}]
    }

    mock_search_data = {
        "products": [earbuds, headphones],
        "next_page_token": None
    }

    with patch("app.services.product_service.channel3_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_search_data

        payload = {
            "product": "Sennheiser Accentum wireless headphones",
            "destination": {"city": "Bengaluru", "country": "India"}
        }

        response = client.post("/api/v1/products/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 2
        # Headphones must be ranked 1st despite higher price because category relevance is stronger
        assert data["products"][0]["id"] == "prod_headphones"
        assert "Headphones" in data["products"][0]["title"]
        assert data["products"][1]["id"] == "prod_earbuds"


# 19. Delivery Transparency: Unknown Delivery Explicitly Returned
def test_unknown_delivery_status_explicitly_returned():
    """Verify that when delivery is unknown, it is explicitly returned as unknown and not confirmed."""
    from app.services.shipping_service import shipping_service
    # Country with unknown carrier routes
    cost_item = shipping_service.get_shipping_cost(
        origin_country="Germany",
        destination_country="Antarctica",
        source_currency="EUR",
        destination_currency="USD",
        exchange_rate=1.1,
    )
    assert cost_item.status == "unknown"
    assert cost_item.amount is None
    assert "Carrier quote unavailable" in cost_item.rate_or_detail

    # Country with estimated routes must have status='estimated' and explicitly note pending carrier quote
    cost_item_india = shipping_service.get_shipping_cost(
        origin_country="Germany",
        destination_country="India",
        source_currency="EUR",
        destination_currency="INR",
        exchange_rate=90.0,
    )
    assert cost_item_india.status == "estimated"
    assert "Carrier quote pending" in cost_item_india.rate_or_detail
    assert "Logistics Estimate" in cost_item_india.rate_or_detail

