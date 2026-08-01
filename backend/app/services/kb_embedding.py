import json
import os

import httpx

EMBEDDING_DIMENSIONS = 1536
EMBEDDING_SERVICE_URL = os.getenv("EMBEDDING_SERVICE_URL", "http://localhost:8001/embed")


class EmbeddingDimensionMismatchError(Exception):
    def __init__(self, expected: int, actual: int):
        super().__init__(f"Embedding dimension mismatch: expected {expected}, got {actual}")


def build_context_blob(entry) -> str:
    """Deterministic JSON context, per docs/knowledge-base/README.md field order."""
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


async def embed_text(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(EMBEDDING_SERVICE_URL, json={"input": text})
        response.raise_for_status()
        data = response.json()

    vector: list[float] = data["embedding"]
    if len(vector) != EMBEDDING_DIMENSIONS:
        raise EmbeddingDimensionMismatchError(EMBEDDING_DIMENSIONS, len(vector))

    return vector
