from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger("zen.integrations.paypal")


class PayPalError(Exception):
    """Base exception for PayPal operations."""
    pass


class PayPalAuthError(PayPalError):
    """Raised when authentication fails."""
    pass


class PayPalAPIError(PayPalError):
    """Raised when PayPal API returns an error response."""
    def __init__(self, message: str, status_code: Optional[int] = None, error_code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code


class PayPalClient:
    """
    Asynchronous client for PayPal REST API (v1 OAuth2 and v2 Checkout Orders).
    Supports Sandbox and Live modes based on PAYPAL_MODE.
    """

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        mode: Optional[str] = None,
        timeout: float = 15.0,
    ):
        self.client_id = client_id or settings.PAYPAL_CLIENT_ID
        self.client_secret = client_secret or settings.PAYPAL_CLIENT_SECRET
        self.mode = mode or settings.PAYPAL_MODE
        self.timeout = timeout
        
        # Base URL selection
        if self.mode == "live":
            self.base_url = "https://api-m.paypal.com"
        else:
            self.base_url = "https://api-m.sandbox.paypal.com"

        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    async def get_access_token(self) -> str:
        """
        Retrieve OAuth2 bearer token from PayPal.
        Caches token until expiration.
        """
        now = datetime.now(timezone.utc).timestamp()
        if self._access_token and (self._token_expires_at - now) > 60:
            return self._access_token

        if not self.client_id or not self.client_secret:
            raise PayPalAuthError("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not configured.")

        url = f"{self.base_url}/v1/oauth2/token"
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US",
        }
        data = {"grant_type": "client_credentials"}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    auth=(self.client_id, self.client_secret),
                    headers=headers,
                    data=data,
                )

                if response.status_code != 200:
                    logger.error("PayPal OAuth failed (status: %d): %s", response.status_code, response.text)
                    raise PayPalAuthError(f"PayPal authentication failed with status {response.status_code}")

                payload = response.json()
                self._access_token = payload.get("access_token")
                expires_in = payload.get("expires_in", 3600)
                self._token_expires_at = now + expires_in
                return self._access_token

        except httpx.TimeoutException as exc:
            logger.error("PayPal OAuth request timed out")
            raise PayPalError(f"PayPal OAuth timed out after {self.timeout} seconds") from exc
        except (PayPalAuthError, PayPalError):
            raise
        except Exception as exc:
            logger.error("Unexpected error obtaining PayPal token: %s", exc)
            raise PayPalError(f"Unexpected error communicating with PayPal: {str(exc)}") from exc

    def _get_headers(self, token: str) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "Prefer": "return=representation",
        }

    async def create_order(
        self,
        amount: float,
        currency: str,
        reference_id: str,
        description: str,
        return_url: str,
        cancel_url: str,
        item_breakdown: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a PayPal order using POST /v2/checkout/orders.
        """
        token = await self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders"
        headers = self._get_headers(token)

        # PayPal expects formatted string for amounts (e.g. "100.00")
        formatted_amount = f"{amount:.2f}"

        purchase_unit: Dict[str, Any] = {
            "reference_id": reference_id,
            "description": description[:127],  # PayPal description limit
            "amount": {
                "currency_code": currency.upper(),
                "value": formatted_amount,
            },
        }

        if item_breakdown:
            purchase_unit["amount"]["breakdown"] = item_breakdown

        payload: Dict[str, Any] = {
            "intent": "CAPTURE",
            "purchase_units": [purchase_unit],
            "application_context": {
                "return_url": return_url,
                "cancel_url": cancel_url,
                "brand_name": "Zen Shopping Assistant",
                "user_action": "PAY_NOW",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code not in (200, 201):
                    logger.error("PayPal Create Order failed (status %d): %s", response.status_code, response.text)
                    err_code = None
                    err_msg = f"PayPal create order error {response.status_code}"
                    try:
                        err_json = response.json()
                        err_code = err_json.get("name")
                        details = err_json.get("details", [])
                        if details and isinstance(details, list) and isinstance(details[0], dict):
                            err_msg = f"{err_code or 'PayPalError'}: {details[0].get('description') or details[0].get('issue') or err_json.get('message')}"
                        elif err_json.get("message"):
                            err_msg = f"{err_code or 'PayPalError'}: {err_json.get('message')}"
                    except Exception:
                        err_msg = f"PayPal create order error {response.status_code}: {response.text[:200]}"
                    raise PayPalAPIError(err_msg, status_code=response.status_code, error_code=err_code)

                return response.json()

        except httpx.TimeoutException as exc:
            raise PayPalError(f"PayPal Create Order timed out after {self.timeout}s") from exc
        except (PayPalAPIError, PayPalAuthError):
            raise
        except Exception as exc:
            raise PayPalError(f"Error creating PayPal order: {str(exc)}") from exc

    async def capture_order(self, order_id: str) -> Dict[str, Any]:
        """
        Capture payment for an approved order via POST /v2/checkout/orders/{order_id}/capture.
        """
        token = await self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"
        headers = self._get_headers(token)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json={})
                if response.status_code not in (200, 201):
                    logger.error("PayPal Capture Order failed (status %d): %s", response.status_code, response.text)
                    raise PayPalAPIError(f"PayPal capture order error {response.status_code}: {response.text}")

                return response.json()

        except httpx.TimeoutException as exc:
            raise PayPalError(f"PayPal Capture Order timed out after {self.timeout}s") from exc
        except (PayPalAPIError, PayPalAuthError):
            raise
        except Exception as exc:
            raise PayPalError(f"Error capturing PayPal order: {str(exc)}") from exc

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """
        Retrieve order status via GET /v2/checkout/orders/{order_id}.
        """
        token = await self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{order_id}"
        headers = self._get_headers(token)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    raise PayPalAPIError(f"PayPal get order error {response.status_code}: {response.text}")

                return response.json()

        except Exception as exc:
            raise PayPalError(f"Error fetching PayPal order: {str(exc)}") from exc


paypal_client = PayPalClient()

