import pytest


@pytest.mark.asyncio
async def test_login_rate_limit_blocks_after_threshold(client, monkeypatch):
    """Confirms /auth/login enforces its rate limit. Rate limiting is
    normally disabled during pytest runs (see core/rate_limit.py) so the
    rest of the suite isn't blocked by its own repeated login calls — this
    test explicitly re-enables it just for itself."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    statuses = []
    for _ in range(7):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "jordan.alvarez@student.university.edu", "password": "wrong-password"},
        )
        statuses.append(response.status_code)

    assert statuses[:5] == [401] * 5
    assert 429 in statuses[5:]