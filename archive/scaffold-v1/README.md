# ARCHIVE — Scaffold v1 (frozen 2026-07-27)

**Read-only reference. Do not import modules from here into active `backend/` or `frontend/`.**

This directory preserves the original Express + TypeScript + Prisma scaffold and the React module tree
from before the FastAPI hybrid refactor.

## What is preserved

- Module layout ideas, mock DTOs, test scaffolds, and route structure
- Prisma schema, migrations, and seed script (reference for Alembic port)
- Full frontend module tree (login, tickets, chatbot, etc.)

## What superseded this

Active implementation lives at the repository root:

- `backend/` — FastAPI + SQLAlchemy + Alembic
- `frontend/` — thin React shell, vertical slices added incrementally

Database truth for the new stack: `backend/alembic/` and `backend/app/models/` at repo root.

## Tag

Frozen at git tag `scaffold-v1-final` on `main` before the refactor.
