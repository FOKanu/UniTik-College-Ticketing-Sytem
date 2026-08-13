import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core import rate_limit as rate_limit_module
from app.core.rate_limit import clear_memory_store, rate_limit


@pytest.fixture(autouse=True)
def reset_store():
    clear_memory_store()
    yield
    clear_memory_store()


class DummyBrokenRedis:
    """Mock Redis client that throws ConnectionError on script calls."""

    def register_script(self, script):
        async def broken_call(*args, **kwargs):
            raise Exception("Redis connection refused (simulated outage)")

        return broken_call


@pytest.mark.asyncio
async def test_failure_mode_fail_open_policy(monkeypatch):
    """Simulate Redis store crash with fail_open=True.
    Limiter should log warning and allow request."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setattr(rate_limit_module, "_get_redis", lambda: DummyBrokenRedis())

    app = FastAPI()

    @app.get(
        "/fail-open",
        dependencies=[rate_limit(max_requests=2, window_seconds=60, fail_open=True)],
    )
    async def fail_open_endpoint():
        return {"status": "success"}

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        res1 = await client.get("/fail-open")
        assert res1.status_code == 200
        assert res1.json() == {"status": "success"}

        res2 = await client.get("/fail-open")
        assert res2.status_code == 200


@pytest.mark.asyncio
async def test_failure_mode_fail_closed_policy(monkeypatch):
    """Simulate Redis store crash with fail_open=False.
    Limiter should reject request with 429 error."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setattr(rate_limit_module, "_get_redis", lambda: DummyBrokenRedis())

    app = FastAPI()

    @app.get(
        "/fail-closed",
        dependencies=[rate_limit(max_requests=2, window_seconds=60, fail_open=False)],
    )
    async def fail_closed_endpoint():
        return {"status": "success"}

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        res = await client.get("/fail-closed")
        assert res.status_code == 429
        assert res.json() == {"detail": "Rate limiter service unavailable"}
        assert "Retry-After" in res.headers
