# University Support Ticketing System

> **v2 — FastAPI implementation.** The original Express + Prisma scaffold is frozen in
> [`archive/scaffold-v1/`](archive/scaffold-v1/) (tag: `scaffold-v1-final`). Do not import from the archive
> into active code.

A self-hosted, privacy-compliant support ticketing platform for universities, with a chatbot front door,
role-based access (Student / Staff / Admin), AI-assisted classification, and an FAQ knowledge base.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | FastAPI, SQLAlchemy 2 (async), Alembic, PostgreSQL + pgvector |
| Frontend | React, TypeScript, Vite, Tailwind |
| Process | Gated git flow — see [`docs/BRANCHING_STRATEGY.md`](docs/BRANCHING_STRATEGY.md) |

## Repository layout

```
university-ticketing-system/
├── backend/               # FastAPI API (vertical slices: auth → tickets → chat → kb)
├── frontend/              # React SPA
├── docs/                  # architecture, branching, design tokens, refactor roadmap
├── archive/scaffold-v1/   # READ-ONLY frozen Express/Prisma scaffold
├── docker/                # Dockerfiles + Postgres init scripts
├── .github/               # CI workflows, CODEOWNERS
└── scripts/               # setup, path guards, seed helpers
```

## Quick start

```bash
./scripts/setup.sh
docker compose up --build
```

Backend API: http://localhost:4000 (OpenAPI docs at `/docs`)
Frontend: http://localhost:5173

See [`docs/SETUP_INSTRUCTIONS.md`](docs/SETUP_INSTRUCTIONS.md) for local setup,
[`docs/REFACTOR.md`](docs/REFACTOR.md) for the implementation roadmap,
[`docs/CONTRIBUTORS.md`](docs/CONTRIBUTORS.md) for team ownership.

## Status

Foundation refactor complete. Scarfolding and legacy codebase archived. New Vertical feature slice approach adobted for incremental build — see `docs/REFACTOR.md`.
