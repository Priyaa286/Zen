"""Seed initial data for Zen Multi-Vendor Borderless Marketplace."""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    AuditLogORM,
    OrderORM,
    ProductORM,
    QuoteORM,
    SavedProductORM,
    SellerStoreORM,
    UserORM,
)

logger = logging.getLogger("zen.database.seed_data")


def hash_password(password: str) -> str:
    """Deterministic hash for demo and development."""
    return hashlib.sha256(f"zen_salt_{password}".encode("utf-8")).hexdigest()


SEED_USERS = [
    {
        "id": "usr_buyer_aarav",
        "email": "buyer@zen.global",
        "password_hash": hash_password("ZenSecure2026!"),
        "full_name": "Aarav Sharma",
        "role": "buyer",
        "residence_country": "IN",
        "preferred_currency": "INR",
        "default_delivery_country": "IN",
        "onboarding_completed": 1,
        "show_original_price_badge": 1,
        "compact_currency_format": 0,
    },
    {
        "id": "usr_seller_kenji",
        "email": "seller@zen.global",
        "password_hash": hash_password("ZenSecure2026!"),
        "full_name": "Kenji Sato",
        "role": "seller",
        "residence_country": "JP",
        "preferred_currency": "JPY",
        "default_delivery_country": "JP",
        "onboarding_completed": 1,
        "show_original_price_badge": 1,
        "compact_currency_format": 0,
    },
    {
        "id": "usr_admin_elena",
        "email": "admin@zen.global",
        "password_hash": hash_password("ZenSecure2026!"),
        "full_name": "Elena Vance",
        "role": "admin",
        "residence_country": "US",
        "preferred_currency": "USD",
        "default_delivery_country": "US",
        "onboarding_completed": 1,
        "show_original_price_badge": 1,
        "compact_currency_format": 0,
    },
]

SEED_STORES = [
    {
        "id": "store_tokyo_optics",
        "user_id": "usr_seller_kenji",
        "store_name": "Tokyo Optics & Craft",
        "business_registration": "JP-TYO-98214-C",
        "country": "JP",
        "base_currency": "JPY",
        "dispatch_location": "Tokyo Logistics Terminal (Chuo-ku, Japan)",
        "status": "APPROVED",
        "rating": 4.95,
        "review_count": 312,
        "is_approved": 1,
    }
]

