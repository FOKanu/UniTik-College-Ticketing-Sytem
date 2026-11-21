import uuid

import pytest

from app.core.security import hash_password
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import User
from app.services.tenants import DEFAULT_TENANT_ID
from tests.conftest import department_id_for, integration


async def _register_and_login(client, *, role: str, department: str | None = None):
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
                tenantId=DEFAULT_TENANT_ID,
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
async def test_list_staff_requires_auth(client):
    response = await client.get("/api/v1/users/staff")
    assert response.status_code == 401


@pytest.mark.asyncio
@integration
async def test_students_cannot_list_staff(client):
    token, _ = await _register_and_login(client, role="STUDENT")
    response = await client.get(
        "/api/v1/users/staff",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
@integration
async def test_staff_directory_and_department_filter(client):
    staff_token, staff_id = await _register_and_login(
        client, role="STAFF", department="IT Support — Tier 1"
    )
    await _register_and_login(client, role="STAFF", department="Finance Office")
    await _register_and_login(client, role="STUDENT", department="Computer Science")

    headers = {"Authorization": f"Bearer {staff_token}"}

    all_staff = await client.get("/api/v1/users/staff", headers=headers)
    assert all_staff.status_code == 200, all_staff.text
    members = all_staff.json()["data"]
    assert isinstance(members, list)
    assert any(m["id"] == staff_id for m in members)
    assert all(m["role"] in ("STAFF", "ADMIN") for m in members)
    for member in members:
        assert set(member.keys()) >= {
            "id",
            "email",
            "displayName",
            "role",
            "department",
        }

    filtered = await client.get(
        "/api/v1/users/staff",
        params={"department": "IT"},
        headers=headers,
    )
    assert filtered.status_code == 200
    it_members = filtered.json()["data"]
    assert any(m["id"] == staff_id for m in it_members)
    assert all("IT" in (m["department"] or "").upper() for m in it_members)

    depts = await client.get("/api/v1/users/departments", headers=headers)
    assert depts.status_code == 200
    labels = depts.json()["data"]
    assert "IT Support — Tier 1" in labels
    assert "Finance Office" in labels


@pytest.mark.asyncio
@integration
async def test_reassign_rejects_student_assignee(client):
    student_token, student_id = await _register_and_login(client, role="STUDENT")
    staff_token, _ = await _register_and_login(client, role="STAFF", department="IT")

    student_headers = {"Authorization": f"Bearer {student_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "Needs routing", "description": "Please route me"},
        headers=student_headers,
    )
    assert create_res.status_code == 201, create_res.text
    ticket_id = create_res.json()["data"]["id"]

    bad = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"assignedToId": student_id},
        headers=staff_headers,
    )
    assert bad.status_code == 400
    assert bad.json()["success"] is False


@pytest.mark.asyncio
@integration
async def test_staff_cannot_self_assign_department(client):
    """S6: staff must not move themselves into another department via PATCH /me."""
    staff_token, _ = await _register_and_login(
        client, role="STAFF", department="IT Support — Tier 1"
    )
    headers = {"Authorization": f"Bearer {staff_token}"}

    before = await client.get("/api/v1/users/me", headers=headers)
    assert before.status_code == 200
    assert before.json()["data"]["department"] == "IT Support — Tier 1"

    denied = await client.patch(
        "/api/v1/users/me",
        json={"department": "Finance Office"},
        headers=headers,
    )
    assert denied.status_code == 403
    assert denied.json()["success"] is False

    after = await client.get("/api/v1/users/me", headers=headers)
    assert after.status_code == 200
    assert after.json()["data"]["department"] == "IT Support — Tier 1"


@pytest.mark.asyncio
@integration
async def test_student_can_update_academic_department(client):
    """Students may still set academic affiliation on their profile."""
    student_token, _ = await _register_and_login(
        client, role="STUDENT", department="Computer Science"
    )
    headers = {"Authorization": f"Bearer {student_token}"}

    ok = await client.patch(
        "/api/v1/users/me",
        json={"department": "Biology"},
        headers=headers,
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["data"]["department"] == "Biology"


@pytest.mark.asyncio
@integration
async def test_admin_can_reassign_staff_department(client):
    """S6: only admins may reassign department via PATCH /users/{id}/department."""
    admin_token, _ = await _register_and_login(client, role="ADMIN", department="IT")
    staff_token, staff_id = await _register_and_login(
        client, role="STAFF", department="IT Support — Tier 1"
    )
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    staff_denied = await client.patch(
        f"/api/v1/users/{staff_id}/department",
        json={"department": "Finance Office"},
        headers=staff_headers,
    )
    assert staff_denied.status_code == 403

    admin_ok = await client.patch(
        f"/api/v1/users/{staff_id}/department",
        json={"department": "Finance Office"},
        headers=admin_headers,
    )
    assert admin_ok.status_code == 200, admin_ok.text
    assert admin_ok.json()["data"]["department"] == "Finance Office"
