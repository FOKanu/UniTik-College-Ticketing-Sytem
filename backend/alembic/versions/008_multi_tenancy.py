"""Multi-tenancy: Tenant, TenantDomain, tenantId on scoped tables + FAQ publishing.

Ports feature/database-multi-tenant-schema onto the current migration chain.
Department already exists (005_department_entity) — this migration adds
tenantId to it instead of recreating the table.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "008_multi_tenancy"
down_revision: str | Sequence[str] | None = "007_notify_job"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEFAULT_TENANT_ID = "tenant-mdh"


def upgrade() -> None:
    op.execute(
        'CREATE TYPE "FaqVisibility" AS ENUM '
        "('STUDENTS_AND_AI', 'AI_ONLY', 'ANNOUNCEMENT')"
    )
    op.execute("CREATE TYPE \"FaqStatus\" AS ENUM ('DRAFT', 'PUBLISHED')")

    op.execute(
        """
        CREATE TABLE "Tenant" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "shortCode" TEXT NOT NULL,
            "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
            "enabledLanguages" JSONB,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
        )
        """
    )
    op.execute('CREATE UNIQUE INDEX "Tenant_shortCode_key" ON "Tenant"("shortCode")')

    op.execute(
        """
        CREATE TABLE "TenantDomain" (
            "id" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "domain" TEXT NOT NULL,
            CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
        )
        """
    )
    op.execute('CREATE UNIQUE INDEX "TenantDomain_domain_key" ON "TenantDomain"("domain")')
    op.execute(
        'ALTER TABLE "TenantDomain" ADD CONSTRAINT "TenantDomain_tenantId_fkey" '
        'FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE'
    )

    op.execute(
        f"""
        INSERT INTO "Tenant" ("id", "name", "shortCode", "defaultLanguage", "enabledLanguages")
        VALUES (
            '{DEFAULT_TENANT_ID}',
            'MediaDesign Hochschule',
            'MDH',
            'en',
            '["en", "de"]'::jsonb
        )
        ON CONFLICT ("id") DO NOTHING
        """
    )
    op.execute(
        f"""
        INSERT INTO "TenantDomain" ("id", "tenantId", "domain") VALUES
            ('{DEFAULT_TENANT_ID}-domain-1', '{DEFAULT_TENANT_ID}', 'mdh.de'),
            ('{DEFAULT_TENANT_ID}-domain-2', '{DEFAULT_TENANT_ID}', 'stud.mdh.de'),
            ('{DEFAULT_TENANT_ID}-domain-3', '{DEFAULT_TENANT_ID}', 'university.edu'),
            ('{DEFAULT_TENANT_ID}-domain-4', '{DEFAULT_TENANT_ID}', 'student.university.edu'),
            ('{DEFAULT_TENANT_ID}-domain-5', '{DEFAULT_TENANT_ID}', 'stud.university.edu')
        ON CONFLICT ("domain") DO NOTHING
        """
    )

    # Existing Department table (005) — extend, do not recreate.
    op.execute('ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "tenantId" TEXT')
    op.execute('ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "description" TEXT')
    op.execute(
        'ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "updatedAt" '
        "TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP"
    )
    op.execute(
        f'UPDATE "Department" SET "tenantId" = \'{DEFAULT_TENANT_ID}\' '
        'WHERE "tenantId" IS NULL'
    )
    op.execute('ALTER TABLE "Department" ALTER COLUMN "tenantId" SET NOT NULL')
    op.execute(
        'ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" '
        'FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") '
        "ON DELETE CASCADE ON UPDATE CASCADE"
    )
    # Replace global unique name with per-tenant uniqueness.
    op.execute('ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "Department_name_key"')
    op.execute('DROP INDEX IF EXISTS "Department_name_key"')
    op.execute(
        'CREATE UNIQUE INDEX "Department_tenantId_name_key" '
        'ON "Department"("tenantId", "name")'
    )

    for table in ("User", "Ticket", "FaqEntry"):
        op.execute(f'ALTER TABLE "{table}" ADD COLUMN "tenantId" TEXT')
        op.execute(
            f'UPDATE "{table}" SET "tenantId" = \'{DEFAULT_TENANT_ID}\' '
            'WHERE "tenantId" IS NULL'
        )
        op.execute(f'ALTER TABLE "{table}" ALTER COLUMN "tenantId" SET NOT NULL')
        op.execute(
            f'ALTER TABLE "{table}" ADD CONSTRAINT "{table}_tenantId_fkey" '
            'FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") '
            "ON DELETE RESTRICT ON UPDATE CASCADE"
        )
        op.execute(f'CREATE INDEX "{table}_tenantId_idx" ON "{table}"("tenantId")')

    op.execute(
        'ALTER TABLE "FaqEntry" ADD COLUMN "visibility" "FaqVisibility" '
        "NOT NULL DEFAULT 'STUDENTS_AND_AI'"
    )
    op.execute(
        'ALTER TABLE "FaqEntry" ADD COLUMN "status" "FaqStatus" '
        "NOT NULL DEFAULT 'PUBLISHED'"
    )


def downgrade() -> None:
    op.execute('ALTER TABLE "FaqEntry" DROP COLUMN IF EXISTS "status"')
    op.execute('ALTER TABLE "FaqEntry" DROP COLUMN IF EXISTS "visibility"')

    for table in ("User", "Ticket", "FaqEntry"):
        op.execute(f'DROP INDEX IF EXISTS "{table}_tenantId_idx"')
        op.execute(f'ALTER TABLE "{table}" DROP CONSTRAINT IF EXISTS "{table}_tenantId_fkey"')
        op.execute(f'ALTER TABLE "{table}" DROP COLUMN IF EXISTS "tenantId"')

    op.execute('DROP INDEX IF EXISTS "Department_tenantId_name_key"')
    op.execute('ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "Department_tenantId_fkey"')
    op.execute('ALTER TABLE "Department" DROP COLUMN IF EXISTS "updatedAt"')
    op.execute('ALTER TABLE "Department" DROP COLUMN IF EXISTS "description"')
    op.execute('ALTER TABLE "Department" DROP COLUMN IF EXISTS "tenantId"')
    op.execute('CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name")')

    op.execute('DROP TABLE IF EXISTS "TenantDomain"')
    op.execute('DROP TABLE IF EXISTS "Tenant"')
    op.execute('DROP TYPE IF EXISTS "FaqStatus"')
    op.execute('DROP TYPE IF EXISTS "FaqVisibility"')
