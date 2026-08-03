from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.deps import DbSession, require_roles
from app.core.responses import success_response
from app.db.base import Role
from app.models import User
from app.services import users as users_service

router = APIRouter(prefix="/users", tags=["users"])

StaffOrAdmin = Annotated[User, Depends(require_roles(Role.STAFF, Role.ADMIN))]


@router.get("/staff")
async def list_staff(
    db: DbSession,
    _user: StaffOrAdmin,
    department: Annotated[str | None, Query()] = None,
):
    """Staff directory for assignee / routing dropdowns (STAFF + ADMIN only)."""
    members = await users_service.list_staff(db, department=department)
    return success_response(
        [users_service.staff_to_response(m).model_dump() for m in members]
    )


@router.get("/departments")
async def list_staff_departments(db: DbSession, _user: StaffOrAdmin):
    """Distinct department labels from staff/admin accounts (for routing filters)."""
    departments = await users_service.list_staff_departments(db)
    return success_response(departments)
