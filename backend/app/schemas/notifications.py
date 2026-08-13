from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Matches the FE NotificationItem shape (body ← message, read ← readAt)."""

    id: str
    title: str
    body: str
    read: bool
    createdAt: datetime
    ticketId: str | None = None

    model_config = {"from_attributes": True}
