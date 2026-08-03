"""Provider-agnostic chat client.

The browser never reaches a model provider directly — every call goes through
this module, which owns credentials, timeouts, and reasoning-token stripping.
"""

import logging
import time
from collections.abc import AsyncIterator, Iterable

import httpx
from openai import APIConnectionError, APIStatusError, AsyncOpenAI, OpenAIError

from app.ai.llm_config import LLMProvider, ResolvedLLMConfig, get_llm_config
from app.ai.prompts import ChatMode, mode_settings, system_prompt

logger = logging.getLogger(__name__)

HEALTH_CACHE_TTL_SECONDS = 10.0
# Funnel/proxy round-trips are slower than local Ollama; keep this above a few seconds.
HEALTH_TIMEOUT_SECONDS = 15.0

THINK_OPEN = "<think>"
THINK_CLOSE = "</think>"


class LLMUnavailableError(Exception):
    """The configured provider could not be reached or refused the request."""


class ThinkTagFilter:
    """Strips ``<think>…</think>`` spans from a token stream.

    Reasoning models such as qwen3 emit their scratchpad inline. Tags can be
    split across chunks, so a partial tag is held back rather than emitted.
    """

    def __init__(self) -> None:
        self._buffer = ""
        self._inside = False

    def feed(self, chunk: str) -> str:
        self._buffer += chunk
        out: list[str] = []

        while self._buffer:
            if self._inside:
                end = self._buffer.find(THINK_CLOSE)
                if end == -1:
                    self._buffer = self._buffer[-(len(THINK_CLOSE) - 1) :]
                    break
                self._buffer = self._buffer[end + len(THINK_CLOSE) :]
                self._inside = False
                continue

            start = self._buffer.find(THINK_OPEN)
            if start == -1:
                hold = len(THINK_OPEN) - 1
                if len(self._buffer) > hold:
                    out.append(self._buffer[:-hold])
                    self._buffer = self._buffer[-hold:]
                break

            out.append(self._buffer[:start])
            self._buffer = self._buffer[start + len(THINK_OPEN) :]
            self._inside = True

        return "".join(out)

    def flush(self) -> str:
        # An unterminated <think> means the model was cut off mid-reasoning.
        rest = "" if self._inside else self._buffer
        self._buffer = ""
        self._inside = False
        return rest


def strip_think_tags(text: str) -> str:
    filt = ThinkTagFilter()
    return (filt.feed(text) + filt.flush()).strip()


_clients: dict[tuple[str, str, float], AsyncOpenAI] = {}


def _get_client(config: ResolvedLLMConfig) -> AsyncOpenAI:
    key = (config.base_url, config.api_key, config.timeout)
    client = _clients.get(key)
    if client is None:
        # Ignore HTTP(S)_PROXY from the environment. Cursor/dev shells often inject a
        # local proxy that breaks outbound HTTPS to Tailscale Funnel / cloud LLMs.
        http_client = httpx.AsyncClient(trust_env=False, timeout=config.timeout)
        client = AsyncOpenAI(
            base_url=config.base_url,
            api_key=config.api_key,
            timeout=config.timeout,
            max_retries=1,
            http_client=http_client,
        )
        _clients[key] = client
    return client


def build_messages(
    history: Iterable[tuple[str, str]],
    mode: ChatMode = ChatMode.QUICK,
) -> list[dict[str, str]]:
    """Turn ``(sender, content)`` rows into OpenAI-shaped messages."""
    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt(mode)}]
    for sender, content in history:
        role = "assistant" if sender == "bot" else "user"
        messages.append({"role": role, "content": content})
    return messages


def _request_kwargs(config: ResolvedLLMConfig, mode: ChatMode) -> dict:
    settings = mode_settings(mode)
    kwargs: dict = {
        "model": config.model,
        "temperature": settings["temperature"],
        "max_tokens": min(settings["max_tokens"], config.max_tokens),
    }
    if config.extra_body:
        kwargs["extra_body"] = config.extra_body
    return kwargs


def _wrap_error(exc: Exception, config: ResolvedLLMConfig) -> LLMUnavailableError:
    if isinstance(exc, APIConnectionError):
        return LLMUnavailableError(
            f"Cannot reach the {config.provider.value} server at {config.base_url}"
        )
    if isinstance(exc, APIStatusError):
        return LLMUnavailableError(
            f"{config.provider.value} returned HTTP {exc.status_code} for model {config.model}"
        )
    return LLMUnavailableError(str(exc))


async def chat_completion(
    messages: list[dict[str, str]],
    mode: ChatMode = ChatMode.QUICK,
) -> str:
    config = get_llm_config()
    if not config.is_configured:
        raise LLMUnavailableError(f"No credentials configured for provider {config.provider.value}")

    client = _get_client(config)
    try:
        response = await client.chat.completions.create(
            messages=messages, **_request_kwargs(config, mode)
        )
    except OpenAIError as exc:
        logger.warning("LLM completion failed: %s", exc)
        raise _wrap_error(exc, config) from exc

    choices = response.choices
    content = choices[0].message.content if choices else ""
    return strip_think_tags(content or "")


async def stream_chat_completion(
    messages: list[dict[str, str]],
    mode: ChatMode = ChatMode.QUICK,
) -> AsyncIterator[str]:
    config = get_llm_config()
    if not config.is_configured:
        raise LLMUnavailableError(f"No credentials configured for provider {config.provider.value}")

    client = _get_client(config)
    try:
        stream = await client.chat.completions.create(
            messages=messages, stream=True, **_request_kwargs(config, mode)
        )
    except OpenAIError as exc:
        logger.warning("LLM stream failed to start: %s", exc)
        raise _wrap_error(exc, config) from exc

    filt = ThinkTagFilter()
    try:
        async for chunk in stream:
            if not chunk.choices:
                continue
            piece = chunk.choices[0].delta.content or ""
            if not piece:
                continue
            visible = filt.feed(piece)
            if visible:
                yield visible
    except OpenAIError as exc:
        logger.warning("LLM stream interrupted: %s", exc)
        raise _wrap_error(exc, config) from exc

    tail = filt.flush()
    if tail:
        yield tail


_health_cache: tuple[float, dict] | None = None


async def create_embedding(text: str) -> list[float]:
    """Return a single embedding vector via the OpenAI-compatible ``/v1/embeddings`` API.

    Uses the same provider base URL and API key as chat. The vector length must equal
    ``config.embedding_dimensions`` (1536 for ``FaqEntry.embedding``).
    """
    config = get_llm_config()
    if not config.embeddings_configured:
        raise LLMUnavailableError(
            "No embedding model configured. Set EMBEDDING_MODEL "
            "(or OPENAI_EMBEDDING_MODEL / OLLAMA_EMBEDDING_MODEL)."
        )

    client = _get_client(config)
    kwargs: dict = {"model": config.embedding_model, "input": text}
    # text-embedding-3-* accepts an explicit size; pin it to the pgvector column width.
    if config.provider is LLMProvider.OPENAI and config.embedding_model.startswith(
        "text-embedding-3"
    ):
        kwargs["dimensions"] = config.embedding_dimensions

    try:
        response = await client.embeddings.create(**kwargs)
    except OpenAIError as exc:
        logger.warning("Embedding request failed: %s", exc)
        raise _wrap_error(exc, config) from exc

    if not response.data:
        raise LLMUnavailableError("Embedding provider returned no vectors")
    return list(response.data[0].embedding)


async def check_llm_health(force: bool = False) -> dict:
    """Report provider reachability. Cached briefly so health polling stays cheap."""
    global _health_cache

    now = time.monotonic()
    if not force and _health_cache and now - _health_cache[0] < HEALTH_CACHE_TTL_SECONDS:
        return _health_cache[1]

    config = get_llm_config()
    result = config.public_summary()

    if not config.is_configured:
        result |= {"status": "unconfigured", "error": "Missing base URL, API key, or model"}
        _health_cache = (now, result)
        return result

    try:
        client = _get_client(config)
        models = await client.with_options(timeout=HEALTH_TIMEOUT_SECONDS).models.list()
        available = [m.id for m in models.data]
        result |= {
            "status": "online",
            "modelAvailable": config.model in available if available else None,
        }
    except Exception as exc:  # noqa: BLE001 — health must never raise
        logger.warning("LLM health check failed: %s: %s", type(exc).__name__, exc)
        result |= {"status": "offline", "error": str(_wrap_error(exc, config))}

    _health_cache = (now, result)
    return result
