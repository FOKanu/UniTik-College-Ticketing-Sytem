"""Poll EmbeddingJob rows and write FAQ vectors via app.ai.

Usage (from backend/):

    python -m scripts.embedding_worker
    python -m scripts.embedding_worker --once
    python -m scripts.embedding_worker --poll-seconds 5

Run alongside the API after ``python -m scripts.ingest_kb`` (async default).
"""

from __future__ import annotations

import argparse
import asyncio
import socket
import sys
import uuid
from collections.abc import Awaitable, Callable

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models import EmbeddingJob, FaqEntry
from app.services import embedding_jobs as jobs_service
from app.services.kb_embedding import embed_text

Embedder = Callable[[str], Awaitable[list[float]]]


def _default_worker_id() -> str:
    return f"{socket.gethostname()}-{uuid.uuid4().hex[:8]}"


def _blob_for_entry(entry: FaqEntry) -> str:
    if entry.contextBlob and entry.contextBlob.strip():
        return entry.contextBlob
    return f"{entry.question}\n\n{entry.answer}"


async def process_one(
    *,
    session_factory=async_session_factory,
    embedder: Embedder = embed_text,
    worker_id: str,
    stale_after_seconds: int = jobs_service.DEFAULT_STALE_AFTER_SECONDS,
) -> bool:
    """Claim and process a single job. Returns True if work was done."""
    async with session_factory() as db:
        job = await jobs_service.claim_next_job(
            db,
            worker_id=worker_id,
            stale_after_seconds=stale_after_seconds,
        )
        if job is None:
            await db.commit()
            return False

        job_id = job.id
        error_message: str | None = None
        try:
            faq_result = await db.execute(
                select(FaqEntry).where(FaqEntry.id == job.faqEntryId)
            )
            entry = faq_result.scalar_one_or_none()
            if entry is None:
                await jobs_service.fail_job(db, job, f"FAQ entry {job.faqEntryId} not found")
                job.status = "failed"
                await db.commit()
                return True

            vector = await embedder(_blob_for_entry(entry))
            await jobs_service.complete_job(db, job, vector)
            await db.commit()
            return True
        except Exception as exc:  # noqa: BLE001 — keep the poll loop alive
            error_message = str(exc)
            await db.rollback()

    # Fresh session after rollback so fail_job persists.
    async with session_factory() as db:
        result = await db.execute(select(EmbeddingJob).where(EmbeddingJob.id == job_id))
        job = result.scalar_one_or_none()
        if job is not None:
            await jobs_service.fail_job(db, job, error_message or "unknown error")
            await db.commit()
    return True


async def run_worker(
    *,
    once: bool = False,
    poll_seconds: float = 2.0,
    session_factory=async_session_factory,
    embedder: Embedder = embed_text,
    worker_id: str | None = None,
    stale_after_seconds: int = jobs_service.DEFAULT_STALE_AFTER_SECONDS,
) -> int:
    """Process jobs until idle (``once``) or forever. Returns jobs processed."""
    wid = worker_id or _default_worker_id()
    processed = 0
    while True:
        did_work = await process_one(
            session_factory=session_factory,
            embedder=embedder,
            worker_id=wid,
            stale_after_seconds=stale_after_seconds,
        )
        if did_work:
            processed += 1
            continue
        if once:
            return processed
        await asyncio.sleep(poll_seconds)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="FAQ embedding background worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Drain pending jobs then exit (for CI / one-shot runs)",
    )
    parser.add_argument(
        "--poll-seconds",
        type=float,
        default=2.0,
        help="Sleep between empty polls when not using --once (default: 2)",
    )
    args = parser.parse_args(argv)

    try:
        processed = asyncio.run(
            run_worker(once=args.once, poll_seconds=args.poll_seconds)
        )
    except KeyboardInterrupt:
        print("Embedding worker stopped.", file=sys.stderr)
        return 0
    except Exception:
        print("Embedding worker failed.", file=sys.stderr)
        return 1

    if args.once:
        print(f"Embedding worker drained: {processed} job(s) processed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
