from datetime import datetime, timedelta

from app.db.base import TicketPriority, TicketStatus
from app.models import Ticket
from app.services import sla as sla_service


def test_hours_for_priority_policy():
    assert sla_service.hours_for_priority(TicketPriority.HIGH) == 24
    assert sla_service.hours_for_priority(TicketPriority.MEDIUM) == 72
    assert sla_service.hours_for_priority(TicketPriority.LOW) == 120


def test_apply_sla_clock_and_remaining_hours():
    ticket = Ticket(
        subject="x",
        description="y",
        priority=TicketPriority.HIGH,
        status=TicketStatus.OPEN,
        createdById="u1",
    )
    sla_service.apply_sla_clock(ticket, reset=True)
    assert ticket.slaDueAt is not None
    remaining = sla_service.sla_hours_remaining(ticket)
    assert remaining is not None
    assert 23 <= remaining <= 24


def test_refresh_breach_stamps_once():
    ticket = Ticket(
        subject="x",
        description="y",
        priority=TicketPriority.HIGH,
        status=TicketStatus.OPEN,
        createdById="u1",
        slaDueAt=datetime.now() - timedelta(hours=1),
    )
    assert ticket.slaBreachedAt is None
    sla_service.refresh_breach(ticket)
    assert ticket.slaBreachedAt is not None
    first = ticket.slaBreachedAt
    sla_service.refresh_breach(ticket)
    assert ticket.slaBreachedAt == first


def test_terminal_status_hides_remaining_hours():
    ticket = Ticket(
        subject="x",
        description="y",
        priority=TicketPriority.MEDIUM,
        status=TicketStatus.RESOLVED,
        createdById="u1",
        slaDueAt=datetime.now() + timedelta(hours=10),
    )
    assert sla_service.sla_hours_remaining(ticket) is None
