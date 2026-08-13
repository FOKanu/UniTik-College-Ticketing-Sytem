import pytest

from app.core.rate_limit import clear_memory_store
from app.services import auth as auth_service


@pytest.mark.asyncio
async def test_login_rate_limit_blocks_after_threshold(client, monkeypatch):
    """Confirms /auth/login enforces its rate limit (5 req/min)."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    clear_memory_store()

    # Mock auth_service.login to return 401 without requiring Postgres
    async def mock_login(db, body):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid email or password")

    monkeypatch.setattr(auth_service, "login", mock_login)

    statuses = []
    headers_list = []
    for _ in range(7):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "jordan.alvarez@student.university.edu", "password": "wrong-password"},
        )
        statuses.append(response.status_code)
        headers_list.append(response.headers)

    assert statuses[:5] == [401] * 5
    assert statuses[5] == 429
    assert statuses[6] == 429

    # Verify rate limit headers
    assert response.headers.get("Retry-After") is not None
    assert response.headers.get("X-RateLimit-Limit") == "5"
    assert response.headers.get("X-RateLimit-Remaining") == "0"
    clear_memory_store()