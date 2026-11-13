import json
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.integrations.ollama_client import (
    OllamaClient,
    OllamaConnectionError,
    OllamaTimeoutError,
)
from app.agents.shopping_agent import ShoppingAgent
from app.schemas.chat import Budget, ShoppingRequirements


# 1. Test Successful Requirement Extraction & Currency Normalization from ₹8000
def test_successful_requirement_extraction_inr(client: TestClient):
    mock_ollama_payload = {
        "product": "handmade ceramic tea set",
        "origin_country": "Japan",
        "destination": {
            "city": "Bengaluru",
            "country": "India"
        },
        "budget": {
            "amount": "8000",
            "currency": "₹"
        },
        "delivery_deadline_days": 21,
        "preferences": ["handmade", "ceramic"]
    }

    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = json.dumps(mock_ollama_payload)

        response = client.post(
            "/api/v1/chat",
            json={"message": "Find a handmade ceramic tea set from Japan under 8000 INR, delivered to Bengaluru within three weeks."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "I understood your shopping requirements."
        assert data["missing_information"] == []
        assert data["requirements"]["product"] == "handmade ceramic tea set"
        assert data["requirements"]["origin_country"] == "Japan"
        assert data["requirements"]["destination"]["city"] == "Bengaluru"
        assert data["requirements"]["destination"]["country"] == "India"
        # Amount must be numeric float
        assert data["requirements"]["budget"]["amount"] == 8000.0
        # Currency must be normalized from "₹" to "INR"
        assert data["requirements"]["budget"]["currency"] == "INR"
        assert data["requirements"]["delivery_deadline_days"] == 21
        assert "handmade" in data["requirements"]["preferences"]

        # Verify chat endpoint was called with system and user messages
        args, kwargs = mock_chat.call_args
        messages = kwargs.get("messages") or args[0]
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"


# 2. Test Currency Normalization: EUR, USD, INR, GBP, JPY
def test_currency_normalization_symbols_and_aliases():
    # € / euro / euros -> EUR
    assert Budget(amount=150, currency="€").currency == "EUR"
    assert Budget(amount=150, currency="euro").currency == "EUR"
    assert Budget(amount=150, currency="euros").currency == "EUR"

    # $ / dollar / dollars -> USD
    assert Budget(amount=100, currency="$").currency == "USD"
    assert Budget(amount=100, currency="dollar").currency == "USD"
    assert Budget(amount=100, currency="dollars").currency == "USD"

    # ₹ / rs / rupees -> INR
    assert Budget(amount=8000, currency="₹").currency == "INR"
    assert Budget(amount=8000, currency="rs").currency == "INR"
    assert Budget(amount=8000, currency="rupees").currency == "INR"

    # £ / pound / pounds -> GBP
    assert Budget(amount=50, currency="£").currency == "GBP"
    assert Budget(amount=50, currency="pound").currency == "GBP"
    assert Budget(amount=50, currency="pounds").currency == "GBP"

    # ¥ / yen -> JPY
    assert Budget(amount=10000, currency="¥").currency == "JPY"
    assert Budget(amount=10000, currency="yen").currency == "JPY"

    # Preserves valid 3-letter ISO codes
    assert Budget(amount=200, currency="CAD").currency == "CAD"
    assert Budget(amount=200, currency="aud").currency == "AUD"


# 3. Test Missing & Invalid Currency
def test_missing_and_invalid_currency():
    # Missing / None
    b_none = Budget(amount=100, currency=None)
    assert b_none.currency is None

    b_empty = Budget(amount=100, currency="")
    assert b_empty.currency is None

    # Invalid / ambiguous: should be None, NOT silently assume USD
    b_invalid = Budget(amount=100, currency="bucks")
    assert b_invalid.currency is None

    b_symbol_unknown = Budget(amount=100, currency="xyz123")
    assert b_symbol_unknown.currency is None


# 4. Test Numeric Budget Amount and Duration Normalization
def test_numeric_budget_and_duration_validation():
    # String budget amount cleaned to float
    b = Budget(amount="1,250.50", currency="USD")
    assert b.amount == 1250.50

    # Positive delivery duration
    req = ShoppingRequirements(
        product="Shoes",
        delivery_deadline_days="14"
    )
    assert req.delivery_deadline_days == 14

    # Negative or invalid duration becomes None
    req_neg = ShoppingRequirements(
        product="Shoes",
        delivery_deadline_days="-5"
    )
    assert req_neg.delivery_deadline_days is None


# 5. Test Missing Budget
def test_missing_budget(client: TestClient):
    mock_ollama_payload = {
        "product": "silk kimono",
        "origin_country": "Japan",
        "destination": {
            "city": "New York",
            "country": "USA"
        },
        "budget": None,
        "delivery_deadline_days": 10,
        "preferences": ["silk"]
    }

    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = json.dumps(mock_ollama_payload)

        response = client.post(
            "/api/v1/chat",
            json={"message": "I want a silk kimono from Japan sent to New York in 10 days."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "partial"
        assert "budget" in data["missing_information"]
        assert data["requirements"]["budget"] is None


# 6. Test Missing Destination
def test_missing_destination(client: TestClient):
    mock_ollama_payload = {
        "product": "mechanical keyboard",
        "origin_country": "Taiwan",
        "destination": None,
        "budget": {
            "amount": 150,
            "currency": "USD"
        },
        "delivery_deadline_days": 7,
        "preferences": ["mechanical"]
    }

    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = json.dumps(mock_ollama_payload)

        response = client.post(
            "/api/v1/chat",
            json={"message": "Buy a mechanical keyboard from Taiwan for $150 within 7 days."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "partial"
        assert "destination" in data["missing_information"]
        assert data["requirements"]["destination"] is None


# 7. Test Missing Delivery Deadline
def test_missing_delivery_deadline(client: TestClient):
    mock_ollama_payload = {
        "product": "olive oil",
        "origin_country": "Greece",
        "destination": {
            "city": "London",
            "country": "UK"
        },
        "budget": {
            "amount": 40,
            "currency": "GBP"
        },
        "delivery_deadline_days": None,
        "preferences": ["extra virgin"]
    }

    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = json.dumps(mock_ollama_payload)

        response = client.post(
            "/api/v1/chat",
            json={"message": "Send extra virgin olive oil from Greece to London for 40 GBP."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "partial"
        assert "delivery_deadline" in data["missing_information"]
        assert data["requirements"]["delivery_deadline_days"] is None


# 8. Test Invalid Model Output with Retry Recovery
def test_invalid_model_output_with_retry(client: TestClient):
    valid_payload = {
        "product": "tea set",
        "origin_country": "Japan",
        "destination": {"city": "Bengaluru", "country": "India"},
        "budget": {"amount": 5000, "currency": "INR"},
        "delivery_deadline_days": 14,
        "preferences": []
    }

    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.side_effect = [
            "This is not valid json at all",
            json.dumps(valid_payload),
        ]

        response = client.post(
            "/api/v1/chat",
            json={"message": "Find a tea set from Japan to Bengaluru for 5000 INR in 14 days."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["requirements"]["product"] == "tea set"
        assert mock_chat.call_count == 2


# 9. Test Ollama Connection Failure
def test_ollama_connection_failure(client: TestClient):
    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.side_effect = OllamaConnectionError("Connection refused")

        response = client.post(
            "/api/v1/chat",
            json={"message": "Find me a wool sweater."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "unavailable" in data["message"].lower()
        assert data["requirements"] is None


# 10. Test Model Timeout
def test_model_timeout(client: TestClient):
    with patch("app.agents.shopping_agent.ollama_client.chat", new_callable=AsyncMock) as mock_chat:
        mock_chat.side_effect = OllamaTimeoutError("Timed out")

        response = client.post(
            "/api/v1/chat",
            json={"message": "Find me leather boots."}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "timed out" in data["message"].lower()
        assert data["requirements"] is None
