import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.rate_limit import clear_memory_store, rate_limit


@pytest.fixture(autouse=True)
def reset_store(monkeypatch):
    # Force in-memory limiter so sync TestClient is not coupled to Redis.
    monkeypatch.setenv("REDIS_URL", "")
    get_settings.cache_clear()
    clear_memory_store()
    yield
    clear_memory_store()
    get_settings.cache_clear()


def test_unit_limit_threshold(monkeypatch):
    """Nth request passes, N+1 returns 429."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    app = FastAPI()

    @app.get("/test", dependencies=[rate_limit(max_requests=3, window_seconds=60)])
    def test_endpoint():
        return {"ok": True}

    client = TestClient(app)

    # First 3 requests succeed
    for i in range(3):
        res = client.get("/test")
        assert res.status_code == 200, f"Request {i+1} failed"
        assert res.headers["X-RateLimit-Limit"] == "3"
        assert res.headers["X-RateLimit-Remaining"] == str(3 - (i + 1))

    # 4th request returns 429
    res4 = client.get("/test")
    assert res4.status_code == 429
    assert res4.headers["X-RateLimit-Remaining"] == "0"
    assert "Retry-After" in res4.headers


def test_unit_counter_resets_after_window(monkeypatch):
    """Counter resets after window expires."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    current_time = 1000.0

    def fake_clock():
        return current_time

    app = FastAPI()

    @app.get(
        "/test",
        dependencies=[rate_limit(max_requests=2, window_seconds=10, clock_func=fake_clock)],
    )
    def test_endpoint():
        return {"ok": True}

    client = TestClient(app)

    assert client.get("/test").status_code == 200
    assert client.get("/test").status_code == 200
    assert client.get("/test").status_code == 429

    # Advance fake clock by 11 seconds (past 10s window)
    current_time += 11.0

    assert client.get("/test").status_code == 200
    assert client.get("/test").status_code == 200


def test_unit_per_key_isolation(monkeypatch):
    """Assert isolation between different keys (per-IP vs per-user vs per-API-key)."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    def user_key_func(request: Request) -> str:
        user_id = request.headers.get("X-User-ID", "anonymous")
        return f"ratelimit:user:{user_id}"

    def api_key_func(request: Request) -> str:
        api_key = request.headers.get("X-API-Key", "none")
        return f"ratelimit:apikey:{api_key}"

    app = FastAPI()

    @app.get(
        "/by-user",
        dependencies=[rate_limit(max_requests=2, window_seconds=60, key_func=user_key_func)],
    )
    def user_endpoint():
        return {"ok": True}

    @app.get(
        "/by-apikey",
        dependencies=[rate_limit(max_requests=2, window_seconds=60, key_func=api_key_func)],
    )
    def apikey_endpoint():
        return {"ok": True}

    client = TestClient(app)

    # User A uses 2 requests
    assert client.get("/by-user", headers={"X-User-ID": "user-A"}).status_code == 200
    assert client.get("/by-user", headers={"X-User-ID": "user-A"}).status_code == 200
    assert client.get("/by-user", headers={"X-User-ID": "user-A"}).status_code == 429

    # User B has separate limit and is unaffected
    assert client.get("/by-user", headers={"X-User-ID": "user-B"}).status_code == 200
    assert client.get("/by-user", headers={"X-User-ID": "user-B"}).status_code == 200

    # API Key 1 uses 2 requests
    assert client.get("/by-apikey", headers={"X-API-Key": "key-1"}).status_code == 200
    assert client.get("/by-apikey", headers={"X-API-Key": "key-1"}).status_code == 200
    assert client.get("/by-apikey", headers={"X-API-Key": "key-1"}).status_code == 429

    # API Key 2 is unaffected
    assert client.get("/by-apikey", headers={"X-API-Key": "key-2"}).status_code == 200
