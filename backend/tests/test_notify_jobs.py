"""Email provider + NotifyJob queue / worker tests."""

import logging
import uuid
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import select

from app.core.config import Settings
from app.core.security import hash_password
from app.db.base import Role, TicketStatus
from app.db.session import async_session_factory
from app.models import NotifyJob, User
from app.services.email import ConsoleEmailProvider, SmtpEmailProvider, get_email_provider
from scripts import notify_worker
from tests.conftest import department_id_for, integration


@pytest.mark.asyncio
async def test_console_provider_logs(caplog):
    provider = ConsoleEmailProvider()
    with caplog.at_level(logging.INFO, logger="app.email"):
        await provider.send(to="a@example.com", subject="Hello", body="World")
    assert "a@example.com" in caplog.text
    assert "Hello" in caplog.text


@pytest.mark.asyncio
async def test_get_email_provider_defaults_to_console():
    settings = Settings(smtp_host="")
    assert isinstance(get_email_provider(settings), ConsoleEmailProvider)
    settings = Settings(smtp_host="smtp.example.com")
    assert isinstance(get_email_provider(settings), SmtpEmailProvider)


@pytest.mark.asyncio
async def test_smtp_provider_uses_smtplib():
    settings = Settings(
        smtp_host="smtp.example.com",
        smtp_port=587,
        smtp_user="user",
        smtp_password="secret",
        smtp_from="noreply@university.example",
        smtp_use_tls=True,
    )
    provider = SmtpEmailProvider(settings)
    smtp = MagicMock()
    smtp.__enter__ = MagicMock(return_value=smtp)
    smtp.__exit__ = MagicMock(return_value=False)

    with patch("app.services.email.smtplib.SMTP", return_value=smtp) as smtp_ctor:
        await provider.send(to="student@example.com", subject="Sub", body="Body")

    smtp_ctor.assert_called_once_with("smtp.example.com", 587, timeout=30)
    smtp.starttls.assert_called_once()
    smtp.login.assert_called_once_with("user", "secret")
    smtp.send_message.assert_called_once()


@pytest.mark.asyncio
@integration
async def test_ticket_hooks_enqueue_notify_jobs(client):
    email = f"student-{uuid.uuid4().hex[:8]}@stud.university.edu"
    password = "demo1234!"
    register_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "displayName": "Test Student",
            "role": "STUDENT",
        },
    )
    assert register_res.status_code == 201, register_res.text
    login_res = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    student_token = login_res.json()["data"]["token"]
    student_id = login_res.json()["data"]["user"]["id"]

    staff_email = f"staff-{uuid.uuid4().hex[:8]}@university.edu"
    async with async_session_factory() as db:
        staff = User(
            email=staff_email,
            displayName="Staff",
            role=Role.STAFF,
            departmentId=await department_id_for(db, "IT"),
            passwordHash=hash_password(password),
        )
        db.add(staff)
        await db.commit()
        staff_id = staff.id
    staff_login = await client.post(
        "/api/v1/auth/login", json={"email": staff_email, "password": password}
    )
    staff_token = staff_login.json()["data"]["token"]

    create_res = await client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "subject": "Email notify test",
            "description": "Need status update emails.",
            "priority": "MEDIUM",
        },
    )
    assert create_res.status_code == 201, create_res.text
    ticket_id = create_res.json()["data"]["id"]

    patch_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"status": TicketStatus.IN_PROGRESS.value, "assignedToId": staff_id},
    )
    assert patch_res.status_code == 200, patch_res.text

    async with async_session_factory() as db:
        jobs = list(
            (
                await db.execute(
                    select(NotifyJob).where(NotifyJob.ticketId == ticket_id)
                )
            )
            .scalars()
            .all()
        )
        assert len(jobs) >= 1
        assert any(j.userId == student_id and j.status == "pending" for j in jobs)
        assert any(j.toEmail == email for j in jobs)

        sent: list[tuple[str, str]] = []

        class RecordingProvider:
            async def send(self, *, to: str, subject: str, body: str) -> None:
                sent.append((to, subject))

        processed = await notify_worker.run_worker(
            once=True,
            session_factory=async_session_factory,
            provider=RecordingProvider(),
            worker_id="test-notify-worker",
        )
        assert processed >= 1
        assert sent

    async with async_session_factory() as db:
        refreshed = list(
            (
                await db.execute(
                    select(NotifyJob).where(NotifyJob.ticketId == ticket_id)
                )
            )
            .scalars()
            .all()
        )
        assert refreshed
        assert all(j.status == "done" for j in refreshed)

        for job in refreshed:
            await db.delete(job)
        await db.commit()
