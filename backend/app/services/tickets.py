from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import Role
from app.models import Ticket, TicketComment, User
from app.schemas.tickets import (
    CommentCreate,
    CommentResponse,
    TicketCreate,
    TicketResponse,
    TicketUpdate,
)


async def list_tickets(db: AsyncSession, user: User) -> list[Ticket]:
    if user.role == Role.STUDENT:
        result = await db.execute(select(Ticket).where(Ticket.createdById == user.id))
    elif user.role == Role.STAFF:
        result = await db.execute(select(Ticket).where(Ticket.department == user.department))
    else:
        result = await db.execute(select(Ticket))
    return list(result.scalars().all())

async def get_ticket(db: AsyncSession, ticket_id: str, user: User) -> Ticket:
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Ticket not found")
    if user.role == Role.STUDENT and ticket.createdById != user.id:
        raise ForbiddenError("Students may only view their own tickets")
    if user.role == Role.STAFF and ticket.department != user.department:
        raise ForbiddenError("Staff may only view tickets in their department")
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
    await db.refresh(ticket)
    return ticket


async def update_ticket(
    db: AsyncSession, ticket_id: str, user: User, data: TicketUpdate
) -> Ticket:
    ticket = await get_ticket(db, ticket_id, user)
    if user.role == Role.STUDENT:
        raise ForbiddenError("Students cannot update tickets")
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(ticket, key, value)
    await db.commit()
    await db.refresh(ticket)
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
    await get_ticket(db, ticket_id, user)
    if user.role == Role.STUDENT and data.isInternal:
        raise ForbiddenError("Students cannot create internal comments")
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
    return TicketResponse.model_validate(ticket)


def comment_to_response(comment: TicketComment) -> CommentResponse:
    return CommentResponse.model_validate(comment)