SEED_PRODUCTS = [
    {
        "id": "prod-sony-xm5-amazon-us",
        "store_id": None,
        "title": "Sony WH-1000XM5 Wireless Industry-Leading Noise Canceling Headphones",
        "short_title": "Sony WH-1000XM5 Headphones",
        "brand": "Sony",
        "category": "Audio",
        "category_slug": "electronics",
        "subcategory": "Headphones",
        "price": 278.0,
        "currency": "USD",
        "merchant_name": "Amazon US Global Store",
        "merchant_country": "US",
        "merchant_verified": 1,
        "merchant_rating": 4.8,
        "dispatch_location": "Seattle, WA, USA",
        "image_url": "/images/products/sony-xm5.jpg",
        "description": "Flagship over-ear ANC headphones featuring two processors controlling eight microphones, Auto NC Optimizer, crystal-clear hands-free calling, and up to 30 hours of battery life with USB-PD quick charging.",
        "stock_quantity": 45,
        "availability": "in_stock",
        "base_shipping_usd": 19.5,
        "delivery_days_min": 5,
        "delivery_days_max": 8,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.8,
        "review_count": 14280,
    },
    {
        "id": "prod-sony-xm5-bh-us",
        "store_id": None,
        "title": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones (Midnight Blue)",
        "short_title": "Sony WH-1000XM5 (B&H US)",
        "brand": "Sony",
        "category": "Audio",
        "category_slug": "electronics",
        "subcategory": "Headphones",
        "price": 298.0,
        "currency": "USD",
        "merchant_name": "B&H Photo Video",
        "merchant_country": "US",
        "merchant_verified": 1,
        "merchant_rating": 4.9,
        "dispatch_location": "New York, NY, USA",
        "image_url": "/images/products/sony-xm5.jpg",
        "description": "Premium Sony WH-1000XM5 over-ear wireless headphones in limited Midnight Blue finish with high-res audio LDAC and Speak-to-Chat.",
        "stock_quantity": 28,
        "availability": "in_stock",
        "base_shipping_usd": 24.0,
        "delivery_days_min": 6,
        "delivery_days_max": 9,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.9,
        "review_count": 4820,
    },
    {
        "id": "prod-marshall-stanmore-uk",
        "store_id": None,
        "title": "Marshall Stanmore III Bluetooth Home Speaker (Black)",
        "short_title": "Marshall Stanmore III Speaker",
        "brand": "Marshall",
        "category": "Audio",
        "category_slug": "electronics",
        "subcategory": "Home Audio",
        "price": 299.0,
        "currency": "GBP",
        "merchant_name": "John Lewis & Partners",
        "merchant_country": "GB",
        "merchant_verified": 1,
        "merchant_rating": 4.7,
        "dispatch_location": "Milton Keynes, United Kingdom",
        "image_url": "/images/products/marshall-stanmore.jpg",
        "description": "Legendary Marshall home audio speaker re-engineered with wider stereo soundstage and Bluetooth 5.2. Iconic brass accents and vintage script logo.",
        "stock_quantity": 18,
        "availability": "in_stock",
        "base_shipping_usd": 32.0,
        "delivery_days_min": 4,
        "delivery_days_max": 7,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.7,
        "review_count": 1890,
    },
    {
        "id": "prod-leica-dlux8-de",
        "store_id": "store_tokyo_optics",
        "title": "Leica D-Lux 8 Compact Digital Camera (DC Vario-Summilux Lens)",
        "short_title": "Leica D-Lux 8 Camera",
        "brand": "Leica",
        "category": "Cameras",
        "category_slug": "electronics",
        "subcategory": "Digital Cameras",
        "price": 248000.0,
        "currency": "JPY",
        "merchant_name": "Tokyo Optics & Craft",
        "merchant_country": "JP",
        "merchant_verified": 1,
        "merchant_rating": 4.95,
        "dispatch_location": "Tokyo Logistics Terminal (Chuo-ku, Japan)",
        "image_url": "/images/products/leica-camera.jpg",
        "description": "Pure Leica design and user interface. 4/3-inch CMOS sensor paired with legendary Leica DC Vario-Summilux 10.9–34mm f/1.7–2.8 ASPH zoom lens. Shipped in original factory Japanese export boxing.",
        "stock_quantity": 8,
        "availability": "in_stock",
        "base_shipping_usd": 38.0,
        "delivery_days_min": 3,
        "delivery_days_max": 5,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.95,
        "review_count": 86,
    },
    {
        "id": "prod-keychron-q1-pro-sg",
        "store_id": "store_tokyo_optics",
        "title": "Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard (Barebone/Knob)",
        "short_title": "Keychron Q1 Pro Keyboard",
        "brand": "Keychron",
        "category": "Peripherals",
        "category_slug": "electronics",
        "subcategory": "Keyboards",
        "price": 29800.0,
        "currency": "JPY",
        "merchant_name": "Tokyo Optics & Craft",
        "merchant_country": "JP",
        "merchant_verified": 1,
        "merchant_rating": 4.9,
        "dispatch_location": "Tokyo Logistics Terminal (Chuo-ku, Japan)",
        "image_url": "/images/products/keychron-q1.jpg",
        "description": "Full CNC machined aluminum body, double-gasket design, Bluetooth 5.1 wireless + Type-C wired connection. Hot-swappable PCB supporting both 3-pin and 5-pin MX switches.",
        "stock_quantity": 24,
        "availability": "in_stock",
        "base_shipping_usd": 18.0,
        "delivery_days_min": 3,
        "delivery_days_max": 6,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.9,
        "review_count": 1240,
    },
    {
        "id": "prod-nintendo-switch-oled-jp",
        "store_id": "store_tokyo_optics",
        "title": "Nintendo Switch OLED Model Japanese Domestic Edition (White Joy-Con)",
        "short_title": "Nintendo Switch OLED (Japan)",
        "brand": "Nintendo",
        "category": "Gaming",
        "category_slug": "electronics",
        "subcategory": "Consoles",
        "price": 37980.0,
        "currency": "JPY",
        "merchant_name": "Tokyo Optics & Craft",
        "merchant_country": "JP",
        "merchant_verified": 1,
        "merchant_rating": 4.95,
        "dispatch_location": "Tokyo Logistics Terminal (Chuo-ku, Japan)",
        "image_url": "/images/products/switch-oled.jpg",
        "description": "Vibrant 7-inch OLED screen, wide adjustable stand, dock with wired LAN port, 64 GB internal storage, and enhanced audio. Region-free, 100V-240V multi-voltage USB-C adapter included.",
        "stock_quantity": 30,
        "availability": "in_stock",
        "base_shipping_usd": 22.0,
        "delivery_days_min": 3,
        "delivery_days_max": 5,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.95,
        "review_count": 3410,
    },
    {
        "id": "prod-dyson-airwrap-complete-uk",
        "store_id": None,
        "title": "Dyson Airwrap Multi-Styler Complete Long (Nickel/Copper)",
        "short_title": "Dyson Airwrap Multi-Styler",
        "brand": "Dyson",
        "category": "Beauty",
        "category_slug": "beauty",
        "subcategory": "Hair Styling",
        "price": 479.99,
        "currency": "GBP",
        "merchant_name": "Harrods London",
        "merchant_country": "GB",
        "merchant_verified": 1,
        "merchant_rating": 4.9,
        "dispatch_location": "Knightsbridge, London, UK",
        "image_url": "/images/products/dyson-airwrap.jpg",
        "description": "Styles hair using the Coanda airflow effect without extreme heat. Includes re-engineered barrels that curl in both directions, brushes for control, and multi-functional Coanda smoothing dryer.",
        "stock_quantity": 14,
        "availability": "in_stock",
        "base_shipping_usd": 35.0,
        "delivery_days_min": 4,
        "delivery_days_max": 7,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.9,
        "review_count": 2150,
    },
    {
        "id": "prod-kindle-paperwhite-us",
        "store_id": None,
        "title": "Amazon Kindle Paperwhite Signature Edition (32 GB, Wireless Charging)",
        "short_title": "Kindle Paperwhite Signature",
        "brand": "Amazon",
        "category": "E-Readers",
        "category_slug": "books",
        "subcategory": "E-Readers",
        "price": 189.99,
        "currency": "USD",
        "merchant_name": "Amazon US Global Store",
        "merchant_country": "US",
        "merchant_verified": 1,
        "merchant_rating": 4.8,
        "dispatch_location": "Phoenix, AZ, USA",
        "image_url": "/images/products/kindle-paperwhite.jpg",
        "description": "6.8-inch 300 ppi glare-free screen with auto-adjusting front light, wireless charging, and 32 GB of storage. Up to 10 weeks of battery life per charge.",
        "stock_quantity": 50,
        "availability": "in_stock",
        "base_shipping_usd": 16.0,
        "delivery_days_min": 5,
        "delivery_days_max": 8,
        "duty_rate": 0.10,
        "tax_rate": 0.18,
        "rating": 4.8,
        "review_count": 32900,
    },
]


