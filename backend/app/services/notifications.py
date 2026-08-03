"""In-app notification inbox (no email channel yet)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import Notification, User
from app.schemas.notifications import NotificationResponse

CHANNEL_IN_APP = "IN_APP"


def to_response(row: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=row.id,
        title=row.title,
        body=row.message,
        read=row.readAt is not None,
        createdAt=row.createdAt,
        ticketId=row.ticketId,
    )


async def list_for_user(db: AsyncSession, user: User) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.userId == user.id)
        .order_by(Notification.createdAt.desc())
    )
    return list(result.scalars().all())


async def mark_read(db: AsyncSession, notification_id: str, user: User) -> Notification:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.userId == user.id,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise NotFoundError("Notification not found")
    if row.readAt is None:
        row.readAt = datetime.now()
        await db.commit()
        await db.refresh(row)
    return row


async def mark_all_read(db: AsyncSession, user: User) -> int:
    now = datetime.now()
    result = await db.execute(
        update(Notification)
        .where(Notification.userId == user.id, Notification.readAt.is_(None))
        .values(readAt=now)
    )
    await db.commit()
    return int(result.rowcount or 0)


def create_in_app(
    *,
    user_id: str,
    title: str,
    body: str,
    ticket_id: str | None = None,
    actor_id: str | None = None,
) -> Notification | None:
    """Build an IN_APP row. Returns None when the recipient is the actor."""
    if actor_id is not None and actor_id == user_id:
        return None
    return Notification(
        userId=user_id,
        ticketId=ticket_id,
        channel=CHANNEL_IN_APP,
        title=title,
        message=body,
    )


async def notify_many(
    db: AsyncSession,
    rows: list[Notification | None],
) -> None:
    """Persist non-null notification rows (caller commits with the parent txn)."""
    for row in rows:
        if row is not None:
            db.add(row)
