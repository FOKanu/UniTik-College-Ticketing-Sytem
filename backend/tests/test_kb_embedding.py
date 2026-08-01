import asyncio
import json
import math

import httpx
import pytest

from app.services.kb_embedding import (
    EMBEDDING_DIMENSIONS,
    EmbeddingProviderError,
    InvalidEmbeddingResponseError,
    embed_text,
    validate_embedding_response,
)


def vector(value=1):
    return [value] * EMBEDDING_DIMENSIONS


def test_valid_embedding_is_copied_and_normalized_to_floats():
    original = vector(1)
    result = validate_embedding_response({"embedding": original})
    assert result == [1.0] * EMBEDDING_DIMENSIONS
    assert result is not original


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"embedding": None},
        {"embedding": []},
        {"embedding": "x" * EMBEDDING_DIMENSIONS},
        {"embedding": {"value": 1}},
        [],
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
async def test_exact_request_payload_and_valid_response():
    async def handler(request):
        assert json.loads(request.content) == {"input": "context"}
        return httpx.Response(200, json={"embedding": vector()})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        assert len(await embed_text("context", client=client)) == EMBEDDING_DIMENSIONS


@pytest.mark.asyncio
@pytest.mark.parametrize("body", [b"not json", b""])
async def test_invalid_json_is_normalized(body):
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(200, content=body))
    ) as client:
        with pytest.raises(EmbeddingProviderError, match="invalid JSON"):
            await embed_text("context", client=client)


@pytest.mark.asyncio
async def test_http_status_error_is_sanitized():
    secret = "super-secret"
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(
            lambda _request: httpx.Response(500, text=f"provider body {secret}")
        )
    ) as client:
        with pytest.raises(EmbeddingProviderError) as error:
            await embed_text("context", client=client)
    assert secret not in str(error.value)
    assert "http" not in str(error.value).lower()


class RaisingClient:
    def __init__(self, error):
        self.error = error

    async def post(self, *_args, **_kwargs):
        raise self.error


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "message"),
    [
        (httpx.ReadTimeout("timeout"), "timed out"),
        (httpx.ConnectError("connection"), "connect"),
    ],
)
async def test_transport_errors_are_normalized(error, message):
    with pytest.raises(EmbeddingProviderError, match=message):
        await embed_text("context", client=RaisingClient(error))


@pytest.mark.asyncio
async def test_cancellation_propagates():
    with pytest.raises(asyncio.CancelledError):
        await embed_text("context", client=RaisingClient(asyncio.CancelledError()))
