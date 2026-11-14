"""International Product Discovery, Search and Details Endpoints."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import ProductORM, SellerStoreORM
from app.schemas.chat import Budget, Destination, ShoppingRequirements
from app.schemas.product_schema import ProductSearchResponse
from app.services.currency_service import currency_service
from app.services.product_service import product_service

logger = logging.getLogger("zen.api.products")

router = APIRouter()


class FrontendSearchPayload(BaseModel):
    query: Optional[str] = ""
    destination_country: Optional[str] = "IN"
    preferred_currency: Optional[str] = "INR"
    origin_country: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    in_stock_only: Optional[bool] = False
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    sort_by: Optional[str] = "relevance"


class CompareRequest(BaseModel):
    product_ids: List[str]
    destination_country: Optional[str] = "IN"
    preferred_currency: Optional[str] = "INR"


def _format_product(p: ProductORM, rate: float, target_currency: str) -> Dict[str, Any]:
    converted = round(p.price * rate, 2)
    shipping_in_curr = round(p.base_shipping_usd * (rate if target_currency == "INR" else 1.0), 2)
    duties_in_curr = round(converted * p.duty_rate, 2)
    taxes_in_curr = round((converted + duties_in_curr) * p.tax_rate, 2)
    total_landed = round(converted + shipping_in_curr + duties_in_curr + taxes_in_curr, 2)

    return {
        "id": p.id,
        "title": p.title,
        "shortTitle": p.short_title or p.title,
        "brand": p.brand,
        "category": p.category,
        "categorySlug": p.category_slug,
        "subcategory": p.subcategory,
        "originalPrice": p.price,
        "originalCurrency": p.currency,
        "convertedPrice": converted,
        "targetCurrency": target_currency,
        "exchangeRate": rate,
        "shippingCost": shipping_in_curr,
        "estimatedDutiesAndTaxes": round(duties_in_curr + taxes_in_curr, 2),
        "totalLandedCost": total_landed,
        "deliveryEstimate": f"{p.delivery_days_min}–{p.delivery_days_max} business days",
        "estimatedDeliveryDays": {"min": p.delivery_days_min, "max": p.delivery_days_max},
        "shippingAvailable": True,
        "imageUrl": p.image_url,
        "images": [p.image_url] if p.image_url else [],
        "description": p.description,
        "rating": p.rating,
        "reviewCount": p.review_count,
        "availability": p.availability,
        "merchant": {
            "name": p.merchant_name,
            "country": p.merchant_country,
            "verified": bool(p.merchant_verified),
            "rating": p.merchant_rating,
            "dispatchLocation": p.dispatch_location,
        },
        "source": "live",
    }


@router.post(
    "/search",
    status_code=status.HTTP_200_OK,
    summary="Search international products across multi-vendor catalog and Channel3",
)
async def search_products_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Discovers international products. Supports both Frontend payload and ShoppingRequirements."""
    body = await request.json()

    # If payload is ShoppingRequirements (has 'product' or 'destination' without 'query')
    if "product" in body and "query" not in body:
        requirements = ShoppingRequirements(**body)
        response = await product_service.search_products(requirements)
        if response.status == "error":
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Product discovery service error: {response.message}",
            )
        return response

    # Frontend search request
    payload = FrontendSearchPayload(**body)
    query = (payload.query or "").strip().lower()
    target_currency = (payload.preferred_currency or "INR").upper().strip()
    dest_country = (payload.destination_country or "IN").upper().strip()

    # Query local SQLite products
    res = await db.execute(select(ProductORM))
    all_products = res.scalars().all()

    # Get FX rate
    try:
        _, rate_usd, _ = await currency_service.get_conversion(1.0, "USD", target_currency)
    except Exception:
        rate_usd = 88.0 if target_currency == "INR" else 1.0

    filtered = []
    for p in all_products:
        # Category filter
        if payload.category and payload.category != "ALL":
            cat_filter = payload.category.lower()
            p_cat = (p.category or "").lower()
            p_slug = (p.category_slug or "").lower()
            if cat_filter != p_cat and cat_filter != p_slug and cat_filter not in p_slug:
                continue

        # Origin filter
        if payload.origin_country and payload.origin_country != "ALL":
            if p.merchant_country.upper() != payload.origin_country.upper():
                continue

        # Stock filter
        if payload.in_stock_only and p.availability != "in_stock":
            continue

        # Query text match
        if query:
            terms = query.split()
            hay = f"{p.title} {p.brand or ''} {p.category or ''} {p.subcategory or ''} {p.merchant_name}".lower()
            if not any(t in hay for t in terms):
                continue

        # Compute rate for product's native currency
        try:
            _, p_rate, _ = await currency_service.get_conversion(1.0, p.currency, target_currency)
        except Exception:
            p_rate = rate_usd

        item = _format_product(p, p_rate, target_currency)

        # Budget filters
        if payload.min_budget and item["convertedPrice"] < payload.min_budget:
            continue
        if payload.max_budget and item["convertedPrice"] > payload.max_budget:
            continue

        filtered.append(item)

    # Sort
    sort_by = payload.sort_by or "relevance"
    if sort_by == "price_asc":
        filtered.sort(key=lambda x: x["convertedPrice"] or 0)
    elif sort_by == "price_desc":
        filtered.sort(key=lambda x: x["convertedPrice"] or 0, reverse=True)
    elif sort_by == "rating_desc":
        filtered.sort(key=lambda x: x["rating"] or 0, reverse=True)
    elif sort_by == "fastest":
        filtered.sort(key=lambda x: x["estimatedDeliveryDays"]["min"])

    return {
        "products": filtered,
        "total": len(filtered),
        "currency": target_currency,
        "destination_country": dest_country,
        "source": "live",
    }


