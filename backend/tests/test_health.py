from fastapi.testclient import TestClient
from app.core.config import settings


def test_root_health_endpoint(client: TestClient) -> None:
    """
    Test GET /health returns 200 and expected health metadata.
    """
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == settings.APP_NAME
    assert data["environment"] == settings.ENVIRONMENT
    assert data["version"] == settings.VERSION
    assert "timestamp" in data


def test_api_v1_health_endpoint(client: TestClient) -> None:
    """
    Test GET /api/v1/health returns 200 and expected health metadata.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == settings.APP_NAME
    assert data["environment"] == settings.ENVIRONMENT
    assert data["version"] == settings.VERSION
    assert "timestamp" in data


def test_not_found_error_format(client: TestClient) -> None:
    """
    Test 404 response matches centralized ErrorResponse schema.
    """
    response = client.get("/non-existent-route")
    assert response.status_code == 404

    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"
    assert "message" in data["error"]

