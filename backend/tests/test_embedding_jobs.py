"""Embedding job queue + worker integration tests."""

import uuid

import pytest
from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import EmbeddingJob, FaqEntry, User
from app.services import embedding_jobs as jobs_service
from app.services.tenants import DEFAULT_TENANT_ID
from scripts import embedding_worker
from tests.conftest import integration


@pytest.mark.asyncio
@integration
async def test_enqueue_coalesces_active_jobs():
    faq_id = f"faq-queue-{uuid.uuid4().hex[:8]}"
    async with async_session_factory() as db:
        db.add(
            FaqEntry(
                tenantId=DEFAULT_TENANT_ID,
                id=faq_id,
                question="Q",
                answer="A",
                language="en",
                category="IT",
                contextBlob="blob",
            )
        )
        await db.flush()
        first = await jobs_service.enqueue_embedding(db, faq_id)
        second = await jobs_service.enqueue_embedding(db, faq_id)
        await db.commit()
        assert first.id == second.id
        assert second.status == "pending"

        result = await db.execute(
            select(EmbeddingJob).where(EmbeddingJob.faqEntryId == faq_id)
        )
        assert len(list(result.scalars().all())) == 1

        await db.delete(second)
        entry = await db.get(FaqEntry, faq_id)
        await db.delete(entry)
        await db.commit()


@pytest.mark.asyncio
@integration
async def test_fail_job_retries_then_marks_failed():
    faq_id = f"faq-fail-{uuid.uuid4().hex[:8]}"
    async with async_session_factory() as db:
        db.add(
            FaqEntry(
                tenantId=DEFAULT_TENANT_ID,
                id=faq_id,
                question="Q",
                answer="A",
                language="en",
                contextBlob="blob",
            )
        )
        await db.flush()
        job = await jobs_service.enqueue_embedding(db, faq_id, max_attempts=2)
        job.attempts = 1
        await jobs_service.fail_job(db, job, "boom")
        assert job.status == "pending"

        job.attempts = 2
        await jobs_service.fail_job(db, job, "boom again")
        assert job.status == "failed"
        await db.commit()

        await db.delete(job)
        entry = await db.get(FaqEntry, faq_id)
        await db.delete(entry)
        await db.commit()


@pytest.mark.asyncio
@integration
async def test_worker_once_embeds_pending_job():
    faq_id = f"faq-worker-{uuid.uuid4().hex[:8]}"
    vector = [0.1] * 768

    async def fake_embed(_text):
        return vector

    async with async_session_factory() as db:
        db.add(
            FaqEntry(
                tenantId=DEFAULT_TENANT_ID,
                id=faq_id,
                question="Reset password",
                answer="Use the portal",
                language="en",
                contextBlob="reset password portal",
            )
        )
        await db.flush()
        await jobs_service.enqueue_embedding(db, faq_id)
        await db.commit()

    processed = await embedding_worker.run_worker(
        once=True,
        session_factory=async_session_factory,
        embedder=fake_embed,
        worker_id="test-worker",
    )
    assert processed == 1

    async with async_session_factory() as db:
        entry = await db.get(FaqEntry, faq_id)
        assert entry is not None
        assert list(entry.embedding) == vector
        job_result = await db.execute(
            select(EmbeddingJob).where(EmbeddingJob.faqEntryId == faq_id)
        )
        job = job_result.scalar_one()
        assert job.status == "done"

        await db.delete(job)
        await db.delete(entry)
        await db.commit()


async def _admin_token(client) -> str:
    email = f"admin-{uuid.uuid4().hex[:8]}@university.edu"
    password = "demo1234!"
    async with async_session_factory() as db:
        db.add(
            User(
                tenantId=DEFAULT_TENANT_ID,
                email=email,
                displayName="Admin",
                role=Role.ADMIN,
                passwordHash=hash_password(password),
            )
        )
        await db.commit()
    login = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login.status_code == 200, login.text
    return login.json()["data"]["token"]


@pytest.mark.asyncio
@integration
async def test_reembed_requires_admin_and_enqueues(client):
    faq_id = f"faq-reembed-{uuid.uuid4().hex[:8]}"
    async with async_session_factory() as db:
        db.add(
            FaqEntry(
                tenantId=DEFAULT_TENANT_ID,
                id=faq_id,
                question="Q",
                answer="A",
                language="en",
                contextBlob="blob",
            )
        )
        await db.commit()

    denied = await client.post("/api/v1/kb/admin/reembed")
    assert denied.status_code == 401

    token = await _admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.post(
        "/api/v1/kb/admin/reembed?missing=1",
        headers=headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["data"]["enqueued"] >= 1

    async with async_session_factory() as db:
        jobs = list(
            (
                await db.execute(
                    select(EmbeddingJob).where(EmbeddingJob.faqEntryId == faq_id)
                )
            )
            .scalars()
            .all()
        )
        assert len(jobs) == 1
        assert jobs[0].status == "pending"
        for job in jobs:
            await db.delete(job)
        entry = await db.get(FaqEntry, faq_id)
        await db.delete(entry)
        await db.commit()
