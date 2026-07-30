from pydantic import BaseModel

from app.db.base import Role


class ProfileUpdateRequest(BaseModel):
    displayName: str | None = None
    department: str | None = None


class RoleUpdateRequest(BaseModel):
    role: Role