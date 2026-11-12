"""Quote repository – async CRUD operations for QuoteORM."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import QuoteORM
from app.schemas.pricing_schema import LandedCostQuote

logger = logging.getLogger("zen.repositories.quote")


class QuoteRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save(self, quote: LandedCostQuote) -> None:
        """Persist a landed-cost quote to the database."""
        breakdown_json = json.dumps(
            [item.model_dump() for item in quote.breakdown]
        )
        # payable_amount = total_estimated_cost (best available total); store None if unknown
        orm = QuoteORM(
            quote_id=quote.quote_id,
            product_id=quote.product_id,
            product_title=quote.product_title,
            merchant=quote.merchant,
            merchant_url=quote.merchant_url,
            source_currency=quote.source_currency,
            destination_currency=quote.destination_currency,
            payable_amount=quote.total_estimated_cost or quote.product_price_converted,
            total_estimated_cost=quote.total_estimated_cost,
            total_is_exact=1 if quote.total_is_exact else 0,
            breakdown_json=breakdown_json,
            created_at=quote.created_at,
            expires_at=quote.expires_at,
        )
        self.session.add(orm)
        await self.session.commit()
        logger.info("Saved quote %s to database.", quote.quote_id)

    async def get(self, quote_id: str) -> Optional[QuoteORM]:
        """Retrieve a quote by ID (returns None if not found)."""
        result = await self.session.execute(
            select(QuoteORM).where(QuoteORM.quote_id == quote_id)
        )
        return result.scalar_one_or_none()

    async def get_valid(self, quote_id: str) -> Optional[QuoteORM]:
        """Retrieve a quote only if it has not expired."""
        orm = await self.get(quote_id)
        if orm is None:
            return None
        now = datetime.now(timezone.utc)
        # expires_at may be timezone-naive in SQLite; normalise.
        exp = orm.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            logger.info("Quote %s has expired.", quote_id)
            return None
        return orm
