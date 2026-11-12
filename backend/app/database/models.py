"""SQLAlchemy ORM models for persistent storage.

These are *database* models only – not API schemas.
Pydantic API schemas remain in ``app/schemas/``.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class QuoteORM(Base):
    __tablename__ = "quotes"

    quote_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    product_id: Mapped[str] = mapped_column(String, nullable=False)
    product_title: Mapped[str] = mapped_column(String, nullable=False)
    merchant: Mapped[str | None] = mapped_column(String, nullable=True)
    merchant_url: Mapped[str | None] = mapped_column(String, nullable=True)
    source_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    destination_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    payable_amount: Mapped[float] = mapped_column(Float, nullable=False)
    total_estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_is_exact: Mapped[int] = mapped_column(Integer, default=0)  # 0=estimated, 1=exact
    breakdown_json: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON-serialised list
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    orders: Mapped[list["OrderORM"]] = relationship("OrderORM", back_populates="quote")


class OrderORM(Base):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("paypal_order_id", name="uq_orders_paypal_order_id"),
    )

    internal_order_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    quote_id: Mapped[str] = mapped_column(ForeignKey("quotes.quote_id"), nullable=False)
    paypal_order_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="QUOTED")
    payable_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    quote: Mapped["QuoteORM"] = relationship("QuoteORM", back_populates="orders")
    payments: Mapped[list["PaymentORM"]] = relationship("PaymentORM", back_populates="order")


class PaymentORM(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("paypal_capture_id", name="uq_payments_paypal_capture_id"),
    )

    payment_id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    internal_order_id: Mapped[str] = mapped_column(ForeignKey("orders.internal_order_id"), nullable=False)
    paypal_capture_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["OrderORM"] = relationship("OrderORM", back_populates="payments")

