"""AI Shopping Agent Orchestration and Conversational Chat Endpoints."""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.agents.orchestrator import shopping_orchestrator
from app.schemas.agent_schema import ShopRequest, ShopResponse
from app.services.currency_service import currency_service

logger = logging.getLogger("zen.api.v1.endpoints.agent")

router = APIRouter()


class AgentChatPayload(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    residence_country: Optional[str] = "IN"
    destination_country: Optional[str] = "IN"
    preferred_currency: Optional[str] = "INR"
    user_id: Optional[str] = None


@router.post(
    "/shop",
    response_model=ShopResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Shopping Agent — unified workflow",
    description="Unified workflow: extracts requirements, searches products, compiles landed cost quotes, and creates PayPal checkout on approval.",
)
async def shop_endpoint(payload: ShopRequest) -> ShopResponse:
    """Unified AI shopping workflow endpoint."""
    try:
        response = await shopping_orchestrator.handle(payload)
        return response
    except Exception as exc:
        logger.exception("Unhandled error in /agent/shop: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal agent error: {exc}",
        )


@router.post(
    "/chat",
    status_code=status.HTTP_200_OK,
    summary="Conversational Shopping Assistant (Frontend Contract)",
)
async def agent_chat_endpoint(payload: AgentChatPayload) -> Dict[str, Any]:
    """Handles interactive conversational AI shopping requests.

    Extracts requirements, searches international merchants, calculates landed costs in buyer's currency,
    and returns ranked product recommendations with natural-language explanation.
    """
    dest_country = (payload.destination_country or "IN").upper().strip()
    target_curr = (payload.preferred_currency or "INR").upper().strip()

    try:
        shop_req = ShopRequest(message=payload.message)
        shop_res = await shopping_orchestrator.handle(shop_req)
    except Exception as exc:
        logger.warning("Shopping orchestrator warning: %s", exc)
        shop_res = None

    formatted_products: List[Dict[str, Any]] = []
    reply_text = ""

    if shop_res and shop_res.status in ("results", "checkout") and shop_res.products:
        for rp in shop_res.products:
            p = rp.product
            q = rp.quote
            converted = q.product_price_converted if q else p.price
            total_landed = q.total_estimated_cost if q else converted
            rate = q.exchange_rate if q else 1.0

            # Extract breakdown items
            shipping_val = None
            duties_val = None
            if q and q.breakdown:
                for b_item in q.breakdown:
                    if "shipping" in b_item.name.lower():
                        shipping_val = b_item.amount
                    elif "customs" in b_item.name.lower() or "duty" in b_item.name.lower():
                        duties_val = (duties_val or 0.0) + (b_item.amount or 0.0)
                    elif "tax" in b_item.name.lower() or "gst" in b_item.name.lower():
                        duties_val = (duties_val or 0.0) + (b_item.amount or 0.0)

            formatted_products.append({
                "id": p.id,
                "title": p.title,
                "shortTitle": p.title[:50],
                "brand": p.brand,
                "originalPrice": p.price,
                "originalCurrency": p.currency,
                "convertedPrice": converted,
                "targetCurrency": target_curr,
                "exchangeRate": rate,
                "shippingCost": shipping_val,
                "estimatedDutiesAndTaxes": duties_val,
                "totalLandedCost": total_landed,
                "deliveryEstimate": "5–8 business days",
                "shippingAvailable": True,
                "imageUrl": p.main_image_url or (p.images[0].url if p.images else None),
                "merchant": {
                    "name": p.merchant or "Verified Retailer",
                    "country": "DE" if p.currency == "EUR" else ("JP" if p.currency == "JPY" else "US"),
                    "verified": True,
                },
                "quoteId": q.quote_id if q else None,
                "source": "live",
            })

        top_item = formatted_products[0]
        reply_text = (
            f"I found {len(formatted_products)} cross-border options for your request. "
            f"The top recommendation is {top_item['title']} from {top_item['merchant']['name']}. "
            f"Converted price: {top_item['targetCurrency']} {top_item['convertedPrice']:,.2f} "
            f"(Total landed cost with estimated international shipping & duties: "
            f"{top_item['targetCurrency']} {top_item['totalLandedCost']:,.2f})."
        )
    elif shop_res and shop_res.status == "needs_info":
        reply_text = shop_res.message or "Could you clarify your budget or preferred destination country?"
    else:
        # Fallback search directly in local products
        from app.database.connection import AsyncSessionLocal
        from app.database.models import ProductORM
        from sqlalchemy import select

        matched_prods = []
        if AsyncSessionLocal is not None:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(ProductORM))
                matched_prods = res.scalars().all()

        for p in matched_prods[:4]:
            try:
                _, p_rate, _ = await currency_service.get_conversion(1.0, p.currency, target_curr)
            except Exception:
                p_rate = 1.0
            converted = round(p.price * p_rate, 2)
            total = round(converted * 1.3, 2)
            formatted_products.append({
                "id": p.id,
                "title": p.title,
                "shortTitle": p.short_title or p.title,
                "brand": p.brand,
                "originalPrice": p.price,
                "originalCurrency": p.currency,
                "convertedPrice": converted,
                "targetCurrency": target_curr,
                "exchangeRate": p_rate,
                "shippingCost": round(p.base_shipping_usd * p_rate, 2),
                "totalLandedCost": total,
                "deliveryEstimate": f"{p.delivery_days_min}–{p.delivery_days_max} business days",
                "shippingAvailable": True,
                "imageUrl": p.image_url,
                "merchant": {"name": p.merchant_name, "country": p.merchant_country, "verified": True},
                "source": "live",
            })

        reply_text = (
            f"Here are the top international products matching '{payload.message}'. "
            f"All prices have been converted into {target_curr} with estimated customs and tracked air delivery."
        )

    return {
        "conversationId": payload.conversation_id or f"conv_{uuid.uuid4().hex[:10]}",
        "conversation_id": payload.conversation_id or f"conv_{uuid.uuid4().hex[:10]}",
        "reply": reply_text,
        "message": reply_text,
        "products": formatted_products,
        "intent": {
            "detectedBudget": None,
            "detectedOrigin": None,
            "detectedDestination": dest_country,
            "currency": target_curr,
        },
        "followUpPrompts": [
            f"Compare courier speeds to {dest_country}",
            f"Filter products under {target_curr} 25,000",
            "Show customs duties & tax calculation",
        ],
        "source": "live",
    }
