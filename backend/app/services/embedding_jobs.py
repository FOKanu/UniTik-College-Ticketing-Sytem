"""Postgres-backed embedding job queue (FOR UPDATE SKIP LOCKED; no Redis)."""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EmbeddingJob, FaqEntry

ACTIVE_STATUSES = ("pending", "processing")
DEFAULT_MAX_ATTEMPTS = 3
DEFAULT_STALE_AFTER_SECONDS = 300


def _now() -> datetime:
    return datetime.now()


async def enqueue_embedding(
    db: AsyncSession,
    faq_entry_id: str,
    *,
    max_attempts: int = DEFAULT_MAX_ATTEMPTS,
) -> EmbeddingJob:
    """Insert a pending job, or reset an existing active job back to pending.

    Coalesces so at most one pending/processing job exists per FAQ entry
    (enforced by partial unique index uq_EmbeddingJob_active_faq).
    """
    result = await db.execute(
        select(EmbeddingJob).where(
            EmbeddingJob.faqEntryId == faq_entry_id,
            EmbeddingJob.status.in_(ACTIVE_STATUSES),
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.status = "pending"
        existing.lockedAt = None
        existing.lockedBy = None
        existing.lastError = None
        existing.updatedAt = _now()
        if existing.maxAttempts < max_attempts:
            existing.maxAttempts = max_attempts
        return existing

    job = EmbeddingJob(
        faqEntryId=faq_entry_id,
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
    """Return stale processing jobs to pending so another worker can claim them."""
    cutoff = _now() - timedelta(seconds=stale_after_seconds)
    result = await db.execute(
        update(EmbeddingJob)
        .where(
            EmbeddingJob.status == "processing",
            EmbeddingJob.lockedAt.is_not(None),
            EmbeddingJob.lockedAt < cutoff,
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
) -> EmbeddingJob | None:
    """Claim one pending job using SKIP LOCKED. Reclaims stale processing first."""
    await reclaim_stale_jobs(db, stale_after_seconds=stale_after_seconds)

    result = await db.execute(
        select(EmbeddingJob)
        .where(EmbeddingJob.status == "pending")
        .order_by(EmbeddingJob.createdAt.asc())
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


async def complete_job(
    db: AsyncSession,
    job: EmbeddingJob,
    embedding: list[float],
) -> EmbeddingJob:
    """Write the vector onto the FAQ row and mark the job done."""
    faq_result = await db.execute(select(FaqEntry).where(FaqEntry.id == job.faqEntryId))
    entry = faq_result.scalar_one_or_none()
    if entry is None:
        job.status = "failed"
        job.lastError = f"FAQ entry {job.faqEntryId} not found"
        job.lockedAt = None
        job.lockedBy = None
        job.updatedAt = _now()
        return job

    entry.embedding = embedding
    job.status = "done"
    job.lastError = None
    job.lockedAt = None
    job.lockedBy = None
    job.updatedAt = _now()
    return job


async def fail_job(
    db: AsyncSession,
    job: EmbeddingJob,
    error: str,
) -> EmbeddingJob:
    """Record failure; re-queue as pending until attempts are exhausted."""
    job.lastError = error[:2000] if error else "unknown error"
    job.lockedAt = None
    job.lockedBy = None
    job.updatedAt = _now()
    if job.attempts >= job.maxAttempts:
        job.status = "failed"
    else:
        job.status = "pending"
    return job


async def enqueue_for_entries(
    db: AsyncSession,
    faq_ids: list[str],
) -> int:
    """Enqueue embedding jobs for the given FAQ ids. Returns count enqueued/reset."""
    count = 0
    for faq_id in faq_ids:
        await enqueue_embedding(db, faq_id)
        count += 1
    return count
