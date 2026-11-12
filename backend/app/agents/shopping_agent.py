import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from app.agents.prompts import RETRY_JSON_PROMPT, SHOPPING_AGENT_SYSTEM_PROMPT
from app.integrations.ollama_client import (
    OllamaClient,
    OllamaClientError,
    OllamaConnectionError,
    OllamaTimeoutError,
    ollama_client,
)
from app.schemas.chat import (
    Budget,
    ChatResponse,
    Destination,
    ShoppingRequirements,
)

logger = logging.getLogger("zen.agents.shopping")


class ShoppingAgent:
    """
    Agent responsible for understanding natural language shopping queries,
    extracting structured cross-border shopping requirements, detecting missing
    parameters, and adhering strictly to safety guidelines.
    """

    def __init__(self, client: Optional[OllamaClient] = None):
        self.client = client or ollama_client

    def _clean_json_text(self, text: str) -> str:
        """
        Strip markdown fencing or prefix text if the model outputs code blocks.
        """
        cleaned = text.strip()
        if "```" in cleaned:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
            if match:
                cleaned = match.group(1).strip()
        return cleaned

    def _parse_and_validate(self, raw_text: str) -> Optional[ShoppingRequirements]:
        """
        Attempt to parse raw JSON into a validated ShoppingRequirements Pydantic model.
        """
        cleaned = self._clean_json_text(raw_text)
        try:
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                return None

            # Handle destination object or null
            dest = data.get("destination")
            destination_obj = None
            if isinstance(dest, dict) and (dest.get("city") or dest.get("country")):
                destination_obj = Destination(
                    city=dest.get("city"),
                    country=dest.get("country")
                )

            # Handle budget object or null
            bgt = data.get("budget")
            budget_obj = None
            if isinstance(bgt, dict) and (bgt.get("amount") is not None or bgt.get("currency")):
                budget_obj = Budget(
                    amount=bgt.get("amount"),
                    currency=bgt.get("currency")
                )

            # Handle preferences
            raw_prefs = data.get("preferences") or []
            preferences = [str(p) for p in raw_prefs if p]

            return ShoppingRequirements(
                product=data.get("product"),
                origin_country=data.get("origin_country"),
                destination=destination_obj,
                budget=budget_obj,
                delivery_deadline_days=data.get("delivery_deadline_days"),
                preferences=preferences,
            )
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            logger.warning("Failed to parse requirements from text: %s. Error: %s", raw_text, exc)
            return None

    def _identify_missing_information(self, req: Optional[ShoppingRequirements]) -> List[str]:
        """
        Check which critical cross-border shopping variables are missing.
        """
        missing: List[str] = []
        if not req or not req.product:
            missing.append("product")

        if not req or not req.destination or not (req.destination.city or req.destination.country):
            missing.append("destination")
        elif not req.destination.city:
            missing.append("destination_city")
        elif not req.destination.country:
            missing.append("destination_country")

        if not req or not req.budget or req.budget.amount is None or not req.budget.currency:
            missing.append("budget")

        if not req or req.delivery_deadline_days is None:
            missing.append("delivery_deadline")

        return missing

    async def process_message(self, message: str) -> ChatResponse:
        """
        Analyze user shopping query with Ollama via /api/chat and return structured response.
        """
        messages = [
            {"role": "system", "content": SHOPPING_AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": f'Analyze this shopping request: "{message}"'}
        ]

        try:
            raw_response = await self.client.chat(
                messages=messages,
                format="json",
            )
        except OllamaConnectionError as exc:
            logger.error("Ollama connection error: %s", exc)
            return ChatResponse(
                message="AI service is currently unavailable. Please verify local Ollama service is active.",
                requirements=None,
                missing_information=["product", "destination", "budget", "delivery_deadline"],
                status="error",
            )
        except OllamaTimeoutError as exc:
            logger.error("Ollama timeout error: %s", exc)
            return ChatResponse(
                message="AI service timed out while processing your request. Please try again.",
                requirements=None,
                missing_information=["product", "destination", "budget", "delivery_deadline"],
                status="error",
            )
        except OllamaClientError as exc:
            logger.error("Ollama client error: %s", exc)
            return ChatResponse(
                message="An error occurred communicating with the AI service.",
                requirements=None,
                missing_information=["product", "destination", "budget", "delivery_deadline"],
                status="error",
            )

        # Parse & Validate
        requirements = self._parse_and_validate(raw_response)

        # Retry once if initial extraction failed
        if requirements is None:
            logger.info("Retrying extraction with structured JSON prompt...")
            try:
                retry_messages = [
                    {"role": "system", "content": "You are a JSON-only extraction system."},
                    {"role": "user", "content": RETRY_JSON_PROMPT.format(message=message)}
                ]
                retry_response = await self.client.chat(
                    messages=retry_messages,
                    format="json",
                )
                requirements = self._parse_and_validate(retry_response)
            except Exception as exc:
                logger.warning("Retry attempt failed: %s", exc)

        missing_info = self._identify_missing_information(requirements)

        if requirements is None:
            return ChatResponse(
                message="Could not extract structured shopping requirements from your message. Please provide more details.",
                requirements=None,
                missing_information=missing_info,
                status="partial",
            )

        status_str = "success" if not missing_info else "partial"
        message_str = "I understood your shopping requirements." if status_str == "success" else (
            f"I extracted your request, but need additional details: {', '.join(missing_info)}."
        )

        return ChatResponse(
            message=message_str,
            requirements=requirements,
            missing_information=missing_info,
            status=status_str,
        )


shopping_agent = ShoppingAgent()
