"""Database initialisation – called at FastAPI startup.

Usage (in app/main.py):
    from app.database.init_db import on_startup, on_shutdown
"""

from __future__ import annotations

import logging

from app.database.connection import Base, engine, init_engine

logger = logging.getLogger("zen.database.init_db")


async def on_startup(database_url: str | None = None) -> None:
    """Initialise engine, create all tables, and seed baseline marketplace data."""
    import app.database.connection as db_conn
    import app.database.models  # noqa: F401
    from app.database.seed_data import seed_database

    db_conn.init_engine(database_url)
    assert db_conn.engine is not None, "Engine must be initialised before creating tables."
    async with db_conn.engine.begin() as conn:
        await conn.run_sync(db_conn.Base.metadata.create_all)
    logger.info("Database tables verified / created.")

    # Seed baseline demo personas and verified international product catalog
    if db_conn.AsyncSessionLocal is not None:
        async with db_conn.AsyncSessionLocal() as session:
            try:
                await seed_database(session)
            except Exception as seed_err:
                logger.warning("Data seeding skipped or encountered issue: %s", seed_err)


async def on_shutdown() -> None:
    """Dispose of the async engine on application shutdown."""
    import app.database.connection as db_conn
    if db_conn.engine is not None:
        await db_conn.engine.dispose()
        logger.info("Database engine disposed.")
