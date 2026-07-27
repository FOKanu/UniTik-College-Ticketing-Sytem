import pytest


@pytest.mark.asyncio
async def test_create_conversation_requires_auth(client):
    response = await client.post("/api/v1/chat/conversations")
    assert response.status_code == 401
