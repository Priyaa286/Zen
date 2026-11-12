"""Order repository – async CRUD for OrderORM."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import OrderORM

logger = logging.getLogger("zen.repositories.order")


class OrderRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        internal_order_id: str,
        quote_id: str,
        payable_amount: float,
        currency: str,
        status: str = "QUOTED",
        paypal_order_id: Optional[str] = None,
    ) -> OrderORM:
        """Insert a new order record and return it."""
        now = datetime.now(timezone.utc)
        orm = OrderORM(
            internal_order_id=internal_order_id,
            quote_id=quote_id,
            paypal_order_id=paypal_order_id,
            status=status,
            payable_amount=payable_amount,
            currency=currency,
            created_at=now,
            updated_at=now,
        )
        self.session.add(orm)
        await self.session.commit()
        await self.session.refresh(orm)
        logger.info("Created order %s (status=%s)", internal_order_id, status)
        return orm

    async def get(self, internal_order_id: str) -> Optional[OrderORM]:
        result = await self.session.execute(
            select(OrderORM).where(OrderORM.internal_order_id == internal_order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_paypal_order_id(self, paypal_order_id: str) -> Optional[OrderORM]:
        result = await self.session.execute(
            select(OrderORM).where(OrderORM.paypal_order_id == paypal_order_id)
        )
        return result.scalar_one_or_none()

    async def update_status(self, internal_order_id: str, new_status: str) -> bool:
        """Update order status. Returns True if the row was found."""
        from sqlalchemy import select
        res = await self.session.execute(
            select(OrderORM).where(
                (OrderORM.internal_order_id == internal_order_id) |
                (OrderORM.paypal_order_id == internal_order_id)
            )
        )
        orm = res.scalar_one_or_none()
        if orm is None:
            return False
        orm.status = new_status
        orm.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(orm)
        return True

    async def set_paypal_order_id(self, internal_order_id: str, paypal_order_id: str) -> bool:
        """Persist the PayPal order ID after successful order creation."""
        orm = await self.get(internal_order_id)
        if orm is None:
            return False
        orm.paypal_order_id = paypal_order_id
        orm.updated_at = datetime.now(timezone.utc)
        await self.session.commit()
        return True

