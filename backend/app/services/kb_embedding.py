"""KB embedding helpers — context blobs + validated vectors via ``app.ai``.

Embeddings use the same OpenAI-compatible provider as chat (Ollama Funnel / OpenAI /
Gemini). There is no separate ``EMBEDDING_SERVICE_URL`` microservice.
"""

from __future__ import annotations

import json
import math
from collections.abc import Mapping
from numbers import Real

from app.ai.client import LLMUnavailableError, create_embedding
from app.ai.llm_config import get_llm_config

EMBEDDING_DIMENSIONS = 768


class EmbeddingProviderError(Exception):
    """Sanitized operational failure from the configured embedding provider."""


class InvalidEmbeddingResponseError(EmbeddingProviderError):
    """The embedding provider returned data that does not match the KB contract."""


def build_context_blob(entry) -> str:
    """Build deterministic serialized retrieval context (not the vector itself)."""
    return json.dumps(
        {
            "id": entry.id,
            "department": entry.department,
            "audience": entry.audience,
            "language": entry.language,
            "question": entry.question,
            "relatedPhrasings": entry.related_phrasings,
            "keywords": entry.keywords,
            "answer": entry.answer,
            "escalation": entry.escalation,
        },
        ensure_ascii=False,
    )


def validate_embedding_vector(
    vector: object,
    *,
    expected_dimensions: int | None = None,
) -> list[float]:
    dims = expected_dimensions if expected_dimensions is not None else EMBEDDING_DIMENSIONS
    if not isinstance(vector, list):
        raise InvalidEmbeddingResponseError("Embedding provider returned an invalid embedding.")
    if len(vector) != dims:
        raise InvalidEmbeddingResponseError(f"Embedding must contain exactly {dims} values.")

    normalized: list[float] = []
    for value in vector:
        if isinstance(value, bool) or not isinstance(value, Real):
            raise InvalidEmbeddingResponseError("Embedding contains a non-numeric value.")
        try:
            normalized_value = float(value)
        except (OverflowError, ValueError):
            raise InvalidEmbeddingResponseError("Embedding contains a non-finite value.") from None
        if not math.isfinite(normalized_value):
            raise InvalidEmbeddingResponseError("Embedding contains a non-finite value.")
        normalized.append(normalized_value)
    return normalized


def validate_embedding_response(data: object) -> list[float]:
    """Accept either a raw vector list or ``{"embedding": [...]}`` (legacy test shape)."""
    if isinstance(data, list):
        return validate_embedding_vector(data)
    if not isinstance(data, Mapping):
        raise InvalidEmbeddingResponseError("Embedding provider returned an invalid response.")
    if "embedding" not in data or data["embedding"] is None:
        raise InvalidEmbeddingResponseError("Embedding provider response is missing an embedding.")
    return validate_embedding_vector(data["embedding"])


async def embed_text(text: str) -> list[float]:
    """Embed ``text`` through ``app.ai.create_embedding`` and enforce column width."""
    config = get_llm_config()
    try:
        raw = await create_embedding(text)
    except LLMUnavailableError as exc:
        raise EmbeddingProviderError(str(exc)) from exc

    try:
        return validate_embedding_vector(raw, expected_dimensions=config.embedding_dimensions)
    except InvalidEmbeddingResponseError:
        raise
    except Exception as exc:  # noqa: BLE001 — normalize unexpected provider shapes
        raise EmbeddingProviderError("Embedding provider returned an invalid response.") from exc
