from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.core.responses import success_response
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(db: DbSession, body: LoginRequest):
    result = await auth_service.login(db, body)
    return success_response(result.model_dump())


@router.post("/register")
async def register(db: DbSession, body: RegisterRequest):
    result = await auth_service.register(db, body)
    return success_response(result.model_dump(), status_code=201)


@router.get("/me")
async def me(user: CurrentUser):
    from app.schemas.auth import UserResponse

    return success_response(UserResponse.model_validate(user).model_dump())
