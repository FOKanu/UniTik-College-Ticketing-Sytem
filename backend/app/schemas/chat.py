from datetime import datetime

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    pass


class MessageCreate(BaseModel):
    content: str = Field(min_length=1)


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


class EscalateResponse(BaseModel):
    conversation: ConversationResponse
    ticketId: str
