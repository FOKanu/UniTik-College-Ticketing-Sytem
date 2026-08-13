import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.rate_limit import clear_memory_store, rate_limit


@pytest.fixture(autouse=True)
def reset_store():
    clear_memory_store()
    yield
    clear_memory_store()


@pytest.mark.asyncio
async def test_integration_rate_limit_headers_and_body(monkeypatch):
    """Verify rate limiter response headers and 429 JSON payload."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    app = FastAPI()

    @app.get("/api/v1/protected", dependencies=[rate_limit(max_requests=2, window_seconds=30)])
    async def protected_route():
        return {"success": True, "message": "Access granted"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Request 1: 200 OK
        res1 = await client.get("/api/v1/protected")
        assert res1.status_code == 200
        assert res1.json() == {"success": True, "message": "Access granted"}
        assert res1.headers["X-RateLimit-Limit"] == "2"
        assert res1.headers["X-RateLimit-Remaining"] == "1"
        assert "X-RateLimit-Reset" in res1.headers

        # Request 2: 200 OK
        res2 = await client.get("/api/v1/protected")
        assert res2.status_code == 200
        assert res2.headers["X-RateLimit-Limit"] == "2"
        assert res2.headers["X-RateLimit-Remaining"] == "0"
        assert "X-RateLimit-Reset" in res2.headers

        # Request 3: 429 Too Many Requests
        res3 = await client.get("/api/v1/protected")
        assert res3.status_code == 429
        assert res3.json() == {"detail": "Too many requests. Please try again later."}
        assert res3.headers["X-RateLimit-Limit"] == "2"
        assert res3.headers["X-RateLimit-Remaining"] == "0"
        assert "X-RateLimit-Reset" in res3.headers
        assert "Retry-After" in res3.headers
        assert int(res3.headers["Retry-After"]) >= 1
