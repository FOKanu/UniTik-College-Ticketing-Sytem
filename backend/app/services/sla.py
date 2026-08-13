"""First-response SLA helpers (no background worker yet).

Policy is a simple priority → hours map. The due clock starts at ticket create
and resets on priority change or student reopen-from-resolved.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.db.base import TicketPriority, TicketStatus
from app.models import Ticket

# Prototype policy — replace with sla_rules table later if needed.
SLA_HOURS_BY_PRIORITY: dict[TicketPriority, int] = {
    TicketPriority.HIGH: 24,
    TicketPriority.MEDIUM: 72,
    TicketPriority.LOW: 120,
}

# Statuses that stop the first-response clock (no longer "awaiting staff").
_TERMINAL = {TicketStatus.RESOLVED, TicketStatus.CLOSED}


def hours_for_priority(priority: TicketPriority) -> int:
    return SLA_HOURS_BY_PRIORITY.get(priority, SLA_HOURS_BY_PRIORITY[TicketPriority.MEDIUM])


def compute_due_at(
    *,
    priority: TicketPriority,
    from_time: datetime | None = None,
) -> datetime:
    start = from_time or datetime.now()
    return start + timedelta(hours=hours_for_priority(priority))


def apply_sla_clock(ticket: Ticket, *, reset: bool = False) -> None:
    """Ensure slaDueAt is set; optionally restart the clock (priority/reopen)."""
    now = datetime.now()
    if reset or ticket.slaDueAt is None:
        ticket.slaDueAt = compute_due_at(priority=ticket.priority, from_time=now)
        ticket.slaBreachedAt = None
    refresh_breach(ticket, now=now)


def refresh_breach(ticket: Ticket, *, now: datetime | None = None) -> None:
    """Stamp slaBreachedAt once when an open ticket passes its due time."""
    now = now or datetime.now()
    if ticket.status in _TERMINAL:
        return
    if ticket.slaDueAt is None:
        return
    if ticket.slaBreachedAt is not None:
        return
    if now >= ticket.slaDueAt:
        ticket.slaBreachedAt = now


def sla_hours_remaining(ticket: Ticket, *, now: datetime | None = None) -> int | None:
    """Whole hours left until due (negative when overdue). None if no clock."""
    if ticket.slaDueAt is None:
        return None
    if ticket.status in _TERMINAL:
        return None
    now = now or datetime.now()
    delta = ticket.slaDueAt - now
    # Floor toward zero for positives; keep negatives as overdue signal.
    return int(delta.total_seconds() // 3600)


def is_breached(ticket: Ticket, *, now: datetime | None = None) -> bool:
    refresh_breach(ticket, now=now)
    return ticket.slaBreachedAt is not None and ticket.status not in _TERMINAL
