"""Resolve free-text department labels to Department rows (get-or-create)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Department, User


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


async def department_for_user(db: AsyncSession, user: User) -> Department | None:
    """Return the user's Department, loading by FK when the relation isn't eager-loaded."""
    rel = user.__dict__.get("department")
    if rel is not None:
        return rel
    if not user.departmentId:
        return None
    result = await db.execute(select(Department).where(Department.id == user.departmentId))
    return result.scalar_one_or_none()


def department_name(entity) -> str | None:
    """Read the related Department.name when the relationship is loaded."""
    rel = entity.__dict__.get("department")
    if rel is None:
        return None
    return rel.name
