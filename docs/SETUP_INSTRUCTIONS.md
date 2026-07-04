# Setup Instructions

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (recommended path)
- PostgreSQL 16 (only if running without Docker)

## Option A — Docker Compose (recommended)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

This starts Postgres, the backend API (http://localhost:4000), and the frontend dev server
(http://localhost:5173).

## Option B — Run locally without Docker

### Database

```bash
# using your local Postgres
createdb university_ticketing
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Git hooks

From the repo root:

```bash
npm install
npm run prepare   # installs Husky hooks
```

This wires up the pre-commit hook that runs `lint-staged` (ESLint + Prettier on staged files).

## Running tests

```bash
cd backend && npm test
cd frontend && npm test
```

## Seeding placeholder data

```bash
cd backend
npm run seed
```

See `database/seed/` for the placeholder seed script.
