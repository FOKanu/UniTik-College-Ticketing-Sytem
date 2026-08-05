import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.services import departments as departments_service

INTEGRATION = os.getenv("INTEGRATION_TESTS") == "1"

integration = pytest.mark.skipif(
    not INTEGRATION,
    reason="Integration tests require Postgres (INTEGRATION_TESTS=1)",
)


async def department_id_for(db: AsyncSession, name: str | None) -> str | None:
    """Resolve a free-text label to Department.id (get-or-create)."""
    dept = await departments_service.get_or_create_department(db, name)
    return dept.id if dept else None


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
