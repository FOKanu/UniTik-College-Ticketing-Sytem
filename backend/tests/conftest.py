import os

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

INTEGRATION = os.getenv("INTEGRATION_TESTS") == "1"

integration = pytest.mark.skipif(
    not INTEGRATION,
    reason="Integration tests require Postgres (INTEGRATION_TESTS=1)",
)


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
