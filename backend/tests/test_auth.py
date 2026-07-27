import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import integration


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


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
