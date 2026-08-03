from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import Role, TicketStatus
from app.models import Ticket, TicketComment, User
from app.schemas.tickets import (
    CommentCreate,
    CommentResponse,
    TicketCreate,
    TicketResponse,
    TicketUpdate,
)
from app.services import users as users_service

# Display names come from the requester/assignee relationships. Async SQLAlchemy
# cannot lazy-load them during serialization, so every query that feeds
# ticket_to_response must eager-load both.
_WITH_PEOPLE = (
    selectinload(Ticket.created_by),
    selectinload(Ticket.assigned_to),
)


async def list_tickets(db: AsyncSession, user: User) -> list[Ticket]:
    stmt = select(Ticket).options(*_WITH_PEOPLE)
    if user.role == Role.STUDENT:
        stmt = stmt.where(Ticket.createdById == user.id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_ticket(db: AsyncSession, ticket_id: str, user: User) -> Ticket:
    result = await db.execute(
        select(Ticket).options(*_WITH_PEOPLE).where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Ticket not found")
    if user.role == Role.STUDENT and ticket.createdById != user.id:
        raise ForbiddenError("Students may only view their own tickets")
    return ticket


async def create_ticket(db: AsyncSession, user: User, data: TicketCreate) -> Ticket:
    ticket = Ticket(
        subject=data.subject,
        description=data.description,
        priority=data.priority,
        category=data.category,
        department=data.department or user.department,
        createdById=user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket, ["created_by", "assigned_to"])
    return ticket


async def update_ticket(
    db: AsyncSession, ticket_id: str, user: User, data: TicketUpdate
) -> Ticket:
    ticket = await get_ticket(db, ticket_id, user)
    if user.role == Role.STUDENT:
        raise ForbiddenError("Students cannot update tickets")
    updates = data.model_dump(exclude_unset=True)

    # Validate assignee before applying — null clears assignment; any id must
    # resolve to a STAFF/ADMIN account so students cannot be assigned tickets.
    if "assignedToId" in updates and updates["assignedToId"] is not None:
        await users_service.get_assignable_user(db, updates["assignedToId"])

    for key, value in updates.items():
        setattr(ticket, key, value)
    await db.commit()
    # Reload the people relationships so a reassignment returns the new name.
    await db.refresh(ticket, ["created_by", "assigned_to"])
    return ticket


async def list_comments(
    db: AsyncSession, ticket_id: str, user: User
) -> list[TicketComment]:
    await get_ticket(db, ticket_id, user)
    result = await db.execute(
        select(TicketComment).where(TicketComment.ticketId == ticket_id)
    )
    comments = list(result.scalars().all())
    if user.role == Role.STUDENT:
        return [c for c in comments if not c.isInternal]
    return comments


async def add_comment(
    db: AsyncSession, ticket_id: str, user: User, data: CommentCreate
) -> TicketComment:
    ticket = await get_ticket(db, ticket_id, user)
    if user.role == Role.STUDENT and data.isInternal:
        raise ForbiddenError("Students cannot create internal comments")

    # Business rule (see docs/architecture/README.md §8 "Reopen-on-reply"):
    # a student replying to a Resolved ticket re-opens it so it re-surfaces in
    # the owning department's queue. Staff replies never trigger this — only
    # a student-initiated comment on a Resolved ticket does.
    if user.role == Role.STUDENT and ticket.status == TicketStatus.RESOLVED:
        ticket.status = TicketStatus.OPEN

    comment = TicketComment(
        ticketId=ticket_id,
        authorId=user.id,
        body=data.body,
        isInternal=data.isInternal,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


def ticket_to_response(ticket: Ticket) -> TicketResponse:
    response = TicketResponse.model_validate(ticket)
    # Relationships are eager-loaded by the queries above; fall back to None
    # rather than triggering a lazy load if a caller passes a bare instance.
    created_by = ticket.__dict__.get("created_by")
    assigned_to = ticket.__dict__.get("assigned_to")
    response.createdByName = created_by.displayName if created_by else None
    response.createdByEmail = created_by.email if created_by else None
    response.assignedToName = assigned_to.displayName if assigned_to else None
    return response


def comment_to_response(comment: TicketComment) -> CommentResponse:
    return CommentResponse.model_validate(comment)
