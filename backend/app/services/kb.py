from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import FaqEntry
from app.schemas.kb import FaqCreate, FaqResponse, FaqSearchResult
from app.services import embedding_jobs as jobs_service


async def list_faq(db: AsyncSession) -> list[FaqEntry]:
    result = await db.execute(select(FaqEntry).order_by(FaqEntry.createdAt))
    return list(result.scalars().all())


async def get_faq(db: AsyncSession, faq_id: str) -> FaqEntry:
    result = await db.execute(select(FaqEntry).where(FaqEntry.id == faq_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise NotFoundError("FAQ entry not found")
    return entry


async def create_faq(db: AsyncSession, data: FaqCreate) -> FaqEntry:
    entry = FaqEntry(
        question=data.question,
        answer=data.answer,
        language=data.language,
        category=data.category,
        contextBlob=f"{data.question}\n\n{data.answer}",
    )
    db.add(entry)
    await db.flush()
    await jobs_service.enqueue_embedding(db, entry.id)
    await db.commit()
    await db.refresh(entry)
    return entry


async def search_faq(db: AsyncSession, query: str, limit: int = 5) -> list[FaqSearchResult]:
    """Text search fallback when embeddings are not yet populated."""
    pattern = f"%{query}%"
    result = await db.execute(
        select(FaqEntry)
        .where(FaqEntry.question.ilike(pattern) | FaqEntry.answer.ilike(pattern))
        .limit(limit)
    )
    entries = list(result.scalars().all())
    return [
        FaqSearchResult(
            id=e.id,
            question=e.question,
            answer=e.answer,
            category=e.category,
            score=1.0,
        )
        for e in entries
    ]


async def search_faq_vector(
    db: AsyncSession, embedding: list[float], limit: int = 5
) -> list[FaqSearchResult]:
    sql = text("""
        SELECT id, question, answer, category,
               1 - (embedding <=> :embedding) AS score
        FROM "FaqEntry"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> :embedding
        LIMIT :limit
        """)
    result = await db.execute(sql, {"embedding": str(embedding), "limit": limit})
    rows = result.mappings().all()
    return [
        FaqSearchResult(
            id=row["id"],
            question=row["question"],
            answer=row["answer"],
            category=row["category"],
            score=float(row["score"]),
        )
        for row in rows
    ]


def faq_to_response(entry: FaqEntry) -> FaqResponse:
    return FaqResponse.model_validate(entry)


async def upsert_faq_entry(
    db: AsyncSession,
    *,
    id: str,
    question: str,
    answer: str,
    language: str,
    category: str | None,
    context_blob: str | None,
    embedding: list[float] | None = None,
    update_embedding: bool = True,
) -> FaqEntry:
    """Insert or update one corpus entry without committing or deleting stale rows.

    When ``update_embedding`` is False the existing vector is left untouched
    (async ingest enqueues a worker job instead).
    """
    result = await db.execute(select(FaqEntry).where(FaqEntry.id == id))
    entry = result.scalar_one_or_none()
    if entry is None:
        entry = FaqEntry(id=id)
        db.add(entry)

    entry.question = question
    entry.answer = answer
    entry.language = language
    entry.category = category
    entry.contextBlob = context_blob
    if update_embedding:
        entry.embedding = embedding
    return entry


async def enqueue_reembed(
    db: AsyncSession,
    *,
    missing_only: bool = False,
) -> int:
    """Enqueue embedding jobs for FAQ rows. Returns number of jobs enqueued/reset."""
    stmt = select(FaqEntry.id)
    if missing_only:
        stmt = stmt.where(FaqEntry.embedding.is_(None))
    result = await db.execute(stmt)
    faq_ids = [row[0] for row in result.all()]
    return await jobs_service.enqueue_for_entries(db, faq_ids)
