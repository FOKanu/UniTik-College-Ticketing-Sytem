import uuid

import pytest

from app.core.security import hash_password
from app.db.base import Role, TicketStatus
from app.db.session import async_session_factory
from app.models import User
from tests.conftest import department_id_for, integration


async def _register_student(client):
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
    assert login_res.status_code == 200, login_res.text
    data = login_res.json()["data"]
    return data["token"], data["user"]["id"]


async def _insert_staff(client, *, label: str = "Staff"):
    email = f"staff-{uuid.uuid4().hex[:8]}@university.edu"
    password = "demo1234!"
    async with async_session_factory() as db:
        user = User(
            email=email,
            displayName=f"Test {label}",
            role=Role.STAFF,
            departmentId=await department_id_for(db, "IT"),
            passwordHash=hash_password(password),
        )
        db.add(user)
        await db.commit()
        staff_id = user.id
    login_res = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login_res.status_code == 200, login_res.text
    return login_res.json()["data"]["token"], staff_id


@integration
@pytest.mark.asyncio
async def test_notifications_list_mark_read_and_ticket_hooks(client):
    student_token, student_id = await _register_student(client)
    staff_token, _staff_actor_id = await _insert_staff(client, label="Actor")
    _assignee_token, assignee_id = await _insert_staff(client, label="Assignee")

    create_res = await client.post(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "subject": "Printer offline",
            "description": "Lab printer shows offline.",
            "category": "IT",
            "priority": "MEDIUM",
        },
    )
    assert create_res.status_code == 201, create_res.text
    ticket_id = create_res.json()["data"]["id"]

    # Assign + status change should notify the student and the new assignee.
    patch_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={
            "assignedToId": assignee_id,
            "status": TicketStatus.IN_PROGRESS.value,
        },
    )
    assert patch_res.status_code == 200, patch_res.text

    student_inbox = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert student_inbox.status_code == 200, student_inbox.text
    student_items = student_inbox.json()["data"]
    assert len(student_items) >= 1
    assert all(item["read"] is False for item in student_items)
    assert any(item["ticketId"] == ticket_id for item in student_items)

    assignee_inbox = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {_assignee_token}"},
    )
    assert assignee_inbox.status_code == 200
    assert any(
        item["ticketId"] == ticket_id and "assigned" in item["title"].lower()
        for item in assignee_inbox.json()["data"]
    )

    note_id = student_items[0]["id"]
    mark = await client.patch(
        f"/api/v1/notifications/{note_id}/read",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert mark.status_code == 200
    assert mark.json()["data"]["read"] is True

    # Other users cannot mark this notification.
    forbidden = await client.patch(
        f"/api/v1/notifications/{note_id}/read",
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert forbidden.status_code == 404

    # Public staff comment notifies the student requester.
    comment_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"body": "Looking into this now.", "isInternal": False},
    )
    assert comment_res.status_code == 201, comment_res.text

    student_inbox2 = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    titles = [n["title"] for n in student_inbox2.json()["data"]]
    assert "Agent reply" in titles

    mark_all = await client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert mark_all.status_code == 200
    assert mark_all.json()["data"]["updated"] >= 1

    final = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert all(item["read"] is True for item in final.json()["data"])


@integration
@pytest.mark.asyncio
async def test_notifications_require_auth(client):
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 401
