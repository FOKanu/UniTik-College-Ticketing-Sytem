from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.base import Role
from app.models import User
from app.schemas.auth import AuthTokenResponse, LoginRequest, RegisterRequest, UserResponse


async def login(db: AsyncSession, data: LoginRequest) -> AuthTokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not user.passwordHash or not verify_password(data.password, user.passwordHash):
        raise UnauthorizedError("Invalid email or password")
    token = create_access_token(user.id, {"role": user.role.value})
    return AuthTokenResponse(token=token, user=UserResponse.model_validate(user))


async def register(db: AsyncSession, data: RegisterRequest) -> AuthTokenResponse:
    settings = get_settings()
    if not settings.is_development:
        raise ConflictError("Registration is disabled outside development")
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise ConflictError("Email already registered")
    if data.role != Role.STUDENT:
        raise ConflictError("Only student self-registration is allowed")
    user = User(
        email=data.email,
        displayName=data.displayName,
        role=data.role,
        department=data.department,
        passwordHash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, {"role": user.role.value})
    return AuthTokenResponse(token=token, user=UserResponse.model_validate(user))
