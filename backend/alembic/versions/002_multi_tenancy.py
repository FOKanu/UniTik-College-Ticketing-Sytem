"""Multi-tenancy: Tenant, TenantDomain, Department + tenantId on scoped tables.

The platform moved from a single-institution deployment to a product several
institutions can buy. Every user, ticket and knowledge-base article now belongs
to exactly one tenant.

Existing databases already hold seeded rows, so this migration:
  1. creates the new tables,
  2. inserts a default tenant (MediaDesign Hochschule),
  3. adds tenantId as NULLABLE, backfills it to that tenant,
  4. only then tightens the columns to NOT NULL.

Running it on an empty database is fine too — step 3 simply updates no rows.
"""

from alembic import op

revision = "002_multi_tenancy"
down_revision = "001_baseline"
branch_labels = None
depends_on = None

# Fixed id so the seed script and this migration agree on the default tenant.
DEFAULT_TENANT_ID = "tenant-mdh"


def upgrade() -> None:
    # --- new enums -------------------------------------------------------
    op.execute(
        'CREATE TYPE "FaqVisibility" AS ENUM '
        "('STUDENTS_AND_AI', 'AI_ONLY', 'ANNOUNCEMENT')"
    )
    op.execute("CREATE TYPE \"FaqStatus\" AS ENUM ('DRAFT', 'PUBLISHED')")

    # --- new tables ------------------------------------------------------
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
        """
        CREATE TABLE "Department" (
            "id" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX "Department_tenantId_name_key" ON "Department"("tenantId", "name")'
    )
    op.execute(
        'ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" '
        'FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE'
    )

    # --- default tenant, so existing rows have somewhere to belong -------
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
            ('{DEFAULT_TENANT_ID}-domain-2', '{DEFAULT_TENANT_ID}', 'stud.mdh.de')
        ON CONFLICT ("domain") DO NOTHING
        """
    )

    # --- tenantId on scoped tables (add nullable, backfill, tighten) -----
    for table in ("User", "Ticket", "FaqEntry"):
        op.execute(f'ALTER TABLE "{table}" ADD COLUMN "tenantId" TEXT')
        op.execute(f'UPDATE "{table}" SET "tenantId" = \'{DEFAULT_TENANT_ID}\'')
        op.execute(f'ALTER TABLE "{table}" ALTER COLUMN "tenantId" SET NOT NULL')
        op.execute(
            f'ALTER TABLE "{table}" ADD CONSTRAINT "{table}_tenantId_fkey" '
            'FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") '
            "ON DELETE RESTRICT ON UPDATE CASCADE"
        )
        op.execute(f'CREATE INDEX "{table}_tenantId_idx" ON "{table}"("tenantId")')

    # --- knowledge-base publishing controls ------------------------------
    op.execute(
        'ALTER TABLE "FaqEntry" ADD COLUMN "visibility" "FaqVisibility" '
        "NOT NULL DEFAULT 'STUDENTS_AND_AI'"
    )
    op.execute(
        'ALTER TABLE "FaqEntry" ADD COLUMN "status" "FaqStatus" NOT NULL DEFAULT \'PUBLISHED\''
    )


def downgrade() -> None:
    op.execute('ALTER TABLE "FaqEntry" DROP COLUMN IF EXISTS "status"')
    op.execute('ALTER TABLE "FaqEntry" DROP COLUMN IF EXISTS "visibility"')

    for table in ("User", "Ticket", "FaqEntry"):
        op.execute(f'DROP INDEX IF EXISTS "{table}_tenantId_idx"')
        op.execute(f'ALTER TABLE "{table}" DROP CONSTRAINT IF EXISTS "{table}_tenantId_fkey"')
        op.execute(f'ALTER TABLE "{table}" DROP COLUMN IF EXISTS "tenantId"')

    op.execute('DROP TABLE IF EXISTS "Department"')
    op.execute('DROP TABLE IF EXISTS "TenantDomain"')
    op.execute('DROP TABLE IF EXISTS "Tenant"')
    op.execute('DROP TYPE IF EXISTS "FaqStatus"')
    op.execute('DROP TYPE IF EXISTS "FaqVisibility"')
