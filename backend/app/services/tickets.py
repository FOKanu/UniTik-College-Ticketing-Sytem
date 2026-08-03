from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import Role, TicketStatus
from app.models import Ticket, TicketComment, TicketStatusHistory, User
from app.schemas.tickets import (
    CommentCreate,
    CommentResponse,
    StatusHistoryResponse,
    TicketCreate,
    TicketResponse,
    TicketUpdate,
)
from app.services import sla as sla_service
from app.services import users as users_service

# Display names come from the requester/assignee relationships. Async SQLAlchemy
# cannot lazy-load them during serialization, so every query that feeds
# ticket_to_response must eager-load both.
_WITH_PEOPLE = (
    selectinload(Ticket.created_by),
    selectinload(Ticket.assigned_to),
)


def _record_status_change(
    *,
    ticket_id: str,
    from_status: TicketStatus | None,
    to_status: TicketStatus,
    changed_by_id: str | None,
    reason: str | None,
) -> TicketStatusHistory:
    return TicketStatusHistory(
        ticketId=ticket_id,
        fromStatus=from_status,
        toStatus=to_status,
        changedById=changed_by_id,
        reason=reason,
    )


async def list_tickets(db: AsyncSession, user: User) -> list[Ticket]:
    stmt = select(Ticket).options(*_WITH_PEOPLE)
    if user.role == Role.STUDENT:
        stmt = stmt.where(Ticket.createdById == user.id)
    result = await db.execute(stmt)
    tickets = list(result.scalars().all())
    # Refresh breach stamps for open tickets so list payloads stay current.
    dirty = False
    for ticket in tickets:
        before = ticket.slaBreachedAt
        sla_service.refresh_breach(ticket)
        if ticket.slaBreachedAt != before:
            dirty = True
    if dirty:
        await db.commit()
    return tickets


async def get_ticket(db: AsyncSession, ticket_id: str, user: User) -> Ticket:
    result = await db.execute(
        select(Ticket).options(*_WITH_PEOPLE).where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundError("Ticket not found")
    if user.role == Role.STUDENT and ticket.createdById != user.id:
        raise ForbiddenError("Students may only view their own tickets")
    before = ticket.slaBreachedAt
    sla_service.refresh_breach(ticket)
    if ticket.slaBreachedAt != before:
        await db.commit()
        await db.refresh(ticket, ["created_by", "assigned_to"])
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
    sla_service.apply_sla_clock(ticket, reset=True)
    db.add(ticket)
    await db.flush()
    db.add(
        _record_status_change(
            ticket_id=ticket.id,
            from_status=None,
            to_status=ticket.status,
            changed_by_id=user.id,
            reason="created",
        )
    )
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

    previous_status = ticket.status
    previous_priority = ticket.priority

    for key, value in updates.items():
        setattr(ticket, key, value)

    if "status" in updates and ticket.status != previous_status:
        db.add(
            _record_status_change(
                ticket_id=ticket.id,
                from_status=previous_status,
                to_status=ticket.status,
                changed_by_id=user.id,
                reason="staff_update",
            )
        )

    if "priority" in updates and ticket.priority != previous_priority:
        # Priority change restarts the first-response clock under the new policy.
        if ticket.status not in {TicketStatus.RESOLVED, TicketStatus.CLOSED}:
            sla_service.apply_sla_clock(ticket, reset=True)
    else:
        sla_service.refresh_breach(ticket)

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
        previous = ticket.status
        ticket.status = TicketStatus.OPEN
        db.add(
            _record_status_change(
                ticket_id=ticket.id,
                from_status=previous,
                to_status=TicketStatus.OPEN,
                changed_by_id=user.id,
                reason="reopen_on_reply",
            )
        )
        # Reopened tickets get a fresh first-response window.
        sla_service.apply_sla_clock(ticket, reset=True)

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


async def list_status_history(
    db: AsyncSession, ticket_id: str, user: User
) -> list[TicketStatusHistory]:
    await get_ticket(db, ticket_id, user)
    result = await db.execute(
        select(TicketStatusHistory)
        .options(selectinload(TicketStatusHistory.changed_by))
        .where(TicketStatusHistory.ticketId == ticket_id)
        .order_by(TicketStatusHistory.createdAt.asc())
    )
    return list(result.scalars().all())


def ticket_to_response(ticket: Ticket) -> TicketResponse:
    sla_service.refresh_breach(ticket)
    response = TicketResponse.model_validate(ticket)
    # Relationships are eager-loaded by the queries above; fall back to None
    # rather than triggering a lazy load if a caller passes a bare instance.
    created_by = ticket.__dict__.get("created_by")
    assigned_to = ticket.__dict__.get("assigned_to")
    response.createdByName = created_by.displayName if created_by else None
    response.createdByEmail = created_by.email if created_by else None
    response.assignedToName = assigned_to.displayName if assigned_to else None
    response.slaHoursRemaining = sla_service.sla_hours_remaining(ticket)
    response.slaBreached = sla_service.is_breached(ticket)
    return response


def comment_to_response(comment: TicketComment) -> CommentResponse:
    return CommentResponse.model_validate(comment)


def status_history_to_response(row: TicketStatusHistory) -> StatusHistoryResponse:
    response = StatusHistoryResponse.model_validate(row)
    changed_by = row.__dict__.get("changed_by")
    response.changedByName = changed_by.displayName if changed_by else None
    return response
