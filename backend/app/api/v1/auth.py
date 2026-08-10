from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbSession
from app.core.rate_limit import rate_limit
from app.core.responses import success_response
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, SsoLoginRequest
from app.services import auth as auth_service
from app.services import sso as sso_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60))])
async def login(db: DbSession, body: LoginRequest):
    result = await auth_service.login(db, body)
    return success_response(result.model_dump(mode="json"))


@router.post("/register", dependencies=[Depends(rate_limit(max_requests=3, window_seconds=60))])
async def register(db: DbSession, body: RegisterRequest):
    result = await auth_service.register(db, body)
    return success_response(result.model_dump(mode="json"), status_code=201)


@router.get("/me")
async def me(user: CurrentUser):
    from app.schemas.auth import UserResponse

    return success_response(UserResponse.model_validate(user).model_dump(mode="json"))


@router.post("/refresh")
async def refresh(db: DbSession, body: RefreshRequest):
    result = await auth_service.refresh_token(db, body)
    return success_response(result.model_dump(mode="json"))


@router.post("/sso")
async def sso_login(body: SsoLoginRequest):
    await sso_service.login_with_sso(body)