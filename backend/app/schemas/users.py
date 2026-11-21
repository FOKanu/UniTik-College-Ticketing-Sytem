from pydantic import BaseModel

from app.db.base import Role


class StaffMemberResponse(BaseModel):
    """Slim staff directory row for assignee / routing dropdowns."""

    id: str
    email: str
    displayName: str
    role: Role
    department: str | None

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    displayName: str | None = None
    # Students may update academic affiliation. Staff/admin department
    # changes are rejected in the service (S6) — use admin reassignment.
    department: str | None = None


class RoleUpdateRequest(BaseModel):
    role: Role


class DepartmentUpdateRequest(BaseModel):
    """Admin-only staff/admin department reassignment (S6)."""

    department: str | None = None
