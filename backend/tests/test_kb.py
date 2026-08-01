import pytest

from tests.conftest import integration


@pytest.mark.asyncio
@integration
async def test_list_faq_public(client):
    response = await client.get("/api/v1/kb/faq")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
