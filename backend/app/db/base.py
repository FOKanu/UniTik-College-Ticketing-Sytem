import enum

from sqlalchemy.orm import DeclarativeBase

try:
    from enum import StrEnum
except ImportError:

    class StrEnum(str, enum.Enum):  # noqa: UP042 — Python <3.11 fallback
        pass


class Base(DeclarativeBase):
    pass


class Role(StrEnum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class TicketStatus(StrEnum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class TicketPriority(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
