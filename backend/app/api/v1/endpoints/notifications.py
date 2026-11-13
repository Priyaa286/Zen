"""In-app notifications API for order tracking, payment verification, and refunds."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, get_optional_user
from app.database.connection import get_db
from app.database.models import NotificationORM, UserORM

logger = logging.getLogger("zen.api.notifications")

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", status_code=status.HTTP_200_OK)
async def list_notifications(
    user: Optional[UserORM] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Retrieve recent notifications for the authenticated user."""
    if not user:
        # Return public system notices if unauthenticated
        return {"notifications": [], "unreadCount": 0}

    query = (
        select(NotificationORM)
        .where((NotificationORM.user_id == user.id) | (NotificationORM.user_id.is_(None)))
        .order_by(desc(NotificationORM.created_at))
        .limit(limit)
    )
    res = await db.execute(query)
    notifs = res.scalars().all()

    unread_count = sum(1 for n in notifs if n.is_read == 0)

    formatted = []
    for n in notifs:
        data = json.loads(n.data_json) if n.data_json else {}
        formatted.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "isRead": bool(n.is_read),
            "data": data,
            "createdAt": n.created_at.isoformat() if n.created_at else None,
        })

    return {
        "notifications": formatted,
        "unreadCount": unread_count,
    }


@router.put("/{notif_id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_read(
    notif_id: str,
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific notification as read."""
    res = await db.execute(select(NotificationORM).where(NotificationORM.id == notif_id))
    notif = res.scalar_one_or_none()

    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{notif_id}' not found.",
        )

    notif.is_read = 1
    await db.commit()
    return {"status": "SUCCESS", "id": notif_id, "isRead": True}


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    user: UserORM = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications for the user as read."""
    await db.execute(
        update(NotificationORM)
        .where(NotificationORM.user_id == user.id)
        .values(is_read=1)
    )
    await db.commit()
    return {"status": "SUCCESS", "message": "All notifications marked as read."}

