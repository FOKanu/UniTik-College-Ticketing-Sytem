from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import CurrentUser, DbSession, require_roles
from app.core.responses import success_response
from app.db.base import Role
from app.models import User
from app.schemas.auth import UserResponse
from app.schemas.users import ProfileUpdateRequest, RoleUpdateRequest
from app.services import users as users_service

router = APIRouter(prefix="/users", tags=["users"])

StaffOrAdmin = Annotated[User, Depends(require_roles(Role.STAFF, Role.ADMIN))]
AdminOnly = Annotated[User, Depends(require_roles(Role.ADMIN))]


@router.get("/me")
async def get_my_profile(user: CurrentUser):
    return success_response(UserResponse.model_validate(user).model_dump(mode="json"))


@router.patch("/me")
async def update_my_profile(db: DbSession, user: CurrentUser, body: ProfileUpdateRequest):
    updated = await users_service.update_profile(db, user, body)
    return success_response(UserResponse.model_validate(updated).model_dump(mode="json"))


@router.get("")
async def list_all_users(db: DbSession, _user: StaffOrAdmin):
    users = await users_service.list_users(db)
    return success_response(
        [UserResponse.model_validate(u).model_dump(mode="json") for u in users]
    )


@router.patch("/{user_id}/role")
async def update_user_role(
    db: DbSession, _user: AdminOnly, user_id: str, body: RoleUpdateRequest
):
    updated = await users_service.update_role(db, user_id, body)
    return success_response(UserResponse.model_validate(updated).model_dump(mode="json"))