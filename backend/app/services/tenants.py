"""Resolve institutions (tenants) from email domains."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TenantDomain

# Must match DEFAULT_TENANT_ID in alembic/versions/008_multi_tenancy.py.
DEFAULT_TENANT_ID = "tenant-mdh"


def email_domain(email: str) -> str | None:
    """Return the lowercased domain part of an email, or None if malformed."""
    if "@" not in email:
        return None
    domain = email.rsplit("@", 1)[-1].strip().lower()
    return domain or None


async def resolve_tenant_id_for_email(db: AsyncSession, email: str) -> str:
    """Map an email address to a tenant via TenantDomain, else the default tenant.

    Unknown domains fall back to the seeded MDH tenant so local/dev sign-ups
    (and CI fixtures using @example.com) keep working without extra seed rows.
    """
    domain = email_domain(email)
    if domain:
        result = await db.execute(
            select(TenantDomain.tenantId).where(TenantDomain.domain == domain)
        )
        tenant_id = result.scalar_one_or_none()
        if tenant_id:
            return tenant_id
    return DEFAULT_TENANT_ID
