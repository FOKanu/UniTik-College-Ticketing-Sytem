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
async def test_list_faq_public(client):
    response = await client.get("/api/v1/kb/faq")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
