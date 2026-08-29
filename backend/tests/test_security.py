import base64
import json
import time

import pytest
from jose import jwt

from app.core.config import get_settings
from app.core.rate_limit import clear_memory_store
from app.services import auth as auth_service
from tests.test_rbac import _register_and_login


@pytest.mark.asyncio
async def test_expired_token_is_rejected(client):
    settings = get_settings()
    payload = {"sub": "some-fake-user-id", "role": "ADMIN", "exp": int(time.time()) - 60}
    expired_token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_wrong_signature_token_is_rejected(client):
    payload = {"sub": "some-fake-user-id", "role": "ADMIN", "exp": int(time.time()) + 3600}
    forged_token = jwt.encode(payload, "totally-wrong-guessed-secret", algorithm="HS256")
    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {forged_token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_naive_payload_tampering_is_rejected(client):
    """Simulates decoding a real JWT, editing the payload (e.g. changing role
    to ADMIN), and re-assembling without a valid signature — the classic
    'edit the token in devtools' attack."""
    student_token, _ = await _register_and_login(client, role="STUDENT")
    header_b64, payload_b64, signature_b64 = student_token.split(".")

    def b64url_decode(s):
        return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))

    def b64url_encode(data):
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    payload = json.loads(b64url_decode(payload_b64))
    payload["role"] = "ADMIN"
    tampered_payload_b64 = b64url_encode(json.dumps(payload).encode())
    tampered_token = f"{header_b64}.{tampered_payload_b64}.{signature_b64}"

    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {tampered_token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sql_injection_attempt_in_login_fails_cleanly(client):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "' OR 1=1--", "password": "' OR 1=1--"},
    )
    assert response.status_code in (401, 422)


@pytest.mark.asyncio
async def test_alg_none_attack_is_rejected(client):
    """Classic JWT vulnerability: crafting a token with alg=none and no
    signature, hoping the server skips verification entirely."""
    header = (
        base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode())
        .rstrip(b"=")
        .decode()
    )
    payload = (
        base64.urlsafe_b64encode(
            json.dumps({"sub": "some-fake-user-id", "role": "ADMIN"}).encode()
        )
        .rstrip(b"=")
        .decode()
    )
    forged_token = f"{header}.{payload}."

    response = await client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {forged_token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_rate_limit_blocks_after_threshold(client, monkeypatch):
    """Confirms /auth/login enforces its rate limit (5 req/min)."""
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.setenv("REDIS_URL", "")
    get_settings.cache_clear()
    clear_memory_store()

    async def mock_login(db, body):
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Invalid email or password")

    monkeypatch.setattr(auth_service, "login", mock_login)

    statuses = []
    for _ in range(7):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "jordan.alvarez@student.university.edu",
                "password": "wrong-password",
            },
        )
        statuses.append(response.status_code)

    assert statuses[:5] == [401] * 5
    assert statuses[5] == 429
    assert statuses[6] == 429

    assert response.headers.get("Retry-After") is not None
    assert response.headers.get("X-RateLimit-Limit") == "5"
    assert response.headers.get("X-RateLimit-Remaining") == "0"
    clear_memory_store()
    get_settings.cache_clear()
