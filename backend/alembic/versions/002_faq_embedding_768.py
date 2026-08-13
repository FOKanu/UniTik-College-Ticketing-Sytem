"""Resize FaqEntry.embedding to 768 for Ollama nomic-embed-text.

OpenAI text-embedding-3-* can also request dimensions=768, so one width covers
both team providers. Table must have no non-null embeddings when applying
(verified empty at authoring time).
"""

from alembic import op

revision = "002_faq_embedding_768"
down_revision = "001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('ALTER TABLE "FaqEntry" ALTER COLUMN embedding TYPE vector(768)')


def downgrade() -> None:
    op.execute('ALTER TABLE "FaqEntry" ALTER COLUMN embedding TYPE vector(1536)')
