import asyncio

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
async def test_concurrency_parallel_requests_memory_store(monkeypatch):
    """Fire N+1 parallel requests; assert N succeed and 1 returns 429."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    max_reqs = 10
    total_reqs = max_reqs + 1

    app = FastAPI()

    @app.get(
        "/concurrent",
        dependencies=[rate_limit(max_requests=max_reqs, window_seconds=60)],
    )
    async def concurrent_endpoint():
        await asyncio.sleep(0.001)
        return {"status": "ok"}

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        tasks = [client.get("/concurrent") for _ in range(total_reqs)]
        responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    assert status_codes.count(200) == max_reqs
    assert status_codes.count(429) == 1


@pytest.mark.asyncio
async def test_concurrency_high_volume_parallel_requests(monkeypatch):
    """Fire 50 parallel requests with max_requests=25.
    Assert exactly 25 succeed and 25 are rejected."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    max_reqs = 25
    total_reqs = 50

    app = FastAPI()

    @app.get(
        "/high-load",
        dependencies=[rate_limit(max_requests=max_reqs, window_seconds=60)],
    )
    async def high_load_endpoint():
        await asyncio.sleep(0.001)
        return {"status": "ok"}

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://testserver"
    ) as client:
        tasks = [client.get("/high-load") for _ in range(total_reqs)]
        responses = await asyncio.gather(*tasks)

    status_codes = [r.status_code for r in responses]
    assert status_codes.count(200) == 25
    assert status_codes.count(429) == 25
