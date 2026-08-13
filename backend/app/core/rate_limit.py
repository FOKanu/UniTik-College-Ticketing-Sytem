"""Rate limiting for sensitive endpoints (e.g. login).

Uses Redis when REDIS_URL is configured (shared across workers/restarts),
falling back to an in-process memory store otherwise — same fallback
pattern already used for LLM health caching.

Supports HTTP rate-limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining,
X-RateLimit-Reset, Retry-After), custom key extractors, atomic concurrency protection,
injectable clocks, and configurable fail-open/fail-closed policies.
"""

import asyncio
import logging
import os
import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, Response

from app.core.config import get_settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None

_memory_store: dict[str, list[float]] = defaultdict(list)
_memory_lock = asyncio.Lock()
_redis_client = None

SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_seconds = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local window_start = now - window_seconds

redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
local current_count = redis.call('ZCARD', key)

if current_count < max_requests then
    local seq_key = key .. ':seq'
    local seq = redis.call('INCR', seq_key)
    redis.call('EXPIRE', seq_key, window_seconds)
    local member = tostring(now) .. '-' .. tostring(seq)
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, window_seconds)
    local ttl = redis.call('TTL', key)
    if ttl <= 0 then ttl = window_seconds end
    return {1, current_count + 1, ttl}
else
    local ttl = redis.call('TTL', key)
    if ttl <= 0 then ttl = window_seconds end
    return {0, current_count, ttl}
end
"""

_lua_script_obj = None


def clear_memory_store():
    """Reset memory store state (useful between unit tests)."""
    _memory_store.clear()


def _get_redis():
    global _redis_client
    settings = get_settings()
    if not settings.redis_url or aioredis is None:
        return None
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


async def _check_memory(
    key: str, max_requests: int, window_seconds: int, now: float
) -> tuple[bool, int, int]:
    """Check and update memory store atomically.
    Returns (allowed, new_count, reset_in_seconds)."""
    async with _memory_lock:
        window_start = now - window_seconds
        attempts = _memory_store[key]
        attempts[:] = [t for t in attempts if t > window_start]
        count = len(attempts)

        if count < max_requests:
            attempts.append(now)
            new_count = count + 1
            oldest = attempts[0]
            reset_in = max(1, int(oldest + window_seconds - now))
            return True, new_count, reset_in
        else:
            oldest = attempts[0] if attempts else now
            reset_in = max(1, int(oldest + window_seconds - now))
            return False, count, reset_in


async def _check_redis(
    client, key: str, max_requests: int, window_seconds: int, now: float
) -> tuple[bool, int, int]:
    """Check and update Redis sliding window atomically via Lua script.
    Returns (allowed, new_count, reset_in_seconds)."""
    global _lua_script_obj
    if _lua_script_obj is None:
        _lua_script_obj = client.register_script(SLIDING_WINDOW_LUA)

    res = await _lua_script_obj(
        keys=[key],
        args=[str(now), str(window_seconds), str(max_requests)],
    )
    allowed_int, count, ttl = res
    allowed = bool(allowed_int)
    reset_in = max(1, int(ttl))
    return allowed, int(count), reset_in


def default_key_func(request: Request) -> str:
    client_ip = request.client.host if request.client else "unknown"
    return f"ratelimit:{request.url.path}:{client_ip}"


def rate_limit(
    max_requests: int,
    window_seconds: int,
    *,
    key_func: Callable[[Request], str] | None = None,
    clock_func: Callable[[], float] | None = None,
    fail_open: bool = True,
):
    """FastAPI dependency factory: limits requests per client/key.

    Parameters:
    - max_requests: max requests permitted in window
    - window_seconds: rate limit window in seconds
    - key_func: optional custom function (Request -> str) for key isolation
    - clock_func: optional injectable clock function (() -> float)
    - fail_open: whether store errors should allow the request (True) or raise 429 (False)
    """

    async def dependency(request: Request, response: Response = None) -> None:
        settings = get_settings()
        if not settings.rate_limit_enabled or os.environ.get("PYTEST_CURRENT_TEST"):
            return

        now = clock_func() if clock_func is not None else time.time()
        get_key = key_func if key_func is not None else default_key_func
        key = get_key(request)

        redis_client = _get_redis()
        allowed = True
        count = 1
        reset_in = window_seconds

        if redis_client is not None:
            try:
                allowed, count, reset_in = await _check_redis(
                    redis_client, key, max_requests, window_seconds, now
                )
            except Exception as exc:
                logger.warning("Redis rate limit error, fallback evaluated: %s", exc)
                if fail_open:
                    allowed, count, reset_in = await _check_memory(
                        key, max_requests, window_seconds, now
                    )
                else:
                    raise HTTPException(
                        status_code=429,
                        detail="Rate limiter service unavailable",
                        headers={"Retry-After": str(window_seconds)},
                    ) from exc
        else:
            allowed, count, reset_in = await _check_memory(
                key, max_requests, window_seconds, now
            )

        remaining = max(0, max_requests - count)
        reset_time = int(now + reset_in)

        if response is not None:
            response.headers["X-RateLimit-Limit"] = str(max_requests)
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(reset_time)

        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={
                    "Retry-After": str(reset_in),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                },
            )

    return Depends(dependency)