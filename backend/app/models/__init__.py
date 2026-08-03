import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Role, TicketPriority, TicketStatus

if TYPE_CHECKING:
    pass


def _now() -> datetime:
    return datetime.now()


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    displayName: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="Role"), default=Role.STUDENT, nullable=False
    )
    department: Mapped[str | None] = mapped_column(String, nullable=True)
    passwordHash: Mapped[str | None] = mapped_column(String, nullable=True)
    externalId: Mapped[str | None] = mapped_column(String, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=_now, onupdate=_now, nullable=False
    )

    tickets_created: Mapped[list["Ticket"]] = relationship(
        "Ticket", back_populates="created_by", foreign_keys="Ticket.createdById"
    )
    tickets_assigned: Mapped[list["Ticket"]] = relationship(
        "Ticket", back_populates="assigned_to", foreign_keys="Ticket.assignedToId"
    )
    problems_owned: Mapped[list["Problem"]] = relationship("Problem", back_populates="owner")
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="actor")
    chat_conversations: Mapped[list["ChatConversation"]] = relationship(
        "ChatConversation", back_populates="user"
    )
    ticket_comments: Mapped[list["TicketComment"]] = relationship(
        "TicketComment", back_populates="author"
    )


class Ticket(Base):
    __tablename__ = "Ticket"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subject: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="TicketStatus"), default=TicketStatus.OPEN, nullable=False
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, name="TicketPriority"), default=TicketPriority.MEDIUM, nullable=False
    )
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    department: Mapped[str | None] = mapped_column(String, nullable=True)
    createdById: Mapped[str] = mapped_column(String, ForeignKey("User.id"), nullable=False)
    assignedToId: Mapped[str | None] = mapped_column(String, ForeignKey("User.id"), nullable=True)
    problemId: Mapped[str | None] = mapped_column(String, ForeignKey("Problem.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=_now, onupdate=_now, nullable=False
    )

    created_by: Mapped["User"] = relationship(
        "User", foreign_keys=[createdById], back_populates="tickets_created"
    )
    assigned_to: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[assignedToId], back_populates="tickets_assigned"
    )
    problem: Mapped[Optional["Problem"]] = relationship("Problem", back_populates="tickets")
    attachments: Mapped[list["Attachment"]] = relationship("Attachment", back_populates="ticket")
    escalated_from_conversations: Mapped[list["ChatConversation"]] = relationship(
        "ChatConversation", back_populates="escalated_ticket"
    )
    comments: Mapped[list["TicketComment"]] = relationship("TicketComment", back_populates="ticket")


class Attachment(Base):
    __tablename__ = "Attachment"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticketId: Mapped[str] = mapped_column(String, ForeignKey("Ticket.id"), nullable=False)
    filePath: Mapped[str] = mapped_column(String, nullable=False)
    fileType: Mapped[str] = mapped_column(String, nullable=False)
    fileSizeBytes: Mapped[int] = mapped_column(Integer, nullable=False)
    uploadedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="attachments")


class Problem(Base):
    __tablename__ = "Problem"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    rootCause: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="OPEN", nullable=False)
    ownerId: Mapped[str | None] = mapped_column(String, ForeignKey("User.id"), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=_now, onupdate=_now, nullable=False
    )

    owner: Mapped[Optional["User"]] = relationship("User", back_populates="problems_owned")
    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="problem")


class FaqEntry(Base):
    __tablename__ = "FaqEntry"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="en", nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    contextBlob: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding = mapped_column(Vector(768), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), default=_now, onupdate=_now, nullable=False
    )


class Notification(Base):
    __tablename__ = "Notification"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id"), nullable=False)
    ticketId: Mapped[str | None] = mapped_column(String, nullable=True)
    channel: Mapped[str] = mapped_column(String, default="EMAIL", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    readAt: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "AuditLog"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    actorId: Mapped[str | None] = mapped_column(String, ForeignKey("User.id"), nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    entityType: Mapped[str] = mapped_column(String, nullable=False)
    entityId: Mapped[str | None] = mapped_column(String, nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    actor: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")


class ChatConversation(Base):
    __tablename__ = "ChatConversation"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id"), nullable=False)
    escalatedTicketId: Mapped[str | None] = mapped_column(
        String, ForeignKey("Ticket.id"), nullable=True
    )
    startedAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="chat_conversations")
    escalated_ticket: Mapped[Optional["Ticket"]] = relationship(
        "Ticket", back_populates="escalated_from_conversations"
    )
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="conversation"
    )


class ChatMessage(Base):
    __tablename__ = "ChatMessage"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversationId: Mapped[str] = mapped_column(
        String, ForeignKey("ChatConversation.id"), nullable=False
    )
    sender: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    conversation: Mapped["ChatConversation"] = relationship(
        "ChatConversation", back_populates="messages"
    )


class TicketComment(Base):
    __tablename__ = "TicketComment"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticketId: Mapped[str] = mapped_column(String, ForeignKey("Ticket.id"), nullable=False)
    authorId: Mapped[str] = mapped_column(String, ForeignKey("User.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    isInternal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="comments")
    author: Mapped["User"] = relationship("User", back_populates="ticket_comments")
