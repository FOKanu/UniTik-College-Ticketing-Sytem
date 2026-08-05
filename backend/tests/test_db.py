import uuid

import pytest
from sqlalchemy import select

from app.db.base import Role
from app.db.session import async_session_factory
from app.models import Ticket, User
from tests.conftest import department_id_for, integration


@pytest.mark.asyncio
@integration
async def test_db_user_ticket_roundtrip():
    async with async_session_factory() as db:
        user = User(
            email=f"pytest-{uuid.uuid4().hex[:8]}@student.university.edu",
            displayName="Pytest User",
            role=Role.STUDENT,
            departmentId=await department_id_for(db, f"Testing-{uuid.uuid4().hex[:8]}"),
        )
        db.add(user)
        await db.flush()
        ticket = Ticket(
            subject="Test ticket",
            description="Created by pytest",
            createdById=user.id,
        )
        db.add(ticket)
        await db.commit()

        result = await db.execute(select(Ticket).where(Ticket.createdById == user.id))
        tickets = list(result.scalars().all())
        assert len(tickets) >= 1
        assert tickets[0].subject == "Test ticket"

        await db.delete(ticket)
        await db.delete(user)
        await db.commit()
