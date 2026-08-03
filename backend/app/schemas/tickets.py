from datetime import datetime

from pydantic import BaseModel, Field

from app.db.base import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    subject: str = Field(min_length=1)
    description: str = Field(min_length=1)
    priority: TicketPriority = TicketPriority.MEDIUM
    category: str | None = None
    department: str | None = None


class TicketUpdate(BaseModel):
    subject: str | None = None
    description: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category: str | None = None
    department: str | None = None
    assignedToId: str | None = None


class TicketResponse(BaseModel):
    id: str
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: str | None
    department: str | None
    createdById: str
    assignedToId: str | None
    problemId: str | None
    createdAt: datetime
    updatedAt: datetime
    # Resolved from the requester/assignee relationships so clients can show
    # people without a second round trip to the user directory.
    createdByName: str | None = None
    createdByEmail: str | None = None
    assignedToName: str | None = None

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)
    isInternal: bool = False


class CommentResponse(BaseModel):
    id: str
    ticketId: str
    authorId: str
    body: str
    isInternal: bool
    createdAt: datetime

    model_config = {"from_attributes": True}


class AttachmentResponse(BaseModel):
    id: str
    ticketId: str
    name: str
    fileType: str
    fileSizeBytes: int
    uploadedAt: datetime
