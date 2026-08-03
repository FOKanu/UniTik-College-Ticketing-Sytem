import asyncio
import math
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.ai.client import LLMUnavailableError
from app.services import kb_embedding as kb_embedding_mod
from app.services.kb_embedding import (
    EMBEDDING_DIMENSIONS,
    EmbeddingProviderError,
    InvalidEmbeddingResponseError,
    embed_text,
    validate_embedding_response,
    validate_embedding_vector,
)


def vector(value=1):
    return [value] * EMBEDDING_DIMENSIONS


def test_valid_embedding_is_copied_and_normalized_to_floats():
    original = vector(1)
    result = validate_embedding_response({"embedding": original})
    assert result == [1.0] * EMBEDDING_DIMENSIONS
    assert result is not original


def test_raw_vector_list_is_accepted():
    assert validate_embedding_response(vector(0.5)) == [0.5] * EMBEDDING_DIMENSIONS


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"embedding": None},
        {"embedding": []},
        {"embedding": "x" * EMBEDDING_DIMENSIONS},
        {"embedding": {"value": 1}},
        "not an object",
    ],
)
def test_invalid_embedding_shapes_are_rejected(payload):
    with pytest.raises(InvalidEmbeddingResponseError):
        validate_embedding_response(payload)


@pytest.mark.parametrize("value", ["1", True, math.nan, math.inf, -math.inf])
def test_invalid_embedding_elements_are_rejected(value):
    payload = vector()
    payload[0] = value
    with pytest.raises(InvalidEmbeddingResponseError):
        validate_embedding_response({"embedding": payload})


@pytest.mark.asyncio
async def test_embed_text_uses_app_ai_and_validates_dimensions(monkeypatch):
    monkeypatch.setattr(
        kb_embedding_mod,
        "get_llm_config",
        lambda: SimpleNamespace(embedding_dimensions=EMBEDDING_DIMENSIONS),
    )
    monkeypatch.setattr(
        kb_embedding_mod,
        "create_embedding",
        AsyncMock(return_value=vector(0.25)),
    )
    assert await embed_text("context") == [0.25] * EMBEDDING_DIMENSIONS


@pytest.mark.asyncio
async def test_embed_text_dimension_mismatch_is_rejected(monkeypatch):
    monkeypatch.setattr(
        kb_embedding_mod,
        "get_llm_config",
        lambda: SimpleNamespace(embedding_dimensions=EMBEDDING_DIMENSIONS),
    )
    monkeypatch.setattr(
        kb_embedding_mod,
        "create_embedding",
        AsyncMock(return_value=[0.1] * 8),
    )
    with pytest.raises(InvalidEmbeddingResponseError, match="1536"):
        await embed_text("context")


@pytest.mark.asyncio
async def test_llm_unavailable_is_sanitized(monkeypatch):
    monkeypatch.setattr(
        kb_embedding_mod,
        "create_embedding",
        AsyncMock(side_effect=LLMUnavailableError("secret-token-xyz unreachable")),
    )
    with pytest.raises(EmbeddingProviderError, match="secret-token-xyz"):
        await embed_text("context")


@pytest.mark.asyncio
async def test_cancellation_propagates(monkeypatch):
    monkeypatch.setattr(
        kb_embedding_mod,
        "create_embedding",
        AsyncMock(side_effect=asyncio.CancelledError()),
    )
    with pytest.raises(asyncio.CancelledError):
        await embed_text("context")


def test_validate_embedding_vector_rejects_wrong_width():
    with pytest.raises(InvalidEmbeddingResponseError):
        validate_embedding_vector([1.0, 2.0], expected_dimensions=1536)
