"""Add Notification.title for in-app inbox display.

The FE NotificationItem shape expects title + body; baseline only had message.
"""

from alembic import op

revision = "004_notification_title"
down_revision = "003_ticket_sla_status_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE "Notification"
        ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Notification'
        """
    )
    # Drop the temporary default so new rows must set an explicit title.
    op.execute(
        'ALTER TABLE "Notification" ALTER COLUMN "title" DROP DEFAULT'
    )


def downgrade() -> None:
    op.execute('ALTER TABLE "Notification" DROP COLUMN IF EXISTS "title"')
