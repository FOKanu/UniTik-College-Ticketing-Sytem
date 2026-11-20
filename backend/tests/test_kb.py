import pytest

from tests.conftest import integration


@pytest.mark.asyncio
async def test_faq_reads_require_authentication(client):
    assert (await client.get("/api/v1/kb/faq")).status_code == 401
    assert (await client.get("/api/v1/kb/faq/not-a-real-id")).status_code == 401
    assert (
        await client.post("/api/v1/kb/search", json={"query": "unique test phrase"})
    ).status_code == 401


@pytest.mark.asyncio
@integration
async def test_faq_reads_are_scoped_to_authenticated_tenant(client):
    import uuid

    from app.core.security import create_access_token, hash_password
    from app.db.base import Role
    from app.db.session import async_session_factory
    from app.models import FaqEntry, Tenant, User
    from app.services.tenants import DEFAULT_TENANT_ID

    suffix = uuid.uuid4().hex[:10]
    foreign_tenant_id = f"tenant-{suffix}"
    foreign_faq_id = f"faq-{suffix}"
    own_faq_id = f"faq-own-{suffix}"
    email = f"faq-reader-{suffix}@stud.university.edu"

    async with async_session_factory() as db:
        db.add(
            Tenant(
                id=foreign_tenant_id,
                name=f"Foreign tenant {suffix}",
                shortCode=f"foreign-{suffix}",
            )
        )
        user = User(
            tenantId=DEFAULT_TENANT_ID,
            email=email,
            displayName="FAQ reader",
            role=Role.STUDENT,
            passwordHash=hash_password("test-password-123"),
        )
        db.add(user)
        db.add_all(
            [
                FaqEntry(
                    id=own_faq_id,
                    documentId=own_faq_id,
                    tenantId=DEFAULT_TENANT_ID,
                    question=f"Tenant boundary token {suffix}",
                    answer="Own tenant answer",
                    language="en",
                ),
                FaqEntry(
                    id=foreign_faq_id,
                    documentId=foreign_faq_id,
                    tenantId=foreign_tenant_id,
                    question=f"Tenant boundary token {suffix}",
                    answer="Foreign tenant secret answer",
                    language="en",
                ),
            ]
        )
        await db.commit()
        user_id = user.id

    token = create_access_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}

    listed = await client.get("/api/v1/kb/faq?language=en", headers=headers)
    assert listed.status_code == 200, listed.text
    ids = {entry["id"] for entry in listed.json()["data"]}
    assert own_faq_id in ids
    assert foreign_faq_id not in ids

    foreign_detail = await client.get(
        f"/api/v1/kb/faq/{foreign_faq_id}", headers=headers
    )
    assert foreign_detail.status_code == 404

    searched = await client.post(
        "/api/v1/kb/search",
        json={"query": f"Tenant boundary token {suffix}", "language": "en"},
        headers=headers,
    )
    assert searched.status_code == 200, searched.text
    results = searched.json()["data"]
    assert results
    assert all("Foreign tenant secret answer" not in item["answer"] for item in results)
