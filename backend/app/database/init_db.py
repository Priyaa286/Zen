"""Database initialisation – called at FastAPI startup.

Usage (in app/main.py):
    from app.database.init_db import on_startup, on_shutdown
    app.add_event_handler("startup", on_startup)
    app.add_event_handler("shutdown", on_shutdown)
"""

from __future__ import annotations

import logging

from app.database.connection import Base, engine, init_engine

logger = logging.getLogger("zen.database.init_db")


async def on_startup(database_url: str | None = None) -> None:
    """Initialise engine and create all tables if they don't exist."""
    import app.database.connection as db_conn
    # Import ORM models so Base.metadata is fully populated with all tables
    import app.database.models  # noqa: F401

    db_conn.init_engine(database_url)
    assert db_conn.engine is not None, "Engine must be initialised before creating tables."
    async with db_conn.engine.begin() as conn:
        # Creates tables that do not yet exist; never drops existing ones.
        await conn.run_sync(db_conn.Base.metadata.create_all)
    logger.info("Database tables verified / created.")


async def on_shutdown() -> None:
    """Dispose of the async engine on application shutdown."""
    import app.database.connection as db_conn
    if db_conn.engine is not None:
        await db_conn.engine.dispose()
        logger.info("Database engine disposed.")

