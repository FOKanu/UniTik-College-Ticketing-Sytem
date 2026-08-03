"""Single source of truth for LLM provider configuration.

Every supported provider speaks the OpenAI chat-completions protocol, so one
client implementation covers all three:

- ``ollama``  — self-hosted models via Ollama's ``/v1`` compatibility layer
- ``openai``  — api.openai.com
- ``google``  — Gemini via its OpenAI-compatible endpoint

Switch providers with ``LLM_PROVIDER``; nothing else in the codebase changes.
"""

from dataclasses import dataclass, field
from enum import StrEnum
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

GOOGLE_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
OPENAI_BASE_URL = "https://api.openai.com/v1"
OLLAMA_BASE_URL = "http://127.0.0.1:11434"


class LLMProvider(StrEnum):
    OLLAMA = "ollama"
    OPENAI = "openai"
    GOOGLE = "google"


@dataclass(frozen=True)
class ResolvedLLMConfig:
    """Flattened, provider-agnostic view consumed by ``app.ai.client``."""

    provider: LLMProvider
    base_url: str
    api_key: str
    model: str
    timeout: float
    temperature: float
    max_tokens: int
    embedding_model: str = ""
    embedding_dimensions: int = 768
    extra_body: dict = field(default_factory=dict)

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.model)

    @property
    def embeddings_configured(self) -> bool:
        return bool(self.base_url and self.api_key and self.embedding_model)

    def public_summary(self) -> dict:
        """Safe to return over HTTP — never includes the API key."""
        return {
            "provider": self.provider.value,
            "model": self.model,
            "baseUrl": self.base_url,
            "embeddingModel": self.embedding_model or None,
            "embeddingDimensions": self.embedding_dimensions,
        }


def _join_v1(base: str) -> str:
    base = base.rstrip("/")
    return base if base.endswith("/v1") else f"{base}/v1"


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_provider: LLMProvider = LLMProvider.OLLAMA
    llm_timeout_seconds: float = 60.0
    llm_temperature: float = 0.3
    llm_max_tokens: int = 800

    # Embeddings share the resolved chat provider base URL / API key unless overridden.
    # FaqEntry.embedding is Vector(768) — matches Ollama nomic-embed-text; OpenAI
    # text-embedding-3-* can pin dimensions=768 via the embeddings API.
    embedding_model: str = ""
    embedding_dimensions: int = 768
    openai_embedding_model: str = "text-embedding-3-small"
    ollama_embedding_model: str = "nomic-embed-text:latest"

    # Ollama (default provider — remote GPU box reached over an SSH tunnel).
    ollama_host: str = OLLAMA_BASE_URL
    ollama_base_url: str = ""
    ollama_openai_base_url: str = ""
    ollama_api_key: str = "ollama"
    ollama_model: str = "qwen3:8b"
    ollama_keep_alive: str = "10m"

    # OpenAI (future scale-out).
    openai_api_key: str = ""
    openai_base_url: str = OPENAI_BASE_URL
    openai_model: str = "gpt-4o-mini"

    # Google Gemini via OpenAI-compatible endpoint (future scale-out).
    google_api_key: str = ""
    google_base_url: str = GOOGLE_OPENAI_BASE_URL
    google_model: str = "gemini-2.0-flash"

    def _ollama_openai_url(self) -> str:
        # OLLAMA_OPENAI_BASE_URL wins; otherwise derive /v1 from the plain host.
        for candidate in (self.ollama_openai_base_url, self.ollama_base_url, self.ollama_host):
            if candidate:
                return _join_v1(candidate)
        return _join_v1(OLLAMA_BASE_URL)

    def _resolve_embedding_model(self) -> str:
        if self.embedding_model.strip():
            return self.embedding_model.strip()
        if self.llm_provider is LLMProvider.OPENAI:
            return self.openai_embedding_model.strip()
        if self.llm_provider is LLMProvider.OLLAMA:
            return self.ollama_embedding_model.strip()
        return ""

    def resolve(self) -> ResolvedLLMConfig:
        common = {
            "timeout": self.llm_timeout_seconds,
            "temperature": self.llm_temperature,
            "max_tokens": self.llm_max_tokens,
            "embedding_model": self._resolve_embedding_model(),
            "embedding_dimensions": self.embedding_dimensions,
        }

        if self.llm_provider is LLMProvider.OPENAI:
            return ResolvedLLMConfig(
                provider=LLMProvider.OPENAI,
                base_url=self.openai_base_url.rstrip("/"),
                api_key=self.openai_api_key,
                model=self.openai_model,
                **common,
            )

        if self.llm_provider is LLMProvider.GOOGLE:
            return ResolvedLLMConfig(
                provider=LLMProvider.GOOGLE,
                base_url=self.google_base_url.rstrip("/"),
                api_key=self.google_api_key,
                model=self.google_model,
                **common,
            )

        return ResolvedLLMConfig(
            provider=LLMProvider.OLLAMA,
            base_url=self._ollama_openai_url(),
            api_key=self.ollama_api_key or "ollama",
            model=self.ollama_model,
            # Ollama-only hint that keeps the model resident between requests.
            extra_body={"keep_alive": self.ollama_keep_alive} if self.ollama_keep_alive else {},
            **common,
        )


@lru_cache
def get_llm_settings() -> LLMSettings:
    return LLMSettings()


def get_llm_config() -> ResolvedLLMConfig:
    return get_llm_settings().resolve()
