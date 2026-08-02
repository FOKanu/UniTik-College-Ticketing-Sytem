from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import FaqEntry
from app.schemas.kb import FaqCreate, FaqResponse, FaqSearchResult


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
    )
    db.add(entry)
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
