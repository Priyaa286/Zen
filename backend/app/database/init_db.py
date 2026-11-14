"""Database initialisation – called at FastAPI startup.

Usage (in app/main.py):
    from app.database.init_db import on_startup, on_shutdown
"""

from __future__ import annotations

import logging

from app.database.connection import Base, engine, init_engine

logger = logging.getLogger("zen.database.init_db")


def _migrate_columns_sync(conn):
    """Safely migrate any missing columns on SQLite tables."""
    try:
        cursor = conn.cursor() if hasattr(conn, "cursor") else conn.connection.cursor()
        cursor.execute("PRAGMA table_info(seller_stores)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        new_cols = [
            ("slug", "VARCHAR(255)"),
            ("legal_business_name", "VARCHAR(255)"),
            ("registration_number", "VARCHAR(255)"),
            ("tax_id", "VARCHAR(100)"),
            ("business_phone", "VARCHAR(50)"),
            ("business_address", "TEXT"),
            ("primary_category", "VARCHAR(100)"),
            ("description", "TEXT"),
            ("bank_name", "VARCHAR(255)"),
            ("bank_account_holder", "VARCHAR(255)"),
            ("bank_country", "VARCHAR(10)"),
            ("bank_account_masked", "VARCHAR(50)"),
            ("bank_swift_bic", "VARCHAR(50)"),
            ("bank_settlement_currency", "VARCHAR(10)"),
            ("bank_details_encrypted", "TEXT"),
            ("verification_documents_json", "TEXT"),
            ("agreement_version", "VARCHAR(50)"),
            ("agreement_accepted_at", "DATETIME"),
            ("admin_notes", "TEXT"),
            ("reviewed_by", "VARCHAR(255)"),
            ("reviewed_at", "DATETIME"),
        ]
        for col_name, col_type in new_cols:
            if col_name not in existing_cols:
                cursor.execute(f"ALTER TABLE seller_stores ADD COLUMN {col_name} {col_type}")
    except Exception as exc:
        logger.debug("Column migration note: %s", exc)


async def on_startup(database_url: str | None = None) -> None:
    """Initialise engine, create all tables, and seed baseline marketplace data."""
    import app.database.connection as db_conn
    import app.database.models  # noqa: F401
    from app.database.seed_data import seed_database

    db_conn.init_engine(database_url)
    assert db_conn.engine is not None, "Engine must be initialised before creating tables."
    async with db_conn.engine.begin() as conn:
        await conn.run_sync(db_conn.Base.metadata.create_all)
        await conn.run_sync(_migrate_columns_sync)
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
