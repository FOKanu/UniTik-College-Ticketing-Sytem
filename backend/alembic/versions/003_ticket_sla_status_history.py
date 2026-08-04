"""Add ticket SLA due/breach columns and TicketStatusHistory.

Prototype first-response SLA is stamped on Ticket.slaDueAt; status transitions
(including create and reopen) are appended to TicketStatusHistory.

Uses raw SQL (same style as 001_baseline) so we reference the existing
Postgres "TicketStatus" enum without SQLAlchemy attempting CREATE TYPE again.
"""

from alembic import op

revision = "003_ticket_sla_status_history"
down_revision = "002_faq_embedding_768"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "slaDueAt" TIMESTAMP')
    op.execute(
        'ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "slaBreachedAt" TIMESTAMP'
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "TicketStatusHistory" (
            "id" TEXT NOT NULL,
            "ticketId" TEXT NOT NULL,
            "fromStatus" "TicketStatus",
            "toStatus" "TicketStatus" NOT NULL,
            "changedById" TEXT,
            "reason" TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "TicketStatusHistory_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "TicketStatusHistory_ticketId_fkey"
                FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id"),
            CONSTRAINT "TicketStatusHistory_changedById_fkey"
                FOREIGN KEY ("changedById") REFERENCES "User"("id")
        )
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "ix_TicketStatusHistory_ticketId_createdAt"
        ON "TicketStatusHistory" ("ticketId", "createdAt")
        """
    )


def downgrade() -> None:
    op.execute(
        'DROP INDEX IF EXISTS "ix_TicketStatusHistory_ticketId_createdAt"'
    )
    op.execute('DROP TABLE IF EXISTS "TicketStatusHistory"')
    op.execute('ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "slaBreachedAt"')
    op.execute('ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "slaDueAt"')
