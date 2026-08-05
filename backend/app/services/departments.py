"""Resolve free-text department labels to Department rows (get-or-create)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Department


async def get_or_create_department(
    db: AsyncSession, name: str | None
) -> Department | None:
    """Return an existing Department by exact name, or create one.

    Empty / whitespace-only names resolve to None (no department).
    """
    if name is None:
        return None
    cleaned = name.strip()
    if not cleaned:
        return None

    result = await db.execute(select(Department).where(Department.name == cleaned))
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    department = Department(name=cleaned)
    db.add(department)
    await db.flush()
    return department


def department_name(entity) -> str | None:
    """Read the related Department.name when the relationship is loaded."""
    rel = entity.__dict__.get("department")
    if rel is None:
        return None
    return rel.name
