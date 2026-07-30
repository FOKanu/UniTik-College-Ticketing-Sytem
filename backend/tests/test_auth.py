import pytest
import asyncio
import uuid

from tests.conftest import integration


@pytest.mark.asyncio
@integration
async def test_login_invalid_credentials(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@university.edu", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_sso_stub_returns_not_implemented(client):
    response = await client.post(
        "/api/v1/auth/sso",
        json={"provider": "microsoft"},
    )
    assert response.status_code == 501
    assert response.json()["success"] is False
    assert "OI-01" in response.json()["error"]["message"]


@pytest.mark.asyncio
async def test_refresh_invalid_token(client):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"token": "not-a-real-token"},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.asyncio
@integration
async def test_refresh_returns_new_token(client):
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"refresh-test-{uuid.uuid4().hex[:8]}@student.university.edu",
            "password": "demo1234",
            "displayName": "Refresh Test",
            "role": "STUDENT",
        },
    )
    assert register_response.status_code == 201
    original_token = register_response.json()["data"]["token"]

    await asyncio.sleep(1.1)
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"token": original_token},
    )
    assert response.status_code == 200
    assert response.json()["data"]["token"] != original_token