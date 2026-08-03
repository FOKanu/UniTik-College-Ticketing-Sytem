"""Add ticket SLA due/breach columns and TicketStatusHistory.

Prototype first-response SLA is stamped on Ticket.slaDueAt; status transitions
(including create and reopen) are appended to TicketStatusHistory.
"""

import sqlalchemy as sa
from alembic import op

revision = "003_ticket_sla_status_history"
down_revision = "002_faq_embedding_768"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "Ticket",
        sa.Column("slaDueAt", sa.DateTime(timezone=False), nullable=True),
    )
    op.add_column(
        "Ticket",
        sa.Column("slaBreachedAt", sa.DateTime(timezone=False), nullable=True),
    )

    op.create_table(
        "TicketStatusHistory",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("ticketId", sa.String(), sa.ForeignKey("Ticket.id"), nullable=False),
        sa.Column(
            "fromStatus",
            sa.Enum(
                "OPEN",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
                name="TicketStatus",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            "toStatus",
            sa.Enum(
                "OPEN",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
                name="TicketStatus",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("changedById", sa.String(), sa.ForeignKey("User.id"), nullable=True),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column(
            "createdAt",
            sa.DateTime(timezone=False),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_TicketStatusHistory_ticketId_createdAt",
        "TicketStatusHistory",
        ["ticketId", "createdAt"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_TicketStatusHistory_ticketId_createdAt",
        table_name="TicketStatusHistory",
    )
    op.drop_table("TicketStatusHistory")
    op.drop_column("Ticket", "slaBreachedAt")
    op.drop_column("Ticket", "slaDueAt")
