"""Seed script for local development.

Demo password for every seeded user: demo1234

The script is split into small steps (tenants, departments, users, tickets,
FAQ articles). Each step checks for its own data before inserting, so you can
re-run it safely and a step that was added later still fills in its rows on a
database that was seeded before it existed.

Run it with:  python -m scripts.seed
"""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.base import FaqStatus, FaqVisibility, Role, TicketStatus
from app.db.session import async_session_factory
from app.models import (
    Attachment,
    Department,
    FaqEntry,
    Problem,
    Tenant,
    TenantDomain,
    Ticket,
    User,
)

DEMO_PASSWORD = "demo1234"

# Must match DEFAULT_TENANT_ID in alembic/versions/002_multi_tenancy.py — the
# migration creates this tenant so existing rows have somewhere to belong.
MDH_TENANT_ID = "tenant-mdh"
TUM_TENANT_ID = "tenant-tum"


async def seed_tenants(db: AsyncSession) -> None:
    """Institutions. MDH already exists (created by migration 002)."""
    # Extra domains for MDH so the original demo accounts (…@university.edu)
    # still resolve to a tenant. New sign-ups would normally use mdh.de.
    for domain in ("university.edu", "student.university.edu"):
        found = await db.execute(select(TenantDomain).where(TenantDomain.domain == domain))
        if not found.scalar_one_or_none():
            db.add(TenantDomain(id=str(uuid.uuid4()), tenantId=MDH_TENANT_ID, domain=domain))

    # A second institution, so cross-tenant isolation is demonstrable.
    found = await db.execute(select(Tenant).where(Tenant.id == TUM_TENANT_ID))
    if not found.scalar_one_or_none():
        db.add(
            Tenant(
                id=TUM_TENANT_ID,
                name="Technische Universität München",
                shortCode="TUM",
                defaultLanguage="de",
                enabledLanguages=["en", "de"],
            )
        )
        db.add(TenantDomain(id=str(uuid.uuid4()), tenantId=TUM_TENANT_ID, domain="tum.de"))
    await db.commit()


DEPARTMENTS = [
    ("IT Support", "Hardware, software, network and accounts"),
    ("Facilities", "Buildings, rooms, heating and maintenance"),
    ("Academic Records", "Transcripts, grades and registration"),
    ("Finance", "Tuition, refunds and payments"),
    ("Library", "Loans, access and study spaces"),
    ("Housing", "Student accommodation"),
]


async def seed_departments(db: AsyncSession) -> None:
    for tenant_id in (MDH_TENANT_ID, TUM_TENANT_ID):
        for name, description in DEPARTMENTS:
            found = await db.execute(
                select(Department).where(
                    Department.tenantId == tenant_id, Department.name == name
                )
            )
            if not found.scalar_one_or_none():
                db.add(
                    Department(
                        id=str(uuid.uuid4()),
                        tenantId=tenant_id,
                        name=name,
                        description=description,
                    )
                )
    await db.commit()


async def seed_users(db: AsyncSession) -> None:
    """Demo accounts. Emails are kept stable so saved logins keep working."""
    found = await db.execute(
        select(User).where(User.email == "jordan.alvarez@student.university.edu")
    )
    if found.scalar_one_or_none():
        return

    people = [
        # (email, displayName, role, department, tenantId)
        ("elena.voss@university.edu", "Elena Voss", Role.ADMIN, "IT Administration", MDH_TENANT_ID),
        (
            "marcus.whitfield@university.edu",
            "Marcus Whitfield",
            Role.STAFF,
            "IT Support",
            MDH_TENANT_ID,
        ),
        (
            "priya.nandakumar@university.edu",
            "Priya Nandakumar",
            Role.STAFF,
            "Facilities",
            MDH_TENANT_ID,
        ),
        (
            "jordan.alvarez@student.university.edu",
            "Jordan Alvarez",
            Role.STUDENT,
            "Computer Science",
            MDH_TENANT_ID,
        ),
        (
            "sophie.tan@student.university.edu",
            "Sophie Tan",
            Role.STUDENT,
            "Biology",
            MDH_TENANT_ID,
        ),
        (
            "liam.oconnor@student.university.edu",
            "Liam O'Connor",
            Role.STUDENT,
            "Mechanical Engineering",
            MDH_TENANT_ID,
        ),
        # Second institution — used to prove tenant isolation.
        ("admin@tum.de", "Klara Bauer", Role.ADMIN, "IT Administration", TUM_TENANT_ID),
        ("agent@tum.de", "Stefan Roth", Role.STAFF, "IT Support", TUM_TENANT_ID),
        ("student@tum.de", "Mila Fischer", Role.STUDENT, "Informatics", TUM_TENANT_ID),
    ]
    for email, name, role, department, tenant_id in people:
        db.add(
            User(
                id=str(uuid.uuid4()),
                tenantId=tenant_id,
                email=email,
                displayName=name,
                role=role,
                department=department,
                passwordHash=hash_password(DEMO_PASSWORD),
            )
        )
    await db.commit()


