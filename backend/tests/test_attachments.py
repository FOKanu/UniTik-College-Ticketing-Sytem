import io
import uuid
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.core.exceptions import BadRequestError
from app.core.security import hash_password
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import User
from app.services import storage as storage_service
from app.services.tenants import DEFAULT_TENANT_ID
from tests.conftest import department_id_for, integration


@pytest.fixture(autouse=True)
def _isolate_uploads(tmp_path, monkeypatch):
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.setenv("MAX_UPLOAD_MB", "1")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_rejects_empty_and_oversized_and_bad_type():
    with pytest.raises(BadRequestError):
        storage_service.validate_upload("shot.png", 0)
    with pytest.raises(BadRequestError):
        storage_service.validate_upload("shot.png", 2 * 1024 * 1024)
    with pytest.raises(BadRequestError):
        storage_service.validate_upload("malware.exe", 100)


def test_save_and_delete_roundtrip(tmp_path):
    rel, file_type = storage_service.save_ticket_bytes(
        "ticket-1", "login error.png", b"png-bytes"
    )
    assert file_type == "png"
    abs_path = storage_service.absolute_path(rel)
    assert abs_path.is_file()
    assert abs_path.read_bytes() == b"png-bytes"
    assert "login_error.png" in Path(rel).name or "login error.png" in Path(rel).name

    storage_service.delete_file(rel)
    assert not abs_path.exists()


@pytest.mark.asyncio
async def test_list_attachments_requires_auth(client):
    response = await client.get(f"/api/v1/tickets/{uuid.uuid4()}/attachments")
    assert response.status_code == 401


async def _register_and_login(client, *, role: str, department: str | None = None):
    email = f"{role.lower()}-{uuid.uuid4().hex[:8]}@stud.university.edu"
    password = "demo1234!"

    if role == "STUDENT":
        register_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "displayName": f"Test {role.title()}",
                "role": role,
            },
        )
        assert register_res.status_code == 201, register_res.text
    else:
        async with async_session_factory() as db:
            db.add(
                User(
                    tenantId=DEFAULT_TENANT_ID,
                    email=email,
                    displayName=f"Test {role.title()}",
                    role=Role(role),
                    departmentId=await department_id_for(db, department),
                    passwordHash=hash_password(password),
                )
            )
            await db.commit()

    login_res = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert login_res.status_code == 200, login_res.text
    body = login_res.json()["data"]
    return body["token"], body["user"]["id"]


@pytest.mark.asyncio
@integration
async def test_attachment_upload_list_download_delete(client):
    student_token, _ = await _register_and_login(client, role="STUDENT")
    headers = {"Authorization": f"Bearer {student_token}"}

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "Need screenshot", "description": "VPN fails"},
        headers=headers,
    )
    assert create_res.status_code == 201, create_res.text
    ticket_id = create_res.json()["data"]["id"]

    upload_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/attachments",
        headers=headers,
        files={"file": ("vpn-error.png", io.BytesIO(b"fake-png-content"), "image/png")},
    )
    assert upload_res.status_code == 201, upload_res.text
    attachment = upload_res.json()["data"]
    assert attachment["name"] == "vpn-error.png"
    assert attachment["fileType"] == "png"
    assert attachment["fileSizeBytes"] == len(b"fake-png-content")
    attachment_id = attachment["id"]

    list_res = await client.get(
        f"/api/v1/tickets/{ticket_id}/attachments", headers=headers
    )
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    download_res = await client.get(
        f"/api/v1/tickets/{ticket_id}/attachments/{attachment_id}",
        headers=headers,
    )
    assert download_res.status_code == 200
    assert download_res.content == b"fake-png-content"

    delete_res = await client.delete(
        f"/api/v1/tickets/{ticket_id}/attachments/{attachment_id}",
        headers=headers,
    )
    assert delete_res.status_code == 200
    assert delete_res.json()["data"]["deleted"] is True

    empty = await client.get(
        f"/api/v1/tickets/{ticket_id}/attachments", headers=headers
    )
    assert empty.json()["data"] == []


@pytest.mark.asyncio
@integration
async def test_student_cannot_attach_to_foreign_ticket(client):
    owner_token, _ = await _register_and_login(client, role="STUDENT")
    other_token, _ = await _register_and_login(client, role="STUDENT")

    create_res = await client.post(
        "/api/v1/tickets",
        json={"subject": "Owner ticket", "description": "private"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    ticket_id = create_res.json()["data"]["id"]

    denied = await client.post(
        f"/api/v1/tickets/{ticket_id}/attachments",
        headers={"Authorization": f"Bearer {other_token}"},
        files={"file": ("x.png", io.BytesIO(b"x"), "image/png")},
    )
    assert denied.status_code == 403
