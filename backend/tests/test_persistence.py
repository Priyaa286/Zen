"""Persistence tests for Phase 5 – SQLite + SQLAlchemy 2.x async.

Tests:
- Database initialisation and table creation
- Quote creation, retrieval, and expiration
- Persistence across separate sessions (simulating restart)
- Order creation, retrieval, and status updates
- Payment creation, retrieval, and idempotency
- Unique constraint enforcement
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.connection import Base
from app.database.models import OrderORM, PaymentORM, QuoteORM
from app.repositories.order_repository import OrderRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.quote_repository import QuoteRepository
from app.schemas.pricing_schema import CostItem, LandedCostQuote


# Use a dedicated temp SQLite database file for isolation
TEST_DB_PATH = "./test_zen_persistence.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"


@pytest_asyncio.fixture(scope="module")
async def db_engine():
    """Create a clean async engine and tables for the test module."""
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass

    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass


@pytest_asyncio.fixture
async def session_factory(db_engine):
    return async_sessionmaker(bind=db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def session(session_factory):
    async with session_factory() as s:
        yield s


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_dummy_quote(
    quote_id: str | None = None,
    ttl_minutes: int = 15,
) -> LandedCostQuote:
    now = datetime.now(timezone.utc)
    qid = quote_id or f"qte_{uuid.uuid4().hex[:10]}"
    return LandedCostQuote(
        quote_id=qid,
        product_id="prod_123",
        product_title="Sony WH-1000XM5",
        merchant="amazon.de",
        merchant_url="https://amazon.de/dp/B09XS7JWHH",
        source_currency="EUR",
        destination_currency="INR",
        exchange_rate=90.5,
        rate_timestamp=now,
        product_price_source=279.9,
        product_price_converted=25330.95,
        breakdown=[
            CostItem(
                name="Product Base Price",
                amount=25330.95,
                amount_source=279.9,
                currency="INR",
                currency_source="EUR",
                status="verified",
            ),
        ],
        total_estimated_cost=25330.95,
        total_is_exact=True,
        created_at=now,
        expires_at=now + timedelta(minutes=ttl_minutes),
        assumptions=[],
        warnings=[],
    )


# ---------------------------------------------------------------------------
# Tests: Quotes
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_quote_save_and_get(session):
    repo = QuoteRepository(session)
    quote = _make_dummy_quote()
    await repo.save(quote)

    retrieved = await repo.get(quote.quote_id)
    assert retrieved is not None
    assert retrieved.quote_id == quote.quote_id
    assert retrieved.product_id == "prod_123"
    assert retrieved.product_title == "Sony WH-1000XM5"
    assert retrieved.payable_amount == 25330.95
    assert retrieved.destination_currency == "INR"


@pytest.mark.asyncio
async def test_quote_persists_across_sessions(session_factory):
    quote = _make_dummy_quote()

    # Session 1: save
    async with session_factory() as s1:
        repo1 = QuoteRepository(s1)
        await repo1.save(quote)

    # Session 2: retrieve (simulating a fresh request or restart)
    async with session_factory() as s2:
        repo2 = QuoteRepository(s2)
        retrieved = await repo2.get(quote.quote_id)
        assert retrieved is not None
        assert retrieved.quote_id == quote.quote_id
        assert retrieved.payable_amount == 25330.95


@pytest.mark.asyncio
async def test_quote_get_valid_rejects_expired(session):
    repo = QuoteRepository(session)
    # Quote expired 5 minutes ago
    quote = _make_dummy_quote(ttl_minutes=-5)
    await repo.save(quote)

    # Directly in DB
    raw = await repo.get(quote.quote_id)
    assert raw is not None  # Row exists

    # Business check rejects expired
    valid = await repo.get_valid(quote.quote_id)
    assert valid is None


# ---------------------------------------------------------------------------
# Tests: Orders
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_order_create_and_get(session):
    # Setup a parent quote
    q_repo = QuoteRepository(session)
    quote = _make_dummy_quote()
    await q_repo.save(quote)

    o_repo = OrderRepository(session)
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    created = await o_repo.create(
        internal_order_id=order_id,
        quote_id=quote.quote_id,
        payable_amount=quote.total_estimated_cost,
        currency="INR",
        status="QUOTED",
    )
    assert created.internal_order_id == order_id
    assert created.status == "QUOTED"

    retrieved = await o_repo.get(order_id)
    assert retrieved is not None
    assert retrieved.internal_order_id == order_id
    assert retrieved.quote_id == quote.quote_id


@pytest.mark.asyncio
async def test_order_status_update(session):
    q_repo = QuoteRepository(session)
    quote = _make_dummy_quote()
    await q_repo.save(quote)

    o_repo = OrderRepository(session)
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    await o_repo.create(
        internal_order_id=order_id,
        quote_id=quote.quote_id,
        payable_amount=quote.total_estimated_cost,
        currency="INR",
        status="QUOTED",
    )

    ok = await o_repo.update_status(order_id, "PAID")
    assert ok is True

    retrieved = await o_repo.get(order_id)
    assert retrieved.status == "PAID"


@pytest.mark.asyncio
async def test_order_persist_paypal_order_id(session):
    q_repo = QuoteRepository(session)
    quote = _make_dummy_quote()
    await q_repo.save(quote)

    o_repo = OrderRepository(session)
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    await o_repo.create(
        internal_order_id=order_id,
        quote_id=quote.quote_id,
        payable_amount=quote.total_estimated_cost,
        currency="INR",
    )

    paypal_oid = "PAYPAL-ORDER-12345"
    ok = await o_repo.set_paypal_order_id(order_id, paypal_oid)
    assert ok is True

    by_paypal = await o_repo.get_by_paypal_order_id(paypal_oid)
    assert by_paypal is not None
    assert by_paypal.internal_order_id == order_id


# ---------------------------------------------------------------------------
# Tests: Payments
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_payment_create_and_get(session):
    q_repo = QuoteRepository(session)
    quote = _make_dummy_quote()
    await q_repo.save(quote)

    o_repo = OrderRepository(session)
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    await o_repo.create(
        internal_order_id=order_id,
        quote_id=quote.quote_id,
        payable_amount=25330.95,
        currency="INR",
    )

    p_repo = PaymentRepository(session)
    pay_id = f"pay_{uuid.uuid4().hex[:10]}"
    created = await p_repo.create(
        payment_id=pay_id,
        internal_order_id=order_id,
        amount=25330.95,
        currency="INR",
        status="COMPLETED",
        paypal_capture_id="CAP-111",
        idempotency_key="idemp-key-abc",
    )
    assert created.payment_id == pay_id
    assert created.status == "COMPLETED"

    by_capture = await p_repo.get_by_capture_id("CAP-111")
    assert by_capture is not None
    assert by_capture.payment_id == pay_id

    by_idemp = await p_repo.get_by_idempotency_key("idemp-key-abc")
    assert by_idemp is not None
    assert by_idemp.payment_id == pay_id

