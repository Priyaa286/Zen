"""User Profile, Personalization and Wishlist Endpoints."""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import _format_user_response
from app.core.security import get_current_user
from app.database.connection import get_db
from app.database.models import OrderORM, ProductORM, SavedProductORM, UserORM
from app.services.currency_service import currency_service

logger = logging.getLogger("zen.api.users")

router = APIRouter(prefix="/users", tags=["Users"])


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    residence_country: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    residence_country: Optional[str] = None
    preferred_currency: Optional[str] = None
    default_delivery_country: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    show_original_price_badge: Optional[bool] = None
    compact_currency_format: Optional[bool] = None


class SaveProductRequest(BaseModel):
    product_id: str


@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_profile(user: UserORM = Depends(get_current_user)):
    """Fetch user profile."""
    return {"profile": _format_user_response(user), "user": _format_user_response(user)}


@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update personal details."""
    if payload.full_name is not None and payload.full_name.strip():
        user.full_name = payload.full_name.strip()
    if payload.residence_country is not None and payload.residence_country.strip():
        user.residence_country = payload.residence_country.strip().upper()

    await db.commit()
    await db.refresh(user)
    return {"profile": _format_user_response(user), "user": _format_user_response(user)}


@router.put("/preferences", status_code=status.HTTP_200_OK)
async def update_preferences(
    payload: PreferencesUpdateRequest,
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update localization and display preferences."""
    if payload.residence_country:
        user.residence_country = payload.residence_country.strip().upper()
    if payload.preferred_currency:
        user.preferred_currency = payload.preferred_currency.strip().upper()
    if payload.default_delivery_country:
        user.default_delivery_country = payload.default_delivery_country.strip().upper()
    if payload.onboarding_completed is not None:
        user.onboarding_completed = 1 if payload.onboarding_completed else 0
    if payload.show_original_price_badge is not None:
        user.show_original_price_badge = 1 if payload.show_original_price_badge else 0
    if payload.compact_currency_format is not None:
        user.compact_currency_format = 1 if payload.compact_currency_format else 0

    await db.commit()
    await db.refresh(user)
    return {"user": _format_user_response(user)}


@router.get("/saved-products", status_code=status.HTTP_200_OK)
async def get_saved_products(
    destination_country: str = Query("IN"),
    preferred_currency: str = Query("INR"),
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get buyer's saved wishlist products with live FX converted prices."""
    res = await db.execute(
        select(SavedProductORM).where(SavedProductORM.user_id == user.id)
    )
    saved_entries = res.scalars().all()
    product_ids = [e.product_id for e in saved_entries]

    if not product_ids:
        return []

    p_res = await db.execute(select(ProductORM).where(ProductORM.id.in_(product_ids)))
    products = p_res.scalars().all()

    target_curr = preferred_currency.upper().strip()
    result = []
    for p in products:
        try:
            converted, rate, _ = await currency_service.get_conversion(p.price, p.currency, target_curr)
        except Exception:
            converted = p.price
            rate = 1.0

        result.append({
            "id": p.id,
            "title": p.title,
            "shortTitle": p.short_title or p.title,
            "brand": p.brand,
            "category": p.category,
            "originalPrice": p.price,
            "originalCurrency": p.currency,
            "convertedPrice": converted,
            "targetCurrency": target_curr,
            "exchangeRate": rate,
            "shippingCost": round(p.base_shipping_usd * (rate if target_curr == "INR" else 1.0), 2),
            "imageUrl": p.image_url,
            "rating": p.rating,
            "availability": p.availability,
            "merchant": {
                "name": p.merchant_name,
                "country": p.merchant_country,
                "verified": bool(p.merchant_verified),
                "rating": p.merchant_rating,
                "dispatchLocation": p.dispatch_location,
            },
        })

    return result


@router.post("/saved-products", status_code=status.HTTP_201_CREATED)
async def save_product(
    payload: SaveProductRequest,
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a product to buyer's saved wishlist."""
    existing = await db.execute(
        select(SavedProductORM).where(
            SavedProductORM.user_id == user.id,
            SavedProductORM.product_id == payload.product_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"ok": True, "saved": True}

    entry = SavedProductORM(
        id=f"sv_{uuid.uuid4().hex[:10]}",
        user_id=user.id,
        product_id=payload.product_id,
    )
    db.add(entry)
    await db.commit()
    return {"ok": True, "saved": True, "id": entry.id}


@router.delete("/saved-products/{product_id}", status_code=status.HTTP_200_OK)
async def remove_saved_product(
    product_id: str,
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a product from buyer's saved wishlist."""
    await db.execute(
        delete(SavedProductORM).where(
            SavedProductORM.user_id == user.id,
            SavedProductORM.product_id == product_id,
        )
    )
    await db.commit()
    return {"ok": True, "removed": True}


@router.get("/orders", status_code=status.HTTP_200_OK)
async def get_user_orders(
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get verified purchase history for the current user."""
    res = await db.execute(
        select(OrderORM)
        .where((OrderORM.user_id == user.id) | (OrderORM.customer_email == user.email))
        .order_by(OrderORM.created_at.desc())
    )
    orders = res.scalars().all()

    result = []
    for o in orders:
        bd = json.loads(o.breakdown_json) if o.breakdown_json else None
        items = json.loads(o.items_json) if o.items_json else None
        addr = json.loads(o.shipping_address_json) if o.shipping_address_json else None

        result.append({
            "orderId": o.internal_order_id,
            "order_id": o.internal_order_id,
            "orderNumber": o.internal_order_id.replace("ord_", "ZEN-").upper(),
            "paypalOrderId": o.paypal_order_id,
            "status": o.status,
            "payableAmount": o.payable_amount,
            "currency": o.currency,
            "productTitle": o.product_title or "Cross-Border Package",
            "merchantName": o.merchant_name or "Verified Merchant",
            "quantity": o.quantity,
            "totalAmount": o.total_landed_cost or o.payable_amount,
            "destinationCountry": o.destination_country,
            "shippingAddress": addr,
            "breakdown": bd,
            "items": items,
            "createdAt": o.created_at.isoformat() if o.created_at else None,
            "tracking": {
                "carrier": o.tracking_carrier,
                "trackingNumber": o.tracking_number,
                "originWarehouse": o.tracking_origin,
                "estimatedDeliveryDays": o.tracking_est_days,
            } if o.tracking_carrier else None,
        })

    return {"orders": result}
