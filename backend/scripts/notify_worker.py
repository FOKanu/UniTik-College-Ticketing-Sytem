"""Poll NotifyJob rows and send outbound email.

Usage (from backend/):

    python -m scripts.notify_worker
    python -m scripts.notify_worker --once
    python -m scripts.notify_worker --poll-seconds 5

Uses ConsoleEmailProvider when SMTP_HOST is empty (see backend/.env.example).
"""

from __future__ import annotations

import argparse
import asyncio
import socket
import sys
import uuid

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models import NotifyJob
from app.services import notify_jobs as jobs_service
from app.services.email import EmailProvider, get_email_provider


def _default_worker_id() -> str:
    return f"{socket.gethostname()}-{uuid.uuid4().hex[:8]}"


async def process_one(
    *,
    session_factory=async_session_factory,
    provider: EmailProvider | None = None,
    worker_id: str,
    stale_after_seconds: int = jobs_service.DEFAULT_STALE_AFTER_SECONDS,
) -> bool:
    """Claim and process a single job. Returns True if work was done."""
    mailer = provider or get_email_provider()

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
            await mailer.send(to=job.toEmail, subject=job.subject, body=job.body)
            await jobs_service.complete_job(db, job)
            await db.commit()
            return True
        except Exception as exc:  # noqa: BLE001 — keep the poll loop alive
            error_message = str(exc)
            await db.rollback()

    async with session_factory() as db:
        result = await db.execute(select(NotifyJob).where(NotifyJob.id == job_id))
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
    provider: EmailProvider | None = None,
    worker_id: str | None = None,
    stale_after_seconds: int = jobs_service.DEFAULT_STALE_AFTER_SECONDS,
) -> int:
    wid = worker_id or _default_worker_id()
    mailer = provider or get_email_provider()
    processed = 0
    while True:
        did_work = await process_one(
            session_factory=session_factory,
            provider=mailer,
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
    parser = argparse.ArgumentParser(description="Outbound email notification worker")
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
        print("Notify worker stopped.", file=sys.stderr)
        return 0
    except Exception:
        print("Notify worker failed.", file=sys.stderr)
        return 1

    if args.once:
        print(f"Notify worker drained: {processed} job(s) processed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
