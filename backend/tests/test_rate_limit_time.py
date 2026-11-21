import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.core.rate_limit import clear_memory_store, rate_limit


@pytest.fixture(autouse=True)
def reset_store(monkeypatch):
    monkeypatch.setenv("REDIS_URL", "")
    get_settings.cache_clear()
    clear_memory_store()
    yield
    clear_memory_store()
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_time_sliding_window_granularity(monkeypatch):
    """Test sliding window evaluation using fake injectable clock without real sleep."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    fake_time = 100.0

    def clock():
        return fake_time

    app = FastAPI()

    @app.get(
        "/sliding",
        dependencies=[rate_limit(max_requests=2, window_seconds=10, clock_func=clock)],
    )
    async def sliding_endpoint():
        return {"ok": True}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # t = 100.0: req 1 (allowed, remaining=1)
        res1 = await client.get("/sliding")
        assert res1.status_code == 200
        assert res1.headers["X-RateLimit-Remaining"] == "1"

        # t = 104.0: req 2 (allowed, remaining=0)
        fake_time = 104.0
        res2 = await client.get("/sliding")
        assert res2.status_code == 200
        assert res2.headers["X-RateLimit-Remaining"] == "0"

        # t = 106.0: req 3 (rejected, 429, window [96, 106] contains req1@100, req2@104)
        fake_time = 106.0
        res3 = await client.get("/sliding")
        assert res3.status_code == 429
        # Retry-After should be (100.0 + 10 - 106.0) = 4 seconds
        assert res3.headers["Retry-After"] == "4"

        # t = 110.5: req 4 (allowed! req1@100 slid out of window [100.5, 110.5])
        fake_time = 110.5
        res4 = await client.get("/sliding")
        assert res4.status_code == 200

        # t = 111.0: req 5 (rejected! window [101, 111] contains req2@104, req4@110.5)
        fake_time = 111.0
        res5 = await client.get("/sliding")
        assert res5.status_code == 429
        # Retry-After should be (104.0 + 10 - 111.0) = 3 seconds
        assert res5.headers["Retry-After"] == "3"


@pytest.mark.asyncio
async def test_time_retry_after_header_accuracy(monkeypatch):
    """Verify exact Retry-After header calculation as time progresses."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    fake_time = 500.0

    def clock():
        return fake_time

    app = FastAPI()

    @app.get(
        "/retry-test",
        dependencies=[rate_limit(max_requests=1, window_seconds=20, clock_func=clock)],
    )
    async def retry_endpoint():
        return {"ok": True}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # t = 500.0: req 1 (allowed)
        assert (await client.get("/retry-test")).status_code == 200

        # t = 505.0: req 2 (429, Retry-After = 15s)
        fake_time = 505.0
        res_a = await client.get("/retry-test")
        assert res_a.status_code == 429
        assert res_a.headers["Retry-After"] == "15"

        # t = 512.0: req 3 (429, Retry-After = 8s)
        fake_time = 512.0
        res_b = await client.get("/retry-test")
        assert res_b.status_code == 429
        assert res_b.headers["Retry-After"] == "8"
