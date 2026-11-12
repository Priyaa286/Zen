"""
Phase 6: AI Agent orchestration endpoint.

POST /api/v1/agent/shop
  - Single unified endpoint for the full shopping journey.
  - Accepts a natural-language request.
  - Returns extracted requirements, ranked products with landed-cost quotes,
    and (after buyer approval) a PayPal checkout order.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.agents.orchestrator import shopping_orchestrator
from app.schemas.agent_schema import ShopRequest, ShopResponse

logger = logging.getLogger("zen.api.v1.endpoints.agent")

router = APIRouter()


@router.post(
    "/shop",
    response_model=ShopResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Shopping Agent — unified workflow",
    description=(
        "Accepts a natural-language shopping request. "
        "Extracts requirements, searches international products via Channel3, "
        "calculates transparent landed-cost quotes, and ranks results. "
        "When approve_quote_id is provided (with return_url and cancel_url), "
        "creates a PayPal order for buyer approval. "
        "Prices are NEVER accepted from the client — amounts are always "
        "derived from server-side verified quotes."
    ),
)
async def shop_endpoint(payload: ShopRequest) -> ShopResponse:
    """
    Unified AI shopping workflow endpoint.

    Returns status values:
    - 'needs_info'  → more details required from user
    - 'results'     → ranked products with quotes ready for review
    - 'checkout'    → PayPal order created; redirect buyer to approval_url
    - 'error'       → unrecoverable failure with explanation
    """
    try:
        response = await shopping_orchestrator.handle(payload)
        return response
    except Exception as exc:
        logger.exception("Unhandled error in /agent/shop: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal agent error: {exc}",
        )

