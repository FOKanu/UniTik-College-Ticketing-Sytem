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


class FaqVisibility(StrEnum):
    """Who may see a knowledge-base article.

    STUDENTS_AND_AI — listed on the student "FAQ & Resources" page and used by
                      the AI assistant when answering.
    AI_ONLY         — internal context (runbooks, staff-only detail). The AI may
                      read it; students must never see it.
    ANNOUNCEMENT    — like STUDENTS_AND_AI, but pinned to the top of the student
                      page. Used for policy updates.
    """

    STUDENTS_AND_AI = "STUDENTS_AND_AI"
    AI_ONLY = "AI_ONLY"
    ANNOUNCEMENT = "ANNOUNCEMENT"


class FaqStatus(StrEnum):
    """Draft articles are invisible to students regardless of visibility."""

    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
