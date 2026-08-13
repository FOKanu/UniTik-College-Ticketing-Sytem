"""Optional shared cache: Redis when REDIS_URL is set, else in-process memory.

Used for short-lived values such as LLM health. Embedding/notify job queues stay
on Postgres and do not use this module.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_memory: dict[str, tuple[float, str]] = {}
_redis_client: Any | None = None
_redis_failed = False


def _memory_get(key: str) -> str | None:
    row = _memory.get(key)
    if row is None:
        return None
    expires_at, value = row
    if time.monotonic() >= expires_at:
        _memory.pop(key, None)
        return None
    return value


def _memory_set(key: str, value: str, ttl_seconds: float) -> None:
    _memory[key] = (time.monotonic() + ttl_seconds, value)


async def _get_redis():
    """Return a redis.asyncio client, or None when unset / unavailable."""
    global _redis_client, _redis_failed

    url = (get_settings().redis_url or "").strip()
    if not url:
        return None
    if _redis_failed:
        return None
    if _redis_client is not None:
        return _redis_client

    try:
        from redis.asyncio import Redis

        client = Redis.from_url(url, decode_responses=True)
        await client.ping()
        _redis_client = client
        return client
    except Exception as exc:  # noqa: BLE001 — optional infra must not break requests
        _redis_failed = True
        logger.warning("Redis unavailable (%s); using in-process memory cache", exc)
        return None


async def cache_get(key: str) -> str | None:
    client = await _get_redis()
    if client is not None:
        try:
            value = await client.get(key)
            if value is not None:
                return value
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis GET failed (%s); falling back to memory", exc)
    return _memory_get(key)


async def cache_set(key: str, value: str, ttl_seconds: float) -> None:
    # Always keep a local copy so force-refresh paths and Redis blips stay coherent.
    _memory_set(key, value, ttl_seconds)

    client = await _get_redis()
    if client is None:
        return
    try:
        await client.setex(key, int(max(1, ttl_seconds)), value)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis SET failed (%s); memory cache retained", exc)


async def cache_delete(key: str) -> None:
    _memory.pop(key, None)
    client = await _get_redis()
    if client is None:
        return
    try:
        await client.delete(key)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis DELETE failed (%s)", exc)


def reset_cache_state_for_tests() -> None:
    """Clear memory + Redis client handle (unit tests only)."""
    global _redis_client, _redis_failed
    _memory.clear()
    _redis_client = None
    _redis_failed = False
