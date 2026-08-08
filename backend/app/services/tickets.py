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
from app.services import departments as departments_service
from app.services import notifications as notification_service
from app.services import sla as sla_service
from app.services import users as users_service
from app.services.ticket_routing import classify_ticket

# Display names come from the requester/assignee relationships. Async SQLAlchemy
# cannot lazy-load them during serialization, so every query that feeds
# ticket_to_response must eager-load both.
_WITH_PEOPLE = (
    selectinload(Ticket.created_by),
    selectinload(Ticket.assigned_to),
    selectinload(Ticket.department),
)


def _staff_department_mismatch(user: User, ticket: Ticket) -> bool:
    """True when a STAFF user may not access a ticket due to department scope."""
    if user.role != Role.STAFF:
        return False
    if user.departmentId is None or ticket.departmentId is None:
        return False
    return ticket.departmentId != user.departmentId


def _staff_list_department_filter(user: User):
    """SQLAlchemy filter for department-scoped STAFF ticket lists."""
    if user.departmentId:
        return (Ticket.departmentId == user.departmentId) | (Ticket.departmentId.is_(None))
    return Ticket.departmentId.is_(None)


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
    elif user.role == Role.STAFF:
        stmt = stmt.where(_staff_list_department_filter(user))
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
    if _staff_department_mismatch(user, ticket):
        raise ForbiddenError("Staff may only view tickets in their department")
    before = ticket.slaBreachedAt
    sla_service.refresh_breach(ticket)
    if ticket.slaBreachedAt != before:
        await db.commit()
        await db.refresh(ticket, ["created_by", "assigned_to", "department"])
    return ticket


async def create_ticket(db: AsyncSession, user: User, data: TicketCreate) -> Ticket:
    # Explicit department from the client is always treated as a human choice.
    # Otherwise run the keyword router (NEG-6: ties / no-hits stay unclassified).
    category = data.category
    classification_source: str | None = None
    if data.department:
        dept = await departments_service.get_or_create_department(db, data.department)
        classification_source = "manual" if dept else None
    else:
        classification = classify_ticket(data.subject, data.description)
        if classification.department:
            dept = await departments_service.get_or_create_department(
                db, classification.department
            )
            classification_source = classification.classification_source
            if category is None:
                category = classification.category
        else:
            dept = None

    ticket = Ticket(
        subject=data.subject,
        description=data.description,
        priority=data.priority,
        category=category,
        departmentId=dept.id if dept else None,
        classificationSource=classification_source,
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
    await db.refresh(ticket, ["created_by", "assigned_to", "department"])
    return ticket


async def update_ticket(db: AsyncSession, ticket_id: str, user: User, data: TicketUpdate) -> Ticket:
    ticket = await get_ticket(db, ticket_id, user)
    if user.role == Role.STUDENT:
        raise ForbiddenError("Students cannot update tickets")
    updates = data.model_dump(exclude_unset=True)

    # Validate assignee before applying — null clears assignment; any id must
    # resolve to a STAFF/ADMIN account so students cannot be assigned tickets.
    if "assignedToId" in updates and updates["assignedToId"] is not None:
        await users_service.get_assignable_user(db, updates["assignedToId"])

    # API still accepts free-text department; resolve to Department FK.
    if "department" in updates:
        dept_label = updates.pop("department")
        dept = await departments_service.get_or_create_department(db, dept_label)
        updates["departmentId"] = dept.id if dept else None
        if dept is not None:
            updates["classificationSource"] = "manual"

    previous_status = ticket.status
    previous_priority = ticket.priority
    previous_assignee = ticket.assignedToId

    for key, value in updates.items():
        setattr(ticket, key, value)

    pending_notes: list = []

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
        pending_notes.append(
            notification_service.create_in_app(
                user_id=ticket.createdById,
                actor_id=user.id,
                ticket_id=ticket.id,
                title="Ticket update",
                body=(
                    f'"{ticket.subject}" moved to '
                    f"{ticket.status.value.replace('_', ' ').title()}."
                ),
            )
        )

    if "assignedToId" in updates and ticket.assignedToId != previous_assignee:
        if ticket.assignedToId:
            pending_notes.append(
                notification_service.create_in_app(
                    user_id=ticket.assignedToId,
                    actor_id=user.id,
                    ticket_id=ticket.id,
                    title="Ticket assigned",
                    body=f'You were assigned "{ticket.subject}".',
                )
            )

    if "priority" in updates and ticket.priority != previous_priority:
        # Priority change restarts the first-response clock under the new policy.
        if ticket.status not in {TicketStatus.RESOLVED, TicketStatus.CLOSED}:
            sla_service.apply_sla_clock(ticket, reset=True)
    else:
        sla_service.refresh_breach(ticket)

    await notification_service.notify_many(db, pending_notes)
    await db.commit()
    # Reload the people relationships so a reassignment returns the new name.
    await db.refresh(ticket, ["created_by", "assigned_to", "department"])
    return ticket


async def list_comments(db: AsyncSession, ticket_id: str, user: User) -> list[TicketComment]:
    await get_ticket(db, ticket_id, user)
    result = await db.execute(select(TicketComment).where(TicketComment.ticketId == ticket_id))
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

    # Public comments notify the counterpart; internal notes stay staff-only.
    pending_notes: list = []
    if not data.isInternal:
        if user.role == Role.STUDENT:
            if ticket.assignedToId:
                pending_notes.append(
                    notification_service.create_in_app(
                        user_id=ticket.assignedToId,
                        actor_id=user.id,
                        ticket_id=ticket.id,
                        title="Student reply",
                        body=f'New reply on "{ticket.subject}".',
                    )
                )
        elif ticket.createdById:
            pending_notes.append(
                notification_service.create_in_app(
                    user_id=ticket.createdById,
                    actor_id=user.id,
                    ticket_id=ticket.id,
                    title="Agent reply",
                    body=f'Support replied on "{ticket.subject}".',
                )
            )
    await notification_service.notify_many(db, pending_notes)

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
    # `department` is a relationship; expose its name to keep the API string-shaped.
    response = TicketResponse(
        id=ticket.id,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        department=departments_service.department_name(ticket),
        classificationSource=ticket.classificationSource,
        createdById=ticket.createdById,
        assignedToId=ticket.assignedToId,
        problemId=ticket.problemId,
        createdAt=ticket.createdAt,
        updatedAt=ticket.updatedAt,
        slaDueAt=ticket.slaDueAt,
        slaBreachedAt=ticket.slaBreachedAt,
    )
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
