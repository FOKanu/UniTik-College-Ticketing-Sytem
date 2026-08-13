"""Alembic baseline — reproduces archived Prisma schema."""

from alembic import op

revision = "001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector"')
    op.execute("CREATE TYPE \"Role\" AS ENUM ('STUDENT', 'STAFF', 'ADMIN')")
    op.execute("CREATE TYPE \"TicketStatus\" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')")
    op.execute("CREATE TYPE \"TicketPriority\" AS ENUM ('LOW', 'MEDIUM', 'HIGH')")

    op.execute("""
        CREATE TABLE "User" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "displayName" TEXT NOT NULL,
            "role" "Role" NOT NULL DEFAULT 'STUDENT',
            "department" TEXT,
            "passwordHash" TEXT,
            "externalId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        )
        """)
    op.execute('CREATE UNIQUE INDEX "User_email_key" ON "User"("email")')

    op.execute("""
        CREATE TABLE "Problem" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "rootCause" TEXT,
            "status" TEXT NOT NULL DEFAULT 'OPEN',
            "ownerId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "Ticket" (
            "id" TEXT NOT NULL,
            "subject" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
            "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
            "category" TEXT,
            "department" TEXT,
            "createdById" TEXT NOT NULL,
            "assignedToId" TEXT,
            "problemId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "Attachment" (
            "id" TEXT NOT NULL,
            "ticketId" TEXT NOT NULL,
            "filePath" TEXT NOT NULL,
            "fileType" TEXT NOT NULL,
            "fileSizeBytes" INTEGER NOT NULL,
            "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "FaqEntry" (
            "id" TEXT NOT NULL,
            "question" TEXT NOT NULL,
            "answer" TEXT NOT NULL,
            "language" TEXT NOT NULL DEFAULT 'en',
            "category" TEXT,
            "contextBlob" TEXT,
            "embedding" vector(1536),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "Notification" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "ticketId" TEXT,
            "channel" TEXT NOT NULL DEFAULT 'EMAIL',
            "message" TEXT NOT NULL,
            "readAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "AuditLog" (
            "id" TEXT NOT NULL,
            "actorId" TEXT,
            "action" TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "entityId" TEXT,
            "metadata" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "ChatConversation" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "escalatedTicketId" TEXT,
            "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "ChatMessage" (
            "id" TEXT NOT NULL,
            "conversationId" TEXT NOT NULL,
            "sender" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute("""
        CREATE TABLE "TicketComment" (
            "id" TEXT NOT NULL,
            "ticketId" TEXT NOT NULL,
            "authorId" TEXT NOT NULL,
            "body" TEXT NOT NULL,
            "isInternal" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "requestedAt" TIMESTAMP(3),
            CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
        )
        """)

    op.execute(
        'ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" '
        'FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" '
        'FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_problemId_fkey" '
        'FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" '
        'FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "Problem" ADD CONSTRAINT "Problem_ownerId_fkey" '
        'FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" '
        'FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" '
        'FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_userId_fkey" '
        'FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_escalatedTicketId_fkey" '
        'FOREIGN KEY ("escalatedTicketId") REFERENCES "Ticket"("id") '
        'ON DELETE SET NULL ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" '
        'FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") '
        'ON DELETE RESTRICT ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" '
        'FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    )
    op.execute(
        'ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_authorId_fkey" '
        'FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "TicketComment"')
    op.execute('DROP TABLE IF EXISTS "ChatMessage"')
    op.execute('DROP TABLE IF EXISTS "ChatConversation"')
    op.execute('DROP TABLE IF EXISTS "AuditLog"')
    op.execute('DROP TABLE IF EXISTS "Notification"')
    op.execute('DROP TABLE IF EXISTS "FaqEntry"')
    op.execute('DROP TABLE IF EXISTS "Attachment"')
    op.execute('DROP TABLE IF EXISTS "Ticket"')
    op.execute('DROP TABLE IF EXISTS "Problem"')
    op.execute('DROP TABLE IF EXISTS "User"')
    op.execute('DROP TYPE IF EXISTS "TicketPriority"')
    op.execute('DROP TYPE IF EXISTS "TicketStatus"')
    op.execute('DROP TYPE IF EXISTS "Role"')