async def seed_tickets(db: AsyncSession) -> None:
    found = await db.execute(select(Ticket).limit(1))
    if found.scalar_one_or_none():
        return

    async def user_id(email: str) -> str:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one().id

    jordan = await user_id("jordan.alvarez@student.university.edu")
    sophie = await user_id("sophie.tan@student.university.edu")
    liam = await user_id("liam.oconnor@student.university.edu")
    marcus = await user_id("marcus.whitfield@university.edu")
    priya = await user_id("priya.nandakumar@university.edu")
    tum_student = await user_id("student@tum.de")
    tum_agent = await user_id("agent@tum.de")

    tickets = [
        # (subject, description, status, department, category, createdBy, assignedTo, tenant)
        (
            "Cannot access exam portal",
            "Login redirects back to itself after entering valid credentials.",
            TicketStatus.IN_PROGRESS,
            "IT Support",
            "Access",
            jordan,
            marcus,
            MDH_TENANT_ID,
        ),
        (
            "Tuition refund not processed",
            "Refund approved three weeks ago but nothing has arrived.",
            TicketStatus.OPEN,
            "Finance",
            "Payments",
            jordan,
            None,
            MDH_TENANT_ID,
        ),
        (
            "Broken AC in dorm room 214",
            "Air conditioning has been making a loud noise and blowing warm air.",
            TicketStatus.OPEN,
            "Facilities",
            "Maintenance",
            sophie,
            priya,
            MDH_TENANT_ID,
        ),
        (
            "Lab WiFi outage in Biology building",
            "WiFi drops every few minutes in the second-floor labs.",
            TicketStatus.IN_PROGRESS,
            "IT Support",
            "Network",
            sophie,
            marcus,
            MDH_TENANT_ID,
        ),
        (
            "Missing grade for Statistics II",
            "Approved grade change from last semester still shows the old grade.",
            TicketStatus.RESOLVED,
            "Academic Records",
            "Grades",
            liam,
            marcus,
            MDH_TENANT_ID,
        ),
        (
            "Library card not recognised at gate",
            "Card worked last week, now the reader beeps and denies entry.",
            TicketStatus.OPEN,
            "Library",
            "Access",
            liam,
            None,
            MDH_TENANT_ID,
        ),
        # TUM ticket — an MDH user must never see this one.
        (
            "Campus VPN certificate expired",
            "VPN client refuses to connect since Monday.",
            TicketStatus.OPEN,
            "IT Support",
            "Network",
            tum_student,
            tum_agent,
            TUM_TENANT_ID,
        ),
    ]
    created: list[Ticket] = []
    for subject, desc, status, dept, category, by, to, tenant_id in tickets:
        ticket = Ticket(
            id=str(uuid.uuid4()),
            tenantId=tenant_id,
            subject=subject,
            description=desc,
            status=status,
            department=dept,
            category=category,
            createdById=by,
            assignedToId=to,
        )
        db.add(ticket)
        created.append(ticket)
    await db.flush()

    problem = Problem(
        id=str(uuid.uuid4()),
        title="Campus network instability affecting WiFi and VPN",
        rootCause="Core switch firmware bug in Building C.",
        status="OPEN",
        ownerId=marcus,
    )
    db.add(problem)
    await db.flush()
    created[3].problemId = problem.id

    db.add(
        Attachment(
            id=str(uuid.uuid4()),
            ticketId=created[0].id,
            filePath="attachments/tkt-exam-portal/screenshot-login-error.png",
            fileType="png",
            fileSizeBytes=482_331,
        )
    )
    await db.commit()


