"""Async SQLAlchemy engine and session factory.

Provides:
- ``engine``        – async engine (lazy, created on first call to ``init_engine``)
- ``AsyncSessionLocal`` – async session factory
- ``get_db``        – FastAPI dependency that yields a session per request
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger("zen.database.connection")

# Engine is created lazily by init_engine() called at app startup.
engine = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def init_engine(database_url: str | None = None) -> None:
    """Create the async engine and session factory.

    Call once at application startup (from ``init_db``).
    Safe to call multiple times – subsequent calls are no-ops.
    """
    global engine, AsyncSessionLocal
    if engine is not None:
        return  # Already initialised

    url = database_url or settings.DATABASE_URL
    logger.info("Initialising async database engine: %s", url)

    engine = create_async_engine(
        url,
        echo=False,       # Set to True for SQL query logging during debug
        future=True,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    logger.info("Database engine ready.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yield a database session per request."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database engine not initialised. Call init_engine() first.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