async def seed_database(session: AsyncSession) -> None:
    """Populate database with initial seed records if empty."""
    # 1. Seed Users
    user_res = await session.execute(select(UserORM).limit(1))
    if not user_res.scalar_one_or_none():
        for u_data in SEED_USERS:
            user = UserORM(**u_data)
            session.add(user)
        await session.commit()
        logger.info("Seeded %d demo personas.", len(SEED_USERS))

    # 2. Seed Stores
    store_res = await session.execute(select(SellerStoreORM).limit(1))
    if not store_res.scalar_one_or_none():
        for s_data in SEED_STORES:
            store = SellerStoreORM(**s_data)
            session.add(store)
        await session.commit()
        logger.info("Seeded %d verified merchant store.", len(SEED_STORES))

    # 3. Seed Products
    prod_res = await session.execute(select(ProductORM).limit(1))
    if not prod_res.scalar_one_or_none():
        for p_data in SEED_PRODUCTS:
            prod = ProductORM(**p_data)
            session.add(prod)
        await session.commit()
        logger.info("Seeded %d international products into catalog.", len(SEED_PRODUCTS))

    # 4. Seed Audit Log Event
    log_res = await session.execute(select(AuditLogORM).limit(1))
    if not log_res.scalar_one_or_none():
        log = AuditLogORM(
            id="audit_init_bootstrap",
            event_type="SYSTEM_BOOTSTRAP",
            actor_email="admin@zen.global",
            target_id="system",
            action="Zen Borderless Buying Platform initialized with multi-vendor support.",
            details_json=json.dumps({"version": "2.0", "multi_vendor": True, "currencies_active": 8}),
        )
        session.add(log)
        await session.commit()
