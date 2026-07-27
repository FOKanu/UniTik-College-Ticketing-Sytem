import pytest


@pytest.mark.asyncio
async def test_list_tickets_requires_auth(client):
    response = await client.get("/api/v1/tickets")
    assert response.status_code == 401