# (question, answer, category, visibility)
FAQ_ARTICLES = [
    (
        "How do I reset my student portal password?",
        "Open the IT Self-Service Portal and choose 'Forgot password'. A reset link is sent to "
        "your university address and is valid for 30 minutes. If nothing arrives within 10 "
        "minutes, check your spam folder and then contact IT Support.",
        "IT Support",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "How do I connect to campus WiFi (eduroam)?",
        "Select the 'eduroam' network and sign in with your full university email address and "
        "your portal password. On iOS and Android you must accept the security certificate the "
        "first time you connect.",
        "IT Support",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "My account is locked after several failed sign-ins. What now?",
        "Accounts lock for 30 minutes after five failed attempts. Wait for the lock to clear or "
        "raise a ticket with IT Support if you need it unlocked sooner.",
        "IT Support",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "VPN certificate renewal runbook",
        "Internal: renew the RADIUS certificate 14 days before expiry, restart the VPN "
        "concentrator in Building C, then confirm with a test client on the guest network.",
        "IT Support",
        FaqVisibility.AI_ONLY,
    ),
    (
        "How long does a tuition refund take?",
        "Approved refunds are processed in the next weekly payment run and reach your bank "
        "within five to ten working days. Refunds to non-EU accounts can take longer.",
        "Finance",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "Policy update: new refund processing times from 1 August",
        "From 1 August refunds move from a monthly to a weekly payment run. Requests approved "
        "before 31 July follow the previous schedule.",
        "Finance",
        FaqVisibility.ANNOUNCEMENT,
    ),
    (
        "Where do I find my invoice or payment confirmation?",
        "Invoices are listed under Finance in the student portal. Each entry has a PDF download "
        "that is valid as an official receipt.",
        "Finance",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "How do I request an official transcript?",
        "Order transcripts from Academic Records in the student portal. Digital copies arrive "
        "within two working days; printed copies take five and can be collected from the "
        "registry office.",
        "Academic Records",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "A grade is missing or looks wrong. Who do I contact?",
        "Raise a ticket with Academic Records including the module code and the assessment "
        "date. Grade corrections are confirmed by the module lead before they appear.",
        "Academic Records",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "When are semester dates and deadlines published?",
        "The academic calendar for the next year is published each May and covers teaching "
        "weeks, examination periods and resit dates.",
        "Academic Records",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "How do I report a maintenance issue in a university building?",
        "Raise a ticket with Facilities and include the building and room number. Heating, "
        "water and electrical faults are treated as high priority.",
        "Facilities",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "Can I book a study room or lab outside teaching hours?",
        "Rooms can be booked up to two weeks ahead from the Facilities section of the portal. "
        "Lab access outside staffed hours needs approval from your department.",
        "Facilities",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "What are the library loan periods and fines?",
        "Standard loans run for four weeks with two renewals. Short-loan items are seven days. "
        "Overdue items accrue a small daily fee capped at the replacement cost.",
        "Library",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "My library card is not recognised at the gate.",
        "Cards deactivate automatically if your enrolment lapses. Check your enrolment status "
        "first, then raise a ticket with the Library if it is current.",
        "Library",
        FaqVisibility.STUDENTS_AND_AI,
    ),
    (
        "How do I apply for student accommodation?",
        "Applications open in March for the following academic year. Places are allocated by "
        "distance from campus and year of study.",
        "Housing",
        FaqVisibility.STUDENTS_AND_AI,
    ),
]


async def seed_faq(db: AsyncSession) -> None:
    """FAQ articles.

    This step has its own existence check per article, so it still runs on a
    database that was seeded before FAQ articles were added to this script.
    `embedding` is left NULL — kb.search_faq falls back to a text search, which
    works fine without vectors.
    """
    for question, answer, category, visibility in FAQ_ARTICLES:
        found = await db.execute(
            select(FaqEntry).where(
                FaqEntry.tenantId == MDH_TENANT_ID, FaqEntry.question == question
            )
        )
        if found.scalar_one_or_none():
            continue
        db.add(
            FaqEntry(
                id=str(uuid.uuid4()),
                tenantId=MDH_TENANT_ID,
                question=question,
                answer=answer,
                category=category,
                visibility=visibility,
                status=FaqStatus.PUBLISHED,
                language="en",
            )
        )
    await db.commit()


async def seed() -> None:
    async with async_session_factory() as db:
        await seed_tenants(db)
        await seed_departments(db)
        await seed_users(db)
        await seed_tickets(db)
        await seed_faq(db)
        print(
            "Seed complete. Institutions: MediaDesign Hochschule, Technische Universität "
            f"München. Demo password: {DEMO_PASSWORD}"
        )


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
