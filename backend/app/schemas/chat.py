from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.ai.prompts import ChatMode


class ConversationCreate(BaseModel):
    pass


class MessageCreate(BaseModel):
    content: str = Field(min_length=1)
    mode: ChatMode = ChatMode.QUICK
    language: Literal["en", "de"] = "en"


class ConversationResponse(BaseModel):
    id: str
    userId: str
    escalatedTicketId: str | None
    startedAt: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: str
    conversationId: str
    sender: str
    content: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class Citation(BaseModel):
    id: str
    question: str
    category: str | None = None
    score: float


class EscalatedTicket(BaseModel):
    id: str
    subject: str
    status: str
    category: str | None

    model_config = {"from_attributes": True}


class EscalateResponse(BaseModel):
    conversation: ConversationResponse
    ticketId: str
    ticket: EscalatedTicket
    # True when the conversation had already been escalated — no new ticket.
    alreadyEscalated: bool
    botMessage: MessageResponse | None = None
