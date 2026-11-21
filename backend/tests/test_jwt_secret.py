"""Unit tests for JWT_SECRET startup validation (D1 / S2)."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_jwt_secret_rejects_placeholder():
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            jwt_secret="replace-me-with-a-strong-secret",
            database_url="postgresql+asyncpg://u:p@localhost/db",
        )
    assert "placeholder" in str(exc_info.value).lower() or "JWT_SECRET" in str(exc_info.value)


def test_jwt_secret_rejects_short_secret():
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            jwt_secret="too-short-to-be-valid",
            database_url="postgresql+asyncpg://u:p@localhost/db",
        )
    assert "32" in str(exc_info.value)


def test_jwt_secret_accepts_strong_secret():
    settings = Settings(
        jwt_secret="test-secret-do-not-use-in-production",
        database_url="postgresql+asyncpg://u:p@localhost/db",
    )
    assert settings.jwt_secret == "test-secret-do-not-use-in-production"
