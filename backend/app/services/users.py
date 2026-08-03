from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.db.base import Role
from app.models import User
from app.schemas.users import StaffMemberResponse

STAFF_ROLES = (Role.STAFF, Role.ADMIN)


async def list_staff(
    db: AsyncSession, *, department: str | None = None
) -> list[User]:
    """Return STAFF + ADMIN users, optionally filtered by department substring."""
    stmt = (
        select(User)
        .where(User.role.in_(STAFF_ROLES))
        .order_by(User.displayName.asc())
    )
    if department and department.strip():
        # Case-insensitive contains so UI buckets like "IT" match
        # seed values such as "IT Support — Tier 1".
        stmt = stmt.where(User.department.ilike(f"%{department.strip()}%"))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_staff_departments(db: AsyncSession) -> list[str]:
    """Distinct non-null department labels from staff/admin accounts."""
    result = await db.execute(
        select(User.department)
        .where(User.role.in_(STAFF_ROLES), User.department.is_not(None))
        .distinct()
        .order_by(User.department.asc())
    )
    return [row[0] for row in result.all() if row[0]]


async def get_assignable_user(db: AsyncSession, user_id: str) -> User:
    """Load a user that is allowed to own tickets (STAFF or ADMIN)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("Assignee not found")
    if user.role not in STAFF_ROLES:
        raise BadRequestError("Tickets can only be assigned to staff or admin users")
    return user


def staff_to_response(user: User) -> StaffMemberResponse:
    return StaffMemberResponse.model_validate(user)
