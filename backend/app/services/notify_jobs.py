"""Postgres-backed outbound email job queue (FOR UPDATE SKIP LOCKED; no Redis)."""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NotifyJob

DEFAULT_MAX_ATTEMPTS = 3
DEFAULT_STALE_AFTER_SECONDS = 300


def _now() -> datetime:
    return datetime.now()


async def enqueue_email(
    db: AsyncSession,
    *,
    user_id: str,
    to_email: str,
    subject: str,
    body: str,
    ticket_id: str | None = None,
    notification_id: str | None = None,
    max_attempts: int = DEFAULT_MAX_ATTEMPTS,
) -> NotifyJob:
    """Insert a pending outbound email job."""
    job = NotifyJob(
        userId=user_id,
        ticketId=ticket_id,
        notificationId=notification_id,
        toEmail=to_email.strip(),
        subject=subject,
        body=body,
        status="pending",
        attempts=0,
        maxAttempts=max_attempts,
    )
    db.add(job)
    await db.flush()
    return job


async def reclaim_stale_jobs(
    db: AsyncSession,
    *,
    stale_after_seconds: int = DEFAULT_STALE_AFTER_SECONDS,
) -> int:
    cutoff = _now() - timedelta(seconds=stale_after_seconds)
    result = await db.execute(
        update(NotifyJob)
        .where(
            NotifyJob.status == "processing",
            NotifyJob.lockedAt.is_not(None),
            NotifyJob.lockedAt < cutoff,
        )
        .values(
            status="pending",
            lockedAt=None,
            lockedBy=None,
            updatedAt=_now(),
        )
    )
    return result.rowcount or 0


async def claim_next_job(
    db: AsyncSession,
    *,
    worker_id: str,
    stale_after_seconds: int = DEFAULT_STALE_AFTER_SECONDS,
) -> NotifyJob | None:
    await reclaim_stale_jobs(db, stale_after_seconds=stale_after_seconds)

    result = await db.execute(
        select(NotifyJob)
        .where(NotifyJob.status == "pending")
        .order_by(NotifyJob.createdAt.asc())
        .limit(1)
        .with_for_update(skip_locked=True)
    )
    job = result.scalar_one_or_none()
    if not job:
        return None

    job.status = "processing"
    job.lockedAt = _now()
    job.lockedBy = worker_id
    job.attempts = (job.attempts or 0) + 1
    job.updatedAt = _now()
    await db.flush()
    return job


async def complete_job(db: AsyncSession, job: NotifyJob) -> NotifyJob:
    job.status = "done"
    job.lastError = None
    job.lockedAt = None
    job.lockedBy = None
    job.updatedAt = _now()
    return job


async def fail_job(db: AsyncSession, job: NotifyJob, error: str) -> NotifyJob:
    job.lastError = error[:2000] if error else "unknown error"
    job.lockedAt = None
    job.lockedBy = None
    job.updatedAt = _now()
    if job.attempts >= job.maxAttempts:
        job.status = "failed"
    else:
        job.status = "pending"
    return job
