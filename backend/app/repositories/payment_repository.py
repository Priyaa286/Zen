"""Payment repository – async CRUD for PaymentORM."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import PaymentORM

logger = logging.getLogger("zen.repositories.payment")


class PaymentRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        payment_id: str,
        internal_order_id: str,
        amount: float,
        currency: str,
        status: str,
        paypal_capture_id: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> PaymentORM:
        now = datetime.now(timezone.utc)
        orm = PaymentORM(
            payment_id=payment_id,
            internal_order_id=internal_order_id,
            paypal_capture_id=paypal_capture_id,
            amount=amount,
            currency=currency,
            status=status,
            idempotency_key=idempotency_key,
            created_at=now,
            captured_at=now if paypal_capture_id else None,
        )
        self.session.add(orm)
        await self.session.commit()
        await self.session.refresh(orm)
        logger.info("Created payment %s (order=%s)", payment_id, internal_order_id)
        return orm

    async def get(self, payment_id: str) -> Optional[PaymentORM]:
        result = await self.session.execute(
            select(PaymentORM).where(PaymentORM.payment_id == payment_id)
        )
        return result.scalar_one_or_none()

    async def get_by_capture_id(self, paypal_capture_id: str) -> Optional[PaymentORM]:
        result = await self.session.execute(
            select(PaymentORM).where(PaymentORM.paypal_capture_id == paypal_capture_id)
        )
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, idempotency_key: str) -> Optional[PaymentORM]:
        result = await self.session.execute(
            select(PaymentORM).where(PaymentORM.idempotency_key == idempotency_key)
        )
        return result.scalar_one_or_none()

    async def set_capture_id(
        self,
        payment_id: str,
        paypal_capture_id: str,
        new_status: str = "COMPLETED",
    ) -> bool:
        orm = await self.get(payment_id)
        if orm is None:
            return False
        orm.paypal_capture_id = paypal_capture_id
        orm.status = new_status
        orm.captured_at = datetime.now(timezone.utc)
        await self.session.commit()
        return True

