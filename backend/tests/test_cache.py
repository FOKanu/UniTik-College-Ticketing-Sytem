"""Tests for optional Redis / in-process cache helper."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai import client as ai_client
from app.core import cache as cache_mod
from app.core.cache import cache_delete, cache_get, cache_set, reset_cache_state_for_tests


@pytest.fixture(autouse=True)
def _reset_cache():
    reset_cache_state_for_tests()
    yield
    reset_cache_state_for_tests()


@pytest.mark.asyncio
async def test_memory_cache_get_set_and_expiry(monkeypatch):
    monkeypatch.setattr(cache_mod, "_get_redis", AsyncMock(return_value=None))

    assert await cache_get("k") is None
    await cache_set("k", "v", ttl_seconds=60)
    assert await cache_get("k") == "v"

    # Force expiry by rewriting the stored monotonic deadline.
    expires_at, value = cache_mod._memory["k"]
    cache_mod._memory["k"] = (expires_at - 120, value)
    assert await cache_get("k") is None


@pytest.mark.asyncio
async def test_memory_cache_delete(monkeypatch):
    monkeypatch.setattr(cache_mod, "_get_redis", AsyncMock(return_value=None))
    await cache_set("k", "v", ttl_seconds=60)
    await cache_delete("k")
    assert await cache_get("k") is None


@pytest.mark.asyncio
async def test_redis_path_uses_setex_and_get(monkeypatch):
    redis = MagicMock()
    redis.get = AsyncMock(return_value="from-redis")
    redis.setex = AsyncMock()
    redis.delete = AsyncMock()
    monkeypatch.setattr(cache_mod, "_get_redis", AsyncMock(return_value=redis))

    assert await cache_get("llm:health") == "from-redis"
    await cache_set("llm:health", '{"status":"online"}', ttl_seconds=10)
    redis.setex.assert_awaited()
    await cache_delete("llm:health")
    redis.delete.assert_awaited()


@pytest.mark.asyncio
async def test_llm_health_uses_shared_cache(monkeypatch):
    monkeypatch.setattr(cache_mod, "_get_redis", AsyncMock(return_value=None))

    summary = {"provider": "ollama", "status": "online", "modelAvailable": True}

    async def fake_configured_check(force: bool = False):
        return summary

    # Seed cache as check_llm_health would.
    await cache_set(ai_client.HEALTH_CACHE_KEY, json.dumps(summary), 10)

    with patch.object(ai_client, "get_llm_config") as mock_cfg:
        mock_cfg.return_value.is_configured = True
        result = await ai_client.check_llm_health(force=False)

    assert result["status"] == "online"
    # Should not have needed to call the provider when cache hits.
    mock_cfg.assert_not_called()
