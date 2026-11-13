import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("zen.integrations.ollama")


class OllamaClientError(Exception):
    """Base exception for Ollama client errors."""
    pass


class OllamaConnectionError(OllamaClientError):
    """Raised when connecting to Ollama fails."""
    pass


class OllamaTimeoutError(OllamaClientError):
    """Raised when Ollama request times out."""
    pass


class OllamaClient:
    """
    Asynchronous client for interacting with the local Ollama instance.
    Supports /api/chat with think: false and format: json.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        think: Optional[bool] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout if timeout is not None else settings.OLLAMA_TIMEOUT
        self.think = think if think is not None else settings.OLLAMA_THINK

    async def chat(
        self,
        messages: List[Dict[str, str]],
        format: Optional[str] = "json",
        think: Optional[bool] = None,
    ) -> str:
        """
        Call Ollama's /api/chat endpoint asynchronously.

        Args:
            messages: List of chat messages (e.g. [{"role": "user", "content": ...}]).
            format: Output format ('json' for structured response).
            think: Suppress thinking tokens if False.

        Returns:
            The raw text content from the assistant message.
        """
        url = f"{self.base_url}/api/chat"
        use_think = self.think if think is None else think

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "think": use_think,
        }

        if format:
            payload["format"] = format

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                message_obj = data.get("message", {})
                return message_obj.get("content", "")

        except httpx.ConnectError as exc:
            logger.error("Failed to connect to Ollama at %s: %s", self.base_url, exc)
            raise OllamaConnectionError(
                f"Cannot connect to Ollama at {self.base_url}. Ensure the Ollama service is running."
            ) from exc

        except httpx.TimeoutException as exc:
            logger.error("Ollama request timed out after %.1f seconds: %s", self.timeout, exc)
            raise OllamaTimeoutError(
                f"Ollama request timed out after {self.timeout} seconds."
            ) from exc

        except httpx.HTTPStatusError as exc:
            logger.error("Ollama HTTP status error %s: %s", exc.response.status_code, exc.response.text)
            raise OllamaClientError(
                f"Ollama returned HTTP error {exc.response.status_code}: {exc.response.text}"
            ) from exc

        except Exception as exc:
            logger.error("Unexpected error contacting Ollama: %s", exc)
            raise OllamaClientError(f"Unexpected error communicating with Ollama: {str(exc)}") from exc

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        format: Optional[str] = "json",
        think: Optional[bool] = None,
    ) -> str:
        """
        Unified helper method: invokes chat endpoint with provided prompt.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        return await self.chat(messages=messages, format=format, think=think)


ollama_client = OllamaClient()