@router.get("/{product_id}", status_code=status.HTTP_200_OK)
async def get_product_by_id(
    product_id: str,
    destination_country: str = Query("IN"),
    preferred_currency: str = Query("INR"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full product details by product ID with live FX conversion."""
    res = await db.execute(select(ProductORM).where(ProductORM.id == product_id))
    p = res.scalar_one_or_none()

    if not p:
        # Fallback to Channel3
        try:
            raw = await product_service.client.get_product(product_id)
            if raw:
                norm = product_service.normalize_product(raw)
                return {
                    "product": {
                        "id": norm.id,
                        "title": norm.title,
                        "brand": norm.brand,
                        "originalPrice": norm.price,
                        "originalCurrency": norm.currency,
                        "convertedPrice": norm.price,
                        "targetCurrency": preferred_currency,
                        "merchant": {"name": norm.merchant, "country": "US", "verified": True},
                        "imageUrl": norm.main_image_url,
                        "description": norm.description,
                        "shippingAvailable": True,
                        "source": "live",
                    }
                }
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{product_id}' was not found in catalog.",
        )

    target_curr = preferred_currency.upper().strip()
    try:
        _, p_rate, _ = await currency_service.get_conversion(1.0, p.currency, target_curr)
    except Exception:
        p_rate = 1.0

    prod_formatted = _format_product(p, p_rate, target_curr)
    return {"product": prod_formatted, **prod_formatted}


@router.post("/compare", status_code=status.HTTP_200_OK)
async def compare_products(
    payload: CompareRequest,
    db: AsyncSession = Depends(get_db),
):
    """Compare multiple international products with side-by-side landed cost breakdowns."""
    res = await db.execute(select(ProductORM).where(ProductORM.id.in_(payload.product_ids)))
    products = res.scalars().all()

    target_curr = (payload.preferred_currency or "INR").upper().strip()
    comparison = []
    for p in products:
        try:
            _, p_rate, _ = await currency_service.get_conversion(1.0, p.currency, target_curr)
        except Exception:
            p_rate = 1.0
        comparison.append(_format_product(p, p_rate, target_curr))

    return {"products": comparison, "total": len(comparison), "currency": target_curr}


@router.get("/meta/merchants", status_code=status.HTTP_200_OK)
@router.get("/merchants", status_code=status.HTTP_200_OK)
async def get_merchants(db: AsyncSession = Depends(get_db)):
    """List verified international merchants and dispatch hubs."""
    res = await db.execute(select(SellerStoreORM))
    stores = res.scalars().all()

    results = [
        {
            "id": s.id,
            "name": s.store_name,
            "country": s.country,
            "baseCurrency": s.base_currency,
            "dispatchLocation": s.dispatch_location,
            "rating": s.rating,
            "verified": bool(s.is_approved),
        }
        for s in stores
    ]

    # Add verified international partner merchants
    partners = [
        {"id": "amazon-us", "name": "Amazon US Global Store", "country": "US", "baseCurrency": "USD", "dispatchLocation": "Seattle, WA, USA", "rating": 4.8, "verified": True},
        {"id": "bh-photo", "name": "B&H Photo Video", "country": "US", "baseCurrency": "USD", "dispatchLocation": "New York, NY, USA", "rating": 4.9, "verified": True},
        {"id": "john-lewis", "name": "John Lewis & Partners", "country": "GB", "baseCurrency": "GBP", "dispatchLocation": "Milton Keynes, UK", "rating": 4.7, "verified": True},
        {"id": "harrods", "name": "Harrods London", "country": "GB", "baseCurrency": "GBP", "dispatchLocation": "Knightsbridge, London, UK", "rating": 4.9, "verified": True},
    ]

    return {"merchants": results + partners}
