from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.db.base import Role
from app.models import Department, User
from app.schemas.auth import UserResponse
from app.schemas.users import ProfileUpdateRequest, RoleUpdateRequest, StaffMemberResponse
from app.services import departments as departments_service

STAFF_ROLES = (Role.STAFF, Role.ADMIN)


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        displayName=user.displayName,
        role=user.role,
        department=departments_service.department_name(user),
        createdAt=user.createdAt,
    )


async def list_staff(
    db: AsyncSession,
    *,
    tenant_id: str,
    department: str | None = None,
) -> list[User]:
    """Return STAFF + ADMIN users in a tenant, optionally filtered by department."""
    stmt = (
        select(User)
        .options(selectinload(User.department))
        .where(User.role.in_(STAFF_ROLES), User.tenantId == tenant_id)
        .order_by(User.displayName.asc())
    )
    if department and department.strip():
        # Case-insensitive contains so UI buckets like "IT" match
        # seed values such as "IT Support — Tier 1".
        stmt = stmt.join(Department, User.departmentId == Department.id).where(
            Department.name.ilike(f"%{department.strip()}%")
        )
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def list_staff_departments(db: AsyncSession, *, tenant_id: str) -> list[str]:
    """Distinct non-null department labels from staff/admin accounts in a tenant."""
    result = await db.execute(
        select(Department.name)
        .join(User, User.departmentId == Department.id)
        .where(
            User.role.in_(STAFF_ROLES),
            User.tenantId == tenant_id,
            Department.name.is_not(None),
        )
        .distinct()
        .order_by(Department.name.asc())
    )
    return [row[0] for row in result.all() if row[0]]


async def get_assignable_user(
    db: AsyncSession, user_id: str, *, tenant_id: str
) -> User:
    """Load a user that is allowed to own tickets (STAFF or ADMIN) in the tenant."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.department))
        .where(User.id == user_id, User.tenantId == tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("Assignee not found")
    if user.role not in STAFF_ROLES:
        raise BadRequestError("Tickets can only be assigned to staff or admin users")
    return user


def staff_to_response(user: User) -> StaffMemberResponse:
    return StaffMemberResponse(
        id=user.id,
        email=user.email,
        displayName=user.displayName,
        role=user.role,
        department=departments_service.department_name(user),
    )


async def update_profile(db: AsyncSession, user: User, data: ProfileUpdateRequest) -> User:
    updates = data.model_dump(exclude_unset=True)
    if "department" in updates:
        dept_label = updates.pop("department")
        dept = await departments_service.get_or_create_department(
            db, dept_label, tenant_id=user.tenantId
        )
        user.departmentId = dept.id if dept else None
    for key, value in updates.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user, ["department"])
    return user


async def list_users(db: AsyncSession, *, tenant_id: str) -> list[User]:
    result = await db.execute(
        select(User)
        .options(selectinload(User.department))
        .where(User.tenantId == tenant_id)
    )
    return list(result.scalars().all())


async def update_role(db: AsyncSession, user_id: str, data: RoleUpdateRequest) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.department)).where(User.id == user_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundError("User not found")
    target.role = data.role
    await db.commit()
    await db.refresh(target, ["department"])
    return target
