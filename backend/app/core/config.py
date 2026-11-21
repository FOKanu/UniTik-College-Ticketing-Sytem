from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Known insecure values that must never ship (D1 / S2).
INSECURE_JWT_SECRETS = frozenset(
    {
        "",
        "replace-me-with-a-strong-secret",
        "changeme",
        "secret",
        "jwt-secret",
        "your-secret-here",
    }
)

MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    port: int = 4000
    database_url: str = (
        "postgresql+asyncpg://uts_user:uts_password@localhost:5432/university_ticketing"
    )
    # Required — no insecure default. Generate with: openssl rand -hex 32
    jwt_secret: str
    jwt_expires_in: int = 86400
    cors_origin: str = "http://localhost:5173"
    # Local attachment storage (S3/MinIO deferred). Paths are relative to the
    # process cwd when not absolute — run uvicorn from `backend/`.
    upload_dir: str = "uploads"
    max_upload_mb: int = 10
    # Outbound email (empty SMTP_HOST → console provider for local/dev).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@university.example"
    smtp_use_tls: bool = True
    # Optional Redis (empty → in-process memory cache). Example: redis://localhost:6379/0
    redis_url: str = ""
    rate_limit_enabled: bool = True
    # LLM settings live in app.ai.llm_config

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        secret = (value or "").strip()
        if secret in INSECURE_JWT_SECRETS or secret.lower() in INSECURE_JWT_SECRETS:
            raise ValueError(
                "JWT_SECRET is missing or uses a known placeholder. "
                "Generate a per-environment secret with: openssl rand -hex 32"
            )
        if len(secret) < MIN_JWT_SECRET_LENGTH:
            raise ValueError(
                f"JWT_SECRET must be at least {MIN_JWT_SECRET_LENGTH} characters "
                "(use: openssl rand -hex 32)"
            )
        return secret

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
