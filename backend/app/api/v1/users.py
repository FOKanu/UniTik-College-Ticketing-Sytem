from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUser, DbSession, require_roles
from app.core.responses import success_response
from app.db.base import Role
from app.models import User
from app.schemas.users import ProfileUpdateRequest, RoleUpdateRequest
from app.services import users as users_service

router = APIRouter(prefix="/users", tags=["users"])

StaffOrAdmin = Annotated[User, Depends(require_roles(Role.STAFF, Role.ADMIN))]
AdminOnly = Annotated[User, Depends(require_roles(Role.ADMIN))]


@router.get("/me")
async def get_my_profile(user: CurrentUser):
    return success_response(
        users_service.user_to_response(user).model_dump(mode="json")
    )


@router.patch("/me")
async def update_my_profile(db: DbSession, user: CurrentUser, body: ProfileUpdateRequest):
    updated = await users_service.update_profile(db, user, body)
    return success_response(
        users_service.user_to_response(updated).model_dump(mode="json")
    )


@router.get("")
async def list_all_users(db: DbSession, user: StaffOrAdmin):
    users = await users_service.list_users(db, tenant_id=user.tenantId)
    return success_response(
        [users_service.user_to_response(u).model_dump(mode="json") for u in users]
    )


@router.patch("/{user_id}/role")
async def update_user_role(
    db: DbSession, _user: AdminOnly, user_id: str, body: RoleUpdateRequest
):
    updated = await users_service.update_role(db, user_id, body)
    return success_response(
        users_service.user_to_response(updated).model_dump(mode="json")
    )


@router.get("/staff")
async def list_staff(
    db: DbSession,
    user: StaffOrAdmin,
    department: Annotated[str | None, Query()] = None,
):
    """Staff directory for assignee / routing dropdowns (STAFF + ADMIN only)."""
    members = await users_service.list_staff(
        db, tenant_id=user.tenantId, department=department
    )
    return success_response(
        [users_service.staff_to_response(m).model_dump() for m in members]
    )


@router.get("/departments")
async def list_staff_departments(db: DbSession, user: StaffOrAdmin):
    """Distinct department labels from staff/admin accounts (for routing filters)."""
    departments = await users_service.list_staff_departments(db, tenant_id=user.tenantId)
    return success_response(departments)
