"""Add NotifyJob queue for outbound email notifications."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "007_notify_job"
down_revision: str | Sequence[str] | None = "006_embedding_job"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "NotifyJob",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("userId", sa.String(), nullable=False),
        sa.Column("ticketId", sa.String(), nullable=True),
        sa.Column("notificationId", sa.String(), nullable=True),
        sa.Column("toEmail", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("maxAttempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("lastError", sa.Text(), nullable=True),
        sa.Column("lockedAt", sa.DateTime(), nullable=True),
        sa.Column("lockedBy", sa.String(), nullable=True),
        sa.Column("createdAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["userId"], ["User.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_NotifyJob_status", "NotifyJob", ["status"])
    op.create_index("ix_NotifyJob_userId", "NotifyJob", ["userId"])


def downgrade() -> None:
    op.drop_index("ix_NotifyJob_userId", table_name="NotifyJob")
    op.drop_index("ix_NotifyJob_status", table_name="NotifyJob")
    op.drop_table("NotifyJob")
