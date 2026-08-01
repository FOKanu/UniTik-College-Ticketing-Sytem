import uuid

import pytest

from app.core.security import hash_password
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import User
from tests.conftest import integration


@pytest.mark.asyncio
async def test_list_tickets_requires_auth(client):
    response = await client.get("/api/v1/tickets")
    assert response.status_code == 401


async def _register_and_login(client, *, role: str, department: str | None = None):
    """Create a fresh user and return (token, user_id).

    Students go through the public /auth/register path. Staff/admin are inserted
    directly because self-registration only allows STUDENT.
    """
    email = f"{role.lower()}-{uuid.uuid4().hex[:8]}@stud.university.edu"
    password = "demo1234!"

    if role == "STUDENT":
        register_body = {
            "email": email,
            "password": password,
            "displayName": f"Test {role.title()}",
            "role": role,
        }
        if department:
            register_body["department"] = department
        register_res = await client.post("/api/v1/auth/register", json=register_body)
        assert register_res.status_code == 201, register_res.text
    else:
        async with async_session_factory() as db:
            user = User(
                email=email,
                displayName=f"Test {role.title()}",
                role=Role(role),
                department=department(name=department) if department else None,
                passwordHash=hash_password(password),
            )
            db.add(user)
            await db.commit()

    login_res = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login_res.status_code == 200, login_res.text
    body = login_res.json()["data"]
    return body["token"], body["user"]["id"]


@pytest.mark.asyncio
@integration
async def test_student_reply_reopens_resolved_ticket(client):
    """Confirms docs/architecture/README.md §8 "Reopen-on-reply": a student
    commenting on their own Resolved ticket flips it back to Open. A staff
    reply to the same ticket must NOT trigger this."""
    student_token, _ = await _register_and_login(client, role="STUDENT",department="Testing")
    staff_token, _ = await _register_and_login(client, role="STAFF", department="IT")

    student_headers = {"Authorization": f"Bearer {student_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "VPN issue", "description": "Cannot connect off-campus"},
        headers=student_headers,
    )
    assert create_res.status_code == 201, create_res.text
    ticket_id = create_res.json()["data"]["id"]

    resolve_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "RESOLVED"},
        headers=staff_headers,
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["data"]["status"] == "RESOLVED"

    # Staff reply to a Resolved ticket must NOT reopen it.
    staff_reply_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        json={"body": "Following up before closing.", "isInternal": True},
        headers=staff_headers,
    )
    assert staff_reply_res.status_code == 201
    still_resolved = await client.get(f"/api/v1/tickets/{ticket_id}", headers=staff_headers)
    assert still_resolved.json()["data"]["status"] == "RESOLVED"

    # Student reply to the Resolved ticket DOES reopen it.
    student_reply_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        json={"body": "This is still happening, please reopen."},
        headers=student_headers,
    )
    assert student_reply_res.status_code == 201

    reopened_res = await client.get(f"/api/v1/tickets/{ticket_id}", headers=student_headers)
    assert reopened_res.json()["data"]["status"] == "OPEN"
