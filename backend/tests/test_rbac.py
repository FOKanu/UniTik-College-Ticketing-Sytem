import pytest

from app.core.security import hash_password
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import User
from tests.conftest import integration


async def _register_and_login(client, *, role: str, department: str | None = None):
    import uuid

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
                department=department,
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
async def test_student_cannot_update_ticket(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    headers = {"Authorization": f"Bearer {student_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "Printer broken", "description": "Won't turn on"},
        headers=headers,
    )
    ticket_id = create_res.json()["data"]["id"]

    update_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "RESOLVED"},
        headers=headers,
    )
    assert update_res.status_code == 403


@pytest.mark.asyncio
@integration
async def test_student_cannot_post_internal_comment(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    headers = {"Authorization": f"Bearer {student_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "Wifi issue", "description": "Not connecting"},
        headers=headers,
    )
    ticket_id = create_res.json()["data"]["id"]

    comment_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/comments",
        json={"body": "internal note attempt", "isInternal": True},
        headers=headers,
    )
    assert comment_res.status_code == 403


@pytest.mark.asyncio
@integration
async def test_staff_cannot_see_other_department_ticket(client):
    it_staff_token, _ = await _register_and_login(client, role="STAFF", department="IT")
    hr_staff_token, _ = await _register_and_login(client, role="STAFF", department="HR")

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "HR question", "description": "Benefits", "department": "HR"},
        headers={"Authorization": f"Bearer {hr_staff_token}"},
    )
    ticket_id = create_res.json()["data"]["id"]

    get_res = await client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    assert get_res.status_code == 403


@pytest.mark.asyncio
@integration
async def test_staff_only_sees_own_department_in_list(client):
    it_staff_token, _ = await _register_and_login(client, role="STAFF", department="IT")
    hr_staff_token, _ = await _register_and_login(client, role="STAFF", department="HR")

    await client.post(
        "/api/v1/tickets",
        json={"subject": "IT ticket", "description": "desc", "department": "IT"},
        headers={"Authorization": f"Bearer {it_staff_token}"},
    )
    await client.post(
        "/api/v1/tickets",
        json={"subject": "HR ticket", "description": "desc", "department": "HR"},
        headers={"Authorization": f"Bearer {hr_staff_token}"},
    )

    it_list = await client.get(
        "/api/v1/tickets", headers={"Authorization": f"Bearer {it_staff_token}"}
    )
    departments_seen = {t["department"] for t in it_list.json()["data"]}
    assert "HR" not in departments_seen


@pytest.mark.asyncio
@integration
async def test_admin_sees_all_departments(client):
    admin_token, _ = await _register_and_login(client, role="ADMIN")
    hr_staff_token, _ = await _register_and_login(client, role="STAFF", department="HR")

    await client.post(
        "/api/v1/tickets",
        json={"subject": "HR ticket", "description": "desc", "department": "HR"},
        headers={"Authorization": f"Bearer {hr_staff_token}"},
    )

    admin_list = await client.get(
        "/api/v1/tickets", headers={"Authorization": f"Bearer {admin_token}"}
    )
    departments_seen = {t["department"] for t in admin_list.json()["data"]}
    assert "HR" in departments_seen


@pytest.mark.asyncio
@integration
async def test_student_cannot_list_users(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
@integration
async def test_staff_cannot_change_role(client):
    staff_token, staff_id = await _register_and_login(client, role="STAFF", department="IT")
    response = await client.patch(
        f"/api/v1/users/{staff_id}/role",
        json={"role": "ADMIN"},
        headers={"Authorization": f"Bearer {staff_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
@integration
async def test_admin_can_change_role(client):
    admin_token, _ = await _register_and_login(client, role="ADMIN")
    staff_token, staff_id = await _register_and_login(client, role="STAFF", department="IT")

    response = await client.patch(
        f"/api/v1/users/{staff_id}/role",
        json={"role": "ADMIN"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_no_token_is_rejected(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_garbage_token_is_rejected(client):
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401