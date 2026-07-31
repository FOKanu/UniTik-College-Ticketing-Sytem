"""add department entity and ticket classification source

Revision ID: fffe04d93947
Revises: 001_baseline
Create Date: 2026-07-31 11:08:35.733458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fffe04d93947'
down_revision: Union[str, Sequence[str], None] = '001_baseline'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "Department",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("createdAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.add_column("User", sa.Column("departmentId", sa.String(), nullable=True))
    op.create_foreign_key(
        "User_departmentId_fkey", "User", "Department", ["departmentId"], ["id"]
    )
    op.drop_column("User", "department")

    op.add_column("Ticket", sa.Column("departmentId", sa.String(), nullable=True))
    op.add_column("Ticket", sa.Column("classificationSource", sa.String(), nullable=True))
    op.create_foreign_key(
        "Ticket_departmentId_fkey", "Ticket", "Department", ["departmentId"], ["id"]
    )
    op.drop_column("Ticket", "department")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column("Ticket", sa.Column("department", sa.String(), nullable=True))
    op.drop_constraint("Ticket_departmentId_fkey", "Ticket", type_="foreignkey")
    op.drop_column("Ticket", "classificationSource")
    op.drop_column("Ticket", "departmentId")

    op.add_column("User", sa.Column("department", sa.String(), nullable=True))
    op.drop_constraint("User_departmentId_fkey", "User", type_="foreignkey")
    op.drop_column("User", "departmentId")

    op.drop_table("Department")
