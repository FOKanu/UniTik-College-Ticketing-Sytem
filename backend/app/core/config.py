from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    port: int = 4000
    database_url: str = (
        "postgresql+asyncpg://uts_user:uts_password@localhost:5432/university_ticketing"
    )
    jwt_secret: str = "replace-me-with-a-strong-secret"
    jwt_expires_in: int = 86400
    cors_origin: str = "http://localhost:5173"
    # Local attachment storage (S3/MinIO deferred). Paths are relative to the
    # process cwd when not absolute — run uvicorn from `backend/`.
    upload_dir: str = "uploads"
    max_upload_mb: int = 10
    # LLM settings live in app.ai.llm_config

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
