# Setup Instructions

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose (recommended)
- PostgreSQL 16 with pgvector (only if running without Docker)

## Option A — Docker Compose (recommended)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Backend API: http://localhost:4000 (OpenAPI docs at `/docs`)
- Frontend: http://localhost:5173
- Postgres: localhost:5432

## Option B — Run locally without Docker

### One-time setup

```bash
./scripts/setup.sh
```

### Database

```bash
createdb university_ticketing
# pgvector extension is created by Alembic baseline migration
```

### Backend

```bash
cd backend
cp .env.example .env
source .venv/bin/activate   # created by setup.sh
pip install -e ".[dev]"
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --port 4000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Git hooks

```bash
npm install
npm run prepare
```

Pre-commit runs `lint-staged` (ruff on Python, ESLint on TypeScript).

## Running tests

```bash
cd backend && pytest
cd frontend && npm test
```

## Demo credentials

After seeding, all demo users share password: `demo1234`

Example student: `jordan.alvarez@student.university.edu`

## Archive

The original Express + Prisma scaffold lives in `archive/scaffold-v1/` (read-only reference).
