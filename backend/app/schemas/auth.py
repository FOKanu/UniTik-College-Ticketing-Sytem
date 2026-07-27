from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.db.base import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    displayName: str
    role: Role = Role.STUDENT
    department: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    displayName: str
    role: Role
    department: str | None
    createdAt: datetime

    model_config = {"from_attributes": True}


class AuthTokenResponse(BaseModel):
    token: str
    user: UserResponse
