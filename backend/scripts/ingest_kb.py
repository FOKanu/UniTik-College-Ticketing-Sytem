"""Explicit administrative ingestion for the canonical knowledge-base corpus.

This is insert/update-only: records absent from Markdown are deliberately retained.

Default mode upserts FAQ text and enqueues EmbeddingJob rows for the background
worker (``python -m scripts.embedding_worker``). Pass ``--sync`` to embed
in-process (legacy path for CI / emergency).
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from collections.abc import Awaitable, Callable
from pathlib import Path

from app.db.session import async_session_factory
from app.services import embedding_jobs as jobs_service
from app.services import kb as kb_service
from app.services.kb_content_parser import load_corpus, validate_corpus
from app.services.kb_embedding import build_context_blob, embed_text

CONTENT_DIR = Path(__file__).resolve().parents[2] / "docs" / "knowledge-base"
Embedder = Callable[[str], Awaitable[list[float]]]


async def ingest(
    *,
    content_dir: Path = CONTENT_DIR,
    session_factory=async_session_factory,
    embedder: Embedder = embed_text,
    sync: bool = False,
) -> int:
    documents = load_corpus(content_dir)
    entries = validate_corpus(documents)

    if sync:
        prepared = []
        for entry in entries:
            context_blob = build_context_blob(entry)
            vector = await embedder(context_blob)
            prepared.append((entry, context_blob, vector))

        async with session_factory() as db:
            try:
                for entry, context_blob, vector in prepared:
                    await kb_service.upsert_faq_entry(
                        db,
                        id=entry.id,
                        question=entry.question,
                        answer=entry.answer,
                        language=entry.language,
                        category=entry.department,
                        context_blob=context_blob,
                        embedding=vector,
                    )
                await db.commit()
            except Exception:
                await db.rollback()
                raise
        return len(prepared)

    # Async default: upsert content, leave existing vectors until the worker
    # refreshes them, enqueue one job per entry.
    async with session_factory() as db:
        try:
            for entry in entries:
                context_blob = build_context_blob(entry)
                await kb_service.upsert_faq_entry(
                    db,
                    id=entry.id,
                    question=entry.question,
                    answer=entry.answer,
                    language=entry.language,
                    category=entry.department,
                    context_blob=context_blob,
                    embedding=None,
                    update_embedding=False,
                )
                await jobs_service.enqueue_embedding(db, entry.id)
            await db.commit()
        except Exception:
            await db.rollback()
            raise
    return len(entries)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Ingest canonical knowledge-base corpus")
    parser.add_argument(
        "--sync",
        action="store_true",
        help="Embed in-process before commit (legacy). Default enqueues EmbeddingJob rows.",
    )
    args = parser.parse_args(argv)

    try:
        count = asyncio.run(ingest(sync=args.sync))
    except Exception:
        print("Knowledge-base ingestion failed.", file=sys.stderr)
        return 1

    if args.sync:
        print(f"Ingestion complete: {count} FAQ entries inserted or updated (sync embed).")
    else:
        print(
            f"Ingestion complete: {count} FAQ entries upserted; "
            "embedding jobs enqueued. Run: python -m scripts.embedding_worker --once"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
