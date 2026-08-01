from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.services.ticket_routing import classify_ticket


async def list_tickets(db: AsyncSession, user: User) -> list[Ticket]:
    if user.role == Role.STUDENT:
        result = await db.execute(select(Ticket).where(Ticket.createdById == user.id))
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
    return ticket


async def create_ticket(db: AsyncSession, user: User, data: TicketCreate) -> Ticket:
    if data.department:
        department = data.department
        category = data.category
        classification_source = "manual"
    else:
        # TODO(PR #9 — database workstream): Ticket.classificationSource and a
        # relation-based department (departmentId -> Department.id) don't
        # exist on this branch yet, so this assumes they do and will not
        # run/type-check until PR #9 merges — expected, see PR description.
        # Once #9 lands, `department` below should become `departmentId`.
        classification = classify_ticket(data.subject, data.description)
        department = classification.department
        category = classification.category

    ticket = Ticket(
        subject=data.subject,
        description=data.description,
        priority=data.priority,
        category=category,
        department=department,
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
    return TicketResponse.model_validate(ticket)


def comment_to_response(comment: TicketComment) -> CommentResponse:
    return CommentResponse.model_validate(comment)
