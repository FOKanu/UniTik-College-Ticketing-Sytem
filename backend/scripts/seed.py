"""Seed script for local development. Ported from archive/scaffold-v1/backend/prisma/seed.ts.

Demo password for all seeded users: demo1234
"""

import asyncio
import uuid

from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Role, TicketStatus
from app.db.session import async_session_factory
from app.models import Attachment, Problem, Ticket, User

DEMO_PASSWORD = "demo1234"


async def seed() -> None:
    async with async_session_factory() as db:
        # Check specifically for the demo student, not "any user" — otherwise a
        # single self-registered account (via the Sign Up page) would make this
        # script skip forever and the demo accounts would never get created.
        existing = await db.execute(
            select(User).where(User.email == "jordan.alvarez@student.university.edu")
        )
        if existing.scalar_one_or_none():
            print("Demo accounts already seeded — skipping.")
            return

        admin = User(
            id=str(uuid.uuid4()),
            email="elena.voss@university.edu",
            displayName="Elena Voss",
            role=Role.ADMIN,
            department="IT Administration",
            passwordHash=hash_password(DEMO_PASSWORD),
        )
        staff_tier1 = User(
            id=str(uuid.uuid4()),
            email="marcus.whitfield@university.edu",
            displayName="Marcus Whitfield",
            role=Role.STAFF,
            department="IT Support — Tier 1",
            passwordHash=hash_password(DEMO_PASSWORD),
        )
        staff_tier2 = User(
            id=str(uuid.uuid4()),
            email="priya.nandakumar@university.edu",
            displayName="Priya Nandakumar",
            role=Role.STAFF,
            department="IT Support — Tier 2",
            passwordHash=hash_password(DEMO_PASSWORD),
        )
        student_jordan = User(
            id=str(uuid.uuid4()),
            email="jordan.alvarez@student.university.edu",
            displayName="Jordan Alvarez",
            role=Role.STUDENT,
            department="Computer Science",
            passwordHash=hash_password(DEMO_PASSWORD),
        )
        student_sophie = User(
            id=str(uuid.uuid4()),
            email="sophie.tan@student.university.edu",
            displayName="Sophie Tan",
            role=Role.STUDENT,
            department="Biology",
            passwordHash=hash_password(DEMO_PASSWORD),
        )
        student_liam = User(
            id=str(uuid.uuid4()),
            email="liam.oconnor@student.university.edu",
            displayName="Liam O'Connor",
            role=Role.STUDENT,
            department="Mechanical Engineering",
            passwordHash=hash_password(DEMO_PASSWORD),
        )
        db.add_all(
            [admin, staff_tier1, staff_tier2, student_jordan, student_sophie, student_liam]
        )
        await db.flush()

        portal_ticket = Ticket(
            id=str(uuid.uuid4()),
            subject="Cannot access course portal",
            description="Login page redirects back to itself after entering valid credentials.",
            status=TicketStatus.OPEN,
            department="Computer Science",
            category="Access",
            createdById=student_jordan.id,
            assignedToId=staff_tier1.id,
        )
        wifi_ticket = Ticket(
            id=str(uuid.uuid4()),
            subject="Lab WiFi outage in Biology building",
            description=(
                "WiFi has been dropping every few minutes in the second-floor labs since Monday."
            ),
            status=TicketStatus.IN_PROGRESS,
            department="Biology",
            category="Network",
            createdById=student_sophie.id,
            assignedToId=staff_tier2.id,
        )
        grade_ticket = Ticket(
            id=str(uuid.uuid4()),
            subject="Grade appeal not reflected in transcript",
            description="Approved grade change from last semester still shows the old grade.",
            status=TicketStatus.RESOLVED,
            department="Mechanical Engineering",
            category="Academic Records",
            createdById=student_liam.id,
            assignedToId=staff_tier1.id,
        )
        vpn_ticket = Ticket(
            id=str(uuid.uuid4()),
            subject="Intermittent VPN disconnects",
            description="VPN connection drops every 10-15 minutes when working from off campus.",
            status=TicketStatus.IN_PROGRESS,
            department="Computer Science",
            category="Network",
            createdById=student_jordan.id,
            assignedToId=staff_tier2.id,
        )
        unclassified_ticket = Ticket(
            id=str(uuid.uuid4()),
            subject="App keeps crashing, not sure who to contact",
            description="The mobile app crashes on launch.",
            status=TicketStatus.OPEN,
            createdById=student_sophie.id,
        )
        db.add_all([portal_ticket, wifi_ticket, grade_ticket, vpn_ticket, unclassified_ticket])
        await db.flush()

        network_problem = Problem(
            id=str(uuid.uuid4()),
            title="Campus network instability affecting WiFi and VPN",
            rootCause="Core switch firmware bug in Building C.",
            status="OPEN",
            ownerId=staff_tier2.id,
        )
        db.add(network_problem)
        await db.flush()
        wifi_ticket.problemId = network_problem.id
        vpn_ticket.problemId = network_problem.id

        attachment = Attachment(
            id=str(uuid.uuid4()),
            ticketId=portal_ticket.id,
            filePath="attachments/tkt-portal-login/screenshot-login-error.png",
            fileType="png",
            fileSizeBytes=482_331,
        )
        db.add(attachment)
        await db.commit()
        print(
            "Seed complete: 6 users, 5 tickets, 1 problem, 1 attachment. "
            f"Demo password: {DEMO_PASSWORD}"
        )


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
