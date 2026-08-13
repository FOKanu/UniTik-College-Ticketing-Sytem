"""Add stable multilingual FAQ document identity."""

import sqlalchemy as sa

from alembic import op

revision = "009_faq_document_identity"
down_revision = "008_multi_tenancy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("FaqEntry", sa.Column("documentId", sa.String(), nullable=True))
    op.execute('UPDATE "FaqEntry" SET "documentId" = id')
    op.alter_column("FaqEntry", "documentId", nullable=False)
    op.create_index(
        "uq_faq_tenant_document_language",
        "FaqEntry",
        ["tenantId", "documentId", "language"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_faq_tenant_document_language", table_name="FaqEntry")
    op.drop_column("FaqEntry", "documentId")
