# University Support Ticketing System

A self-hosted, privacy-compliant support ticketing platform for universities, with a chatbot front door,
role-based access (Student / Staff / Admin), AI-assisted classification, and an FAQ knowledge base.

This repository is a **scaffold**. Directory structure, interfaces, and placeholder endpoints are in place so
that six-plus contributors can build out one module each with minimal merge conflicts. Business logic is
intentionally left as `TODO` — see `CONTRIBUTING.md` before you start.

## Why this structure

Instead of one shared `controllers/ services/ models/` tree (where every feature touches the same files and
every PR collides), the backend and frontend are both organized **by business domain**. Each module
(`authentication`, `tickets`, `chatbot`, `ai`, `knowledge-base`, `notifications`, `dashboard`, `admin`,
`analytics`, `users`) owns its own controller, service, repository, routes, DTOs, schemas, validators, tests,
and README. Nobody needs to touch another module's files to ship their feature.

See `docs/architecture/README.md` for the full rationale and the requirements-to-component mapping.

## Repository layout

```
university-ticketing-system/
├── docs/                  # architecture, branching, coding standards, setup
├── backend/               # Node.js + Express + TypeScript API (modular by domain)
├── frontend/               # React + TypeScript + Vite + Tailwind SPA (mirrors backend modules)
├── shared/                # cross-cutting TS types/constants shared conceptually by both apps
├── database/              # Prisma migrations, seed data, reference SQL schemas per domain
├── docker/                # Dockerfiles + Postgres init scripts
├── .github/               # CI workflows, PR/issue templates
└── scripts/               # setup / seed helper scripts
```

## Quick start

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Backend API: http://localhost:4000
Frontend: http://localhost:5173

See `docs/SETUP_INSTRUCTIONS.md` for local (non-Docker) setup, and `CONTRIBUTING.md` for how to pick up a
module.

## Status

Scaffold only. Every endpoint returns a mock response. Every module has `TODO` markers where real business
logic, validation, and persistence need to be implemented. Authentication is wired up structurally
(JWT + role guard) but LDAP/SSO integration is stubbed pending confirmation from university IT (see
`docs/architecture/README.md`, Open Issue OI-01).
