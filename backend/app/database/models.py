"""SQLAlchemy ORM models for persistent storage.

These are database models only – not API schemas.
Pydantic API schemas remain in app/schemas/.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="buyer", nullable=False)
    residence_country: Mapped[str] = mapped_column(String(10), default="IN", nullable=False)
    preferred_currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    default_delivery_country: Mapped[str] = mapped_column(String(10), default="IN", nullable=False)
    onboarding_completed: Mapped[int] = mapped_column(Integer, default=1)
    show_original_price_badge: Mapped[int] = mapped_column(Integer, default=1)
    compact_currency_format: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    store: Mapped[Optional["SellerStoreORM"]] = relationship("SellerStoreORM", back_populates="user", uselist=False)
    orders: Mapped[List["OrderORM"]] = relationship("OrderORM", back_populates="user")
    saved_items: Mapped[List["SavedProductORM"]] = relationship("SavedProductORM", back_populates="user")


class SellerStoreORM(Base):
    __tablename__ = "seller_stores"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    store_name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_registration: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[str] = mapped_column(String(10), default="JP", nullable=False)
    base_currency: Mapped[str] = mapped_column(String(10), default="JPY", nullable=False)
    dispatch_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="APPROVED", nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=4.9)
    review_count: Mapped[int] = mapped_column(Integer, default=128)
    is_approved: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    user: Mapped["UserORM"] = relationship("UserORM", back_populates="store")
    products: Mapped[List["ProductORM"]] = relationship("ProductORM", back_populates="store")


class ProductORM(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    store_id: Mapped[Optional[str]] = mapped_column(ForeignKey("seller_stores.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    short_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    category_slug: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    subcategory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    merchant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    merchant_country: Mapped[str] = mapped_column(String(10), default="US", nullable=False)
    merchant_verified: Mapped[int] = mapped_column(Integer, default=1)
    merchant_rating: Mapped[float] = mapped_column(Float, default=4.8)
    dispatch_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    images_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    highlights_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specs_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=50)
    availability: Mapped[str] = mapped_column(String(50), default="in_stock")
    base_shipping_usd: Mapped[float] = mapped_column(Float, default=15.0)
    delivery_days_min: Mapped[int] = mapped_column(Integer, default=4)
    delivery_days_max: Mapped[int] = mapped_column(Integer, default=8)
    duty_rate: Mapped[float] = mapped_column(Float, default=0.10)
    tax_rate: Mapped[float] = mapped_column(Float, default=0.18)
    rating: Mapped[float] = mapped_column(Float, default=4.8)
    review_count: Mapped[int] = mapped_column(Integer, default=240)
    status: Mapped[str] = mapped_column(String(50), default="APPROVED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    store: Mapped[Optional["SellerStoreORM"]] = relationship("SellerStoreORM", back_populates="products")


class SavedProductORM(Base):
    __tablename__ = "saved_products"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_saved_products_user_prod"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    user: Mapped["UserORM"] = relationship("UserORM", back_populates="saved_items")


class AuditLogORM(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    actor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    target_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class QuoteORM(Base):
    __tablename__ = "quotes"

    quote_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    product_id: Mapped[str] = mapped_column(String, nullable=False)
    product_title: Mapped[str] = mapped_column(String, nullable=False)
    merchant: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    merchant_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    destination_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    payable_amount: Mapped[float] = mapped_column(Float, nullable=False)
    total_estimated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_is_exact: Mapped[int] = mapped_column(Integer, default=0)
    breakdown_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    orders: Mapped[List["OrderORM"]] = relationship("OrderORM", back_populates="quote")


class OrderORM(Base):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("paypal_order_id", name="uq_orders_paypal_order_id"),
    )

    internal_order_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    quote_id: Mapped[str] = mapped_column(ForeignKey("quotes.quote_id"), nullable=False)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    store_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    paypal_order_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="QUOTED")
    payable_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    product_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    product_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    total_landed_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    destination_country: Mapped[Optional[str]] = mapped_column(String(10), default="IN", nullable=True)
    shipping_address_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    breakdown_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    items_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tracking_carrier: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tracking_origin: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tracking_est_days: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    quote: Mapped["QuoteORM"] = relationship("QuoteORM", back_populates="orders")
    user: Mapped[Optional["UserORM"]] = relationship("UserORM", back_populates="orders")
    payments: Mapped[List["PaymentORM"]] = relationship("PaymentORM", back_populates="order")


class PaymentORM(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("paypal_capture_id", name="uq_payments_paypal_capture_id"),
    )

    payment_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    internal_order_id: Mapped[str] = mapped_column(ForeignKey("orders.internal_order_id"), nullable=False)
    paypal_capture_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["OrderORM"] = relationship("OrderORM", back_populates="payments")


class WebhookEventORM(Base):
    __tablename__ = "webhook_events"

    event_id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="PROCESSED", nullable=False)
    payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class NotificationORM(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(255), primary_key=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    store_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_read: Mapped[int] = mapped_column(Integer, default=0, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
