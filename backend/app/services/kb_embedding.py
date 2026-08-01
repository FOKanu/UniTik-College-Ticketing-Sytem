import json
import math
import os
from collections.abc import Mapping
from numbers import Real

import httpx

EMBEDDING_DIMENSIONS = 1536
EMBEDDING_TIMEOUT_SECONDS = 60.0
EMBEDDING_SERVICE_URL = os.getenv("EMBEDDING_SERVICE_URL", "http://localhost:8001/embed")


class EmbeddingProviderError(Exception):
    """Sanitized operational failure from the configured embedding service."""


class InvalidEmbeddingResponseError(EmbeddingProviderError):
    """The embedding service returned data that does not match the KB contract."""


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


def validate_embedding_response(data: object) -> list[float]:
    if not isinstance(data, Mapping):
        raise InvalidEmbeddingResponseError("Embedding provider returned an invalid response.")
    if "embedding" not in data or data["embedding"] is None:
        raise InvalidEmbeddingResponseError("Embedding provider response is missing an embedding.")

    vector = data["embedding"]
    if not isinstance(vector, list):
        raise InvalidEmbeddingResponseError("Embedding provider returned an invalid embedding.")
    if len(vector) != EMBEDDING_DIMENSIONS:
        raise InvalidEmbeddingResponseError(
            f"Embedding must contain exactly {EMBEDDING_DIMENSIONS} values."
        )

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


async def embed_text(text: str, *, client: httpx.AsyncClient | None = None) -> list[float]:
    async def request(active_client: httpx.AsyncClient) -> list[float]:
        try:
            response = await active_client.post(EMBEDDING_SERVICE_URL, json={"input": text})
            response.raise_for_status()
            try:
                data = response.json()
            except ValueError:
                raise EmbeddingProviderError("Embedding provider returned invalid JSON.") from None
            return validate_embedding_response(data)
        except httpx.TimeoutException:
            raise EmbeddingProviderError("Embedding provider request timed out.") from None
        except httpx.ConnectError:
            raise EmbeddingProviderError("Could not connect to the embedding provider.") from None
        except httpx.HTTPStatusError:
            raise EmbeddingProviderError(
                "Embedding provider returned an unsuccessful status."
            ) from None

    if client is not None:
        return await request(client)
    async with httpx.AsyncClient(timeout=EMBEDDING_TIMEOUT_SECONDS) as managed_client:
        return await request(managed_client)
