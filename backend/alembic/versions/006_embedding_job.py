"""Add EmbeddingJob queue for out-of-band FAQ embedding."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_embedding_job"
down_revision: Union[str, Sequence[str], None] = "005_department_entity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "EmbeddingJob",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("faqEntryId", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("maxAttempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("lastError", sa.Text(), nullable=True),
        sa.Column("lockedAt", sa.DateTime(), nullable=True),
        sa.Column("lockedBy", sa.String(), nullable=True),
        sa.Column("createdAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["faqEntryId"], ["FaqEntry.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_EmbeddingJob_status", "EmbeddingJob", ["status"])
    op.create_index("ix_EmbeddingJob_faqEntryId", "EmbeddingJob", ["faqEntryId"])
    # At most one active (pending/processing) job per FAQ entry.
    op.execute(
        """
        CREATE UNIQUE INDEX uq_EmbeddingJob_active_faq
        ON "EmbeddingJob" ("faqEntryId")
        WHERE status IN ('pending', 'processing')
        """
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS uq_EmbeddingJob_active_faq')
    op.drop_index("ix_EmbeddingJob_faqEntryId", table_name="EmbeddingJob")
    op.drop_index("ix_EmbeddingJob_status", table_name="EmbeddingJob")
    op.drop_table("EmbeddingJob")
