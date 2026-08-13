"""In-app notification inbox + enqueue outbound email jobs.

IN_APP rows are written synchronously. Email delivery is async via NotifyJob
and ``python -m scripts.notify_worker`` (console provider when SMTP_HOST is empty).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import Notification, User
from app.schemas.notifications import NotificationResponse
from app.services import notify_jobs as notify_jobs_service

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
    """Persist IN_APP rows and enqueue matching outbound email jobs.

    Caller commits with the parent transaction. Skips email when the recipient
    has no email address.
    """
    pending = [row for row in rows if row is not None]
    if not pending:
        return

    for row in pending:
        db.add(row)
    await db.flush()

    user_ids = {row.userId for row in pending}
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    emails = {u.id: u.email for u in result.scalars().all()}

    for row in pending:
        to_email = (emails.get(row.userId) or "").strip()
        if not to_email:
            continue
        await notify_jobs_service.enqueue_email(
            db,
            user_id=row.userId,
            to_email=to_email,
            subject=row.title,
            body=row.message,
            ticket_id=row.ticketId,
            notification_id=row.id,
        )
