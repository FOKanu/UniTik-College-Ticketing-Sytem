import uuid

import pytest

from app.core.security import hash_password
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import User
from tests.conftest import department_id_for, integration


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
                departmentId=await department_id_for(db, department),
                passwordHash=hash_password(password),
            )
            db.add(user)
            await db.commit()

    login_res = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200, login_res.text
    body = login_res.json()["data"]
    return body["token"], body["user"]["id"]


@pytest.mark.asyncio
@integration
async def test_student_reply_reopens_resolved_ticket(client):
    """Confirms docs/architecture/README.md §8 "Reopen-on-reply": a student
    commenting on their own Resolved ticket flips it back to Open. A staff
    reply to the same ticket must NOT trigger this."""
    student_token, _ = await _register_and_login(client, role="STUDENT")
    staff_token, _ = await _register_and_login(client, role="STAFF")

    student_headers = {"Authorization": f"Bearer {student_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "subject": "VPN issue",
            "description": "Cannot connect off-campus",
            "department": "IT",
        },
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


@pytest.mark.asyncio
@integration
async def test_ticket_response_carries_people_names(client):
    """The queue renders assignee/requester names, so /tickets must resolve them
    from the user relationships — not just return bare ids. Regression: every
    row read "Unassigned" because only assignedToId was serialized."""
    student_token, student_id = await _register_and_login(client, role="STUDENT")
    staff_token, staff_id = await _register_and_login(
        client, role="STAFF", department="IT"
    )
    student_headers = {"Authorization": f"Bearer {student_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "Cannot access course portal", "description": "500 on login"},
        headers=student_headers,
    )
    assert create_res.status_code == 201, create_res.text
    ticket_id = create_res.json()["data"]["id"]

    # Requester name is present immediately; nobody is assigned yet.
    created = create_res.json()["data"]
    assert created["createdById"] == student_id
    assert created["createdByName"] == "Test Student"
    assert created["assignedToId"] is None
    assert created["assignedToName"] is None

    # Assigning must return the new assignee's display name on the PATCH itself.
    assign_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"assignedToId": staff_id},
        headers=staff_headers,
    )
    assert assign_res.status_code == 200, assign_res.text
    assert assign_res.json()["data"]["assignedToName"] == "Test Staff"

    # ...and on the list endpoint the queue actually reads from.
    list_res = await client.get("/api/v1/tickets", headers=staff_headers)
    assert list_res.status_code == 200
    row = next(t for t in list_res.json()["data"] if t["id"] == ticket_id)
    assert row["assignedToId"] == staff_id
    assert row["assignedToName"] == "Test Staff"
    assert row["createdByName"] == "Test Student"

    # Clearing the assignee clears the name too.
    unassign_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"assignedToId": None},
        headers=staff_headers,
    )
    assert unassign_res.status_code == 200
    assert unassign_res.json()["data"]["assignedToName"] is None


@pytest.mark.asyncio
@integration
async def test_sla_and_status_history_on_create_update_reopen(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    staff_token, _ = await _register_and_login(client, role="STAFF", department="IT")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "subject": "SLA clock",
            "description": "needs response",
            "priority": "HIGH",
        },
        headers=student_headers,
    )
    assert create_res.status_code == 201, create_res.text
    created = create_res.json()["data"]
    ticket_id = created["id"]
    assert created["slaDueAt"] is not None
    assert created["slaHoursRemaining"] is not None
    assert created["slaBreached"] is False
    assert 23 <= created["slaHoursRemaining"] <= 24

    history_res = await client.get(
        f"/api/v1/tickets/{ticket_id}/status-history",
        headers=student_headers,
    )
    assert history_res.status_code == 200
    history = history_res.json()["data"]
    assert len(history) == 1
    assert history[0]["fromStatus"] is None
    assert history[0]["toStatus"] == "OPEN"
    assert history[0]["reason"] == "created"

    progress_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "IN_PROGRESS"},
        headers=staff_headers,
    )
    assert progress_res.status_code == 200

    resolve_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "RESOLVED"},
        headers=staff_headers,
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["data"]["slaHoursRemaining"] is None

    reopen_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        json={"body": "Still broken"},
        headers=student_headers,
    )
    assert reopen_res.status_code == 201

    detail = await client.get(f"/api/v1/tickets/{ticket_id}", headers=student_headers)
    assert detail.json()["data"]["status"] == "OPEN"
    assert detail.json()["data"]["slaDueAt"] is not None

    history_after = await client.get(
        f"/api/v1/tickets/{ticket_id}/status-history",
        headers=staff_headers,
    )
    reasons = [row["reason"] for row in history_after.json()["data"]]
    assert "created" in reasons
    assert "staff_update" in reasons
    assert "reopen_on_reply" in reasons


@pytest.mark.asyncio
@integration
async def test_create_ticket_auto_routes_when_department_omitted(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    headers = {"Authorization": f"Bearer {student_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "subject": "Cannot connect to campus wifi",
            "description": "Laptop drops the wifi connection and I can't log into the portal.",
        },
        headers=headers,
    )
    assert create_res.status_code == 201, create_res.text
    data = create_res.json()["data"]
    assert data["department"] == "IT"
    assert data["category"] == "it"
    assert data["classificationSource"] == "rule-engine"


@pytest.mark.asyncio
@integration
async def test_create_ticket_manual_department_skips_router(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    headers = {"Authorization": f"Bearer {student_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "subject": "Cannot connect to campus wifi",
            "description": "Laptop drops the wifi connection.",
            "department": "Finance",
            "category": "billing",
        },
        headers=headers,
    )
    assert create_res.status_code == 201, create_res.text
    data = create_res.json()["data"]
    assert data["department"] == "Finance"
    assert data["category"] == "billing"
    assert data["classificationSource"] == "manual"
