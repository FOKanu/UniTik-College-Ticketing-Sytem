from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import User
from app.schemas.users import ProfileUpdateRequest, RoleUpdateRequest


async def update_profile(db: AsyncSession, user: User, data: ProfileUpdateRequest) -> User:
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


async def list_users(db: AsyncSession) -> list[User]:
    result = await db.execute(select(User))
    return list(result.scalars().all())


async def update_role(db: AsyncSession, user_id: str, data: RoleUpdateRequest) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundError("User not found")
    target.role = data.role
    await db.commit()
    await db.refresh(target)
    return target