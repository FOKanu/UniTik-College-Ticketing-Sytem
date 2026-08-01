"""Knowledge-base ingestion script — administrative operation only.

Loads docs/knowledge-base/*.md, generates embeddings, and rebuilds FaqEntry rows.
Never run as part of application startup or exposed as an API route
(see docs/knowledge-base/README.md, Ingestion semantics section).

All embeddings are generated and validated BEFORE any database write. A
provider failure leaves the database untouched. All prepared records are
written in a single transaction.
"""

import asyncio
from pathlib import Path

from app.db.session import async_session_factory
from app.services import kb as kb_service
from app.services.kb_content_parser import load_corpus, validate_corpus
from app.services.kb_embedding import build_context_blob, embed_text

CONTENT_DIR = Path(__file__).resolve().parents[2] / "docs" / "knowledge-base"


async def ingest() -> None:
    documents = load_corpus(CONTENT_DIR)
    entries = validate_corpus(documents)

    prepared = []
    for entry in entries:
        context_blob = build_context_blob(entry)
        vector = await embed_text(context_blob)
        prepared.append((entry, context_blob, vector))

    async with async_session_factory() as db:
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

    print(f"Ingestion complete: {len(prepared)} FAQ entries upserted.")


def main() -> None:
    asyncio.run(ingest())


if __name__ == "__main__":
    main()
