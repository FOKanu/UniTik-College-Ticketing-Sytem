from datetime import datetime
from types import SimpleNamespace

from app.db.base import Role
from app.schemas.auth import UserResponse


def test_user_response_department_string():
    """Verify UserResponse serializes department when passed as a plain string."""
    now = datetime.now()
    data = {
        "id": "usr-1",
        "email": "student@university.edu",
        "displayName": "Jane Student",
        "role": Role.STUDENT,
        "department": "Computer Science",
        "createdAt": now,
    }
    user_res = UserResponse.model_validate(data)
    assert user_res.department == "Computer Science"
    assert isinstance(user_res.department, str)
    assert user_res.id == "usr-1"
    assert user_res.email == "student@university.edu"
    assert user_res.displayName == "Jane Student"
    assert user_res.role == Role.STUDENT
    assert user_res.createdAt == now


def test_user_response_department_none():
    """Verify UserResponse handles None department correctly."""
    now = datetime.now()
    data = {
        "id": "usr-2",
        "email": "staff@university.edu",
        "displayName": "John Staff",
        "role": Role.STAFF,
        "department": None,
        "createdAt": now,
    }
    user_res = UserResponse.model_validate(data)
    assert user_res.department is None
    assert user_res.id == "usr-2"


def test_user_response_department_orm_object():
    """Verify UserResponse extracts .name attribute when department is an ORM object."""
    now = datetime.now()
    dept_obj = SimpleNamespace(id="dept-123", name="IT Services", tenantId="ten-1")

    class FakeUserModel:
        id = "usr-3"
        email = "admin@university.edu"
        displayName = "Admin User"
        role = Role.ADMIN
        department = dept_obj
        createdAt = now

    user_res = UserResponse.model_validate(FakeUserModel())
    assert user_res.department == "IT Services"
    assert isinstance(user_res.department, str)
    assert user_res.id == "usr-3"
    assert user_res.email == "admin@university.edu"
    assert user_res.displayName == "Admin User"
    assert user_res.role == Role.ADMIN


def test_user_response_department_reassignment():
    """Verify UserResponse when department relation changes or is reassigned."""
    now = datetime.now()
    dept1 = SimpleNamespace(name="Physics")
    dept2 = SimpleNamespace(name="Mathematics")

    class UserWithDept:
        def __init__(self, dept):
            self.id = "usr-4"
            self.email = "prof@university.edu"
            self.displayName = "Professor"
            self.role = Role.STAFF
            self.department = dept
            self.createdAt = now

    u1 = UserResponse.model_validate(UserWithDept(dept1))
    assert u1.department == "Physics"

    u2 = UserResponse.model_validate(UserWithDept(dept2))
    assert u2.department == "Mathematics"

    u3 = UserResponse.model_validate(UserWithDept(None))
    assert u3.department is None


def test_user_response_full_payload_schema():
    """Verify serialized JSON dictionary payload matches expected API contract."""
    now = datetime(2026, 8, 14, 12, 0, 0)
    data = {
        "id": "usr-5",
        "email": "user5@university.edu",
        "displayName": "User Five",
        "role": Role.STUDENT,
        "department": "Engineering",
        "createdAt": now,
    }
    user_res = UserResponse.model_validate(data)
    dumped = user_res.model_dump(mode="json")

    assert dumped == {
        "id": "usr-5",
        "email": "user5@university.edu",
        "displayName": "User Five",
        "role": "STUDENT",
        "department": "Engineering",
        "createdAt": "2026-08-14T12:00:00",
    }
