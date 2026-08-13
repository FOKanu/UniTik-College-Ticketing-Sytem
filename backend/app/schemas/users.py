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
    department: str | None = None


class RoleUpdateRequest(BaseModel):
    role: Role
