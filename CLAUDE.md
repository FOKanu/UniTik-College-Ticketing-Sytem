# CLAUDE.md

Guidance for working in this repository.

## What this is

A university support ticketing system (chatbot front door, role-based ticket portal, AI-assisted
classification, FAQ knowledge base). **v2** uses FastAPI + SQLAlchemy/Alembic on the backend and React +
Vite + Tailwind on the frontend.

The original Express + Prisma scaffold is frozen in `archive/scaffold-v1/` (read-only).

## Commands

Root (`npm run <script>` from repo root):
- `npm run setup` — runs `scripts/setup.sh` (Python venv + pip install + frontend npm)
- `npm run dev:backend` — uvicorn with reload on :4000
- `npm run dev:frontend` — Vite dev server on :5173

Backend (from `backend/` with venv activated):
- `uvicorn app.main:app --reload --port 4000`
- `alembic upgrade head` / `alembic revision --autogenerate -m "..."`
- `python -m scripts.seed`
- `pytest`
- `ruff check app tests`

Frontend (from `frontend/`):
- `npm run dev` / `npm run build` / `npm run lint` / `npm test`

Docker: `docker compose up --build` — Postgres (pgvector), backend, frontend.

## Architecture

**Vertical slices** — only implemented domains have routers/services/pages:

| Slice | Backend | Frontend |
| --- | --- | --- |
| Auth | `app/api/v1/auth.py` | `src/modules/auth/` |
| Tickets | `app/api/v1/tickets.py` | `src/modules/tickets/` |
| Chat | `app/api/v1/chat.py` | `src/modules/chat/` |
| KB/FAQ | `app/api/v1/kb.py` | `src/modules/faq/` |

API envelope (unchanged from v1): `{ success, data }` / `{ success: false, error: { message } }`.
Frontend `src/lib/api-client.ts` expects this shape.

Access-control (NEG-4): students see only their tickets; `isInternal` comments hidden from students.

## Branching

Workstream / `feature/<area>-…` → `debugging` → `project-manager` → `main`.
See `docs/BRANCHING_STRATEGY.md` and `docs/CONTRIBUTORS.md`.

## Conventions

- Python 3.11+, ruff for lint
- TypeScript strict, ESLint + Prettier on frontend
- Schema changes only via Alembic forward migrations
- No mock success responses — unimplemented routes return 401/501 or stay unregistered
- Conventional Commits: `feat(tickets): ...`, `fix(auth): ...`
