"""Rate limiting for sensitive endpoints (e.g. login).

Uses Redis when REDIS_URL is configured (shared across workers/restarts),
falling back to an in-process memory store otherwise — same fallback
pattern already used for LLM health caching.

Automatically disabled while pytest is running (detected via the
PYTEST_CURRENT_TEST env var pytest sets on every test) so it never
interferes with the existing test suite, which calls /auth/login many
times across different test files.
"""

import os
import time
from collections import defaultdict

from fastapi import HTTPException, Request

from app.core.config import get_settings

try:
    import redis.asyncio as aioredis
except ImportError:
    aioredis = None

_memory_store: dict[str, list[float]] = defaultdict(list)
_redis_client = None


def _get_redis():
    global _redis_client
    settings = get_settings()
    if not settings.redis_url or aioredis is None:
        return None
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def _check_memory(key: str, max_requests: int, window_seconds: int) -> bool:
    now = time.time()
    window_start = now - window_seconds
    attempts = _memory_store[key]
    attempts[:] = [t for t in attempts if t > window_start]
    if len(attempts) >= max_requests:
        return False
    attempts.append(now)
    return True


async def _check_redis(client, key: str, max_requests: int, window_seconds: int) -> bool:
    now = time.time()
    window_start = now - window_seconds
    pipe = client.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zcard(key)
    pipe.zadd(key, {str(now): now})
    pipe.expire(key, window_seconds)
    _, count, _, _ = await pipe.execute()
    return count < max_requests


def rate_limit(max_requests: int, window_seconds: int):
    """FastAPI dependency factory: limits requests per client IP to
    max_requests within window_seconds. Raises 429 when exceeded."""

    async def dependency(request: Request) -> None:
        settings = get_settings()
        if not settings.rate_limit_enabled or os.environ.get("PYTEST_CURRENT_TEST"):
            return

        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{request.url.path}:{client_ip}"

        redis_client = _get_redis()
        if redis_client is not None:
            allowed = await _check_redis(redis_client, key, max_requests, window_seconds)
        else:
            allowed = _check_memory(key, max_requests, window_seconds)

        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
            )

    return dependency