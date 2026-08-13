"""Add Department entity and Ticket.classificationSource.

Replaces free-text User.department / Ticket.department with FK to Department.
Migrates existing string labels into Department rows when present.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "005_department_entity"
down_revision: str | Sequence[str] | None = "004_notification_title"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "Department",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("createdAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.add_column("User", sa.Column("departmentId", sa.String(), nullable=True))
    op.add_column("Ticket", sa.Column("departmentId", sa.String(), nullable=True))
    op.add_column("Ticket", sa.Column("classificationSource", sa.String(), nullable=True))

    conn = op.get_bind()
    labels = {
        row[0]
        for row in conn.execute(
            sa.text(
                """
                SELECT DISTINCT trim(department) FROM "User"
                WHERE department IS NOT NULL AND trim(department) <> ''
                UNION
                SELECT DISTINCT trim(department) FROM "Ticket"
                WHERE department IS NOT NULL AND trim(department) <> ''
                """
            )
        )
    }
    for name in sorted(labels):
        conn.execute(
            sa.text(
                'INSERT INTO "Department" (id, name, "createdAt") '
                "VALUES (:id, :name, now())"
            ),
            {"id": str(uuid.uuid4()), "name": name},
        )

    conn.execute(
        sa.text(
            """
            UPDATE "User" u
            SET "departmentId" = d.id
            FROM "Department" d
            WHERE u.department IS NOT NULL AND trim(u.department) = d.name
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE "Ticket" t
            SET "departmentId" = d.id
            FROM "Department" d
            WHERE t.department IS NOT NULL AND trim(t.department) = d.name
            """
        )
    )

    op.create_foreign_key(
        "User_departmentId_fkey", "User", "Department", ["departmentId"], ["id"]
    )
    op.create_foreign_key(
        "Ticket_departmentId_fkey", "Ticket", "Department", ["departmentId"], ["id"]
    )
    op.drop_column("User", "department")
    op.drop_column("Ticket", "department")


def downgrade() -> None:
    op.add_column("Ticket", sa.Column("department", sa.String(), nullable=True))
    op.add_column("User", sa.Column("department", sa.String(), nullable=True))

    op.execute(
        """
        UPDATE "User" u
        SET department = d.name
        FROM "Department" d
        WHERE u."departmentId" = d.id
        """
    )
    op.execute(
        """
        UPDATE "Ticket" t
        SET department = d.name
        FROM "Department" d
        WHERE t."departmentId" = d.id
        """
    )

    op.drop_constraint("Ticket_departmentId_fkey", "Ticket", type_="foreignkey")
    op.drop_constraint("User_departmentId_fkey", "User", type_="foreignkey")
    op.drop_column("Ticket", "classificationSource")
    op.drop_column("Ticket", "departmentId")
    op.drop_column("User", "departmentId")
    op.drop_table("Department")
