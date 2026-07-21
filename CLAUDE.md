# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **scaffold** for a university support ticketing system (chatbot front door, role-based ticket portal,
AI-assisted classification, FAQ knowledge base). Directory structure, interfaces, routes, and DTOs are in
place; business logic is intentionally `TODO` throughout so ~6 contributors can each own one vertical module
with minimal merge conflicts. Every endpoint currently returns mock data.

Two independent apps: `backend/` (Express + TypeScript + Prisma/PostgreSQL) and `frontend/` (React +
TypeScript + Vite + Tailwind), plus `shared/` for conceptually-shared types/constants (not a build-time
package — copies are kept in sync manually), `database/` for reference SQL schemas and seed data, and
`docker/` for the Compose-based dev environment.

## Commands

Root (`npm run <script>` from repo root):
- `npm run setup` — runs `scripts/setup.sh`
- `npm run dev:backend` / `npm run dev:frontend` — proxies into each app's `dev` script
- `npm run prepare` — installs Husky git hooks (pre-commit runs `lint-staged`: ESLint --fix + Prettier on
  staged files)

Backend (run from `backend/`):
- `npm run dev` — nodemon + ts-node, watches `src`
- `npm run build` / `npm start` — compile to `dist` and run
- `npm run lint` / `npm run typecheck` / `npm run format`
- `npm test` — `jest --runInBand`; `npm run test:watch` for watch mode
- Single test file: `npx jest src/app/modules/tickets/tests/tickets.service.test.ts`
- `npm run prisma:generate` / `npm run prisma:migrate` — Prisma client generation / dev migration
- `npm run seed` — runs `prisma/seed.ts`

Frontend (run from `frontend/`):
- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` / `npm run typecheck` / `npm run format`
- `npm test` — `vitest run`
- Single test file: `npx vitest run src/modules/ticket/tests/ticket.service.test.ts`

Full stack via Docker (from repo root):
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```
Backend on :4000, frontend on :5173, Postgres on :5432.

CI (`.github/workflows/`) runs lint → typecheck → test (backend also runs `prisma generate` against a
Postgres service container and `prisma:migrate` is expected before tests touch the DB); frontend CI also
runs `build`. Path-filtered: backend/frontend workflows only run when files under that app change.

## Architecture

**Modular-by-domain, not layered-by-type.** Instead of `controllers/ services/ models/` shared across
features (where every change touches the same files), each business domain is a vertical slice that owns
everything it needs. A module can be deleted or reassigned without touching anything outside its folder.
Full rationale and the requirements-to-component mapping: `docs/architecture/README.md`.

Backend modules (`backend/src/app/modules/<name>/`) — `authentication`, `users`, `tickets`, `chatbot`, `ai`,
`knowledge-base`, `notifications`, `dashboard`, `admin`, `analytics`. Frontend modules
(`frontend/src/modules/<name>/`) mirror these 1:1 by concept: `login`, `dashboard`, `ticket`, `chatbot`,
`faq`, `admin`, `notifications`, `profile`.

Every backend module has the same internal shape — **always follow this when adding or touching a module**:
```
<module>/
├── controller/   # HTTP layer only: parse request, call service, format response via ApiResponse — no business logic
├── service/      # business logic (currently TODO stubs), depends on the repository
├── repository/   # only layer allowed to import the Prisma client
├── routes/       # express Router — mounted once in backend/src/app/modules/routes.ts, never registered elsewhere
├── dto/          # request/response shapes
├── schemas/      # runtime validation (Zod), applied before requests reach the service
├── types/        # module-local TS types
├── validators/   # thin wrappers around schemas used by middleware
├── tests/        # *.test.ts, matched by jest via testMatch '**/tests/**/*.test.ts'
└── README.md     # what the module owns, its endpoints, its open TODOs
```
Frontend modules follow the same idea with `components/`, `pages/`, `hooks/`, `services/`, `types/`, `tests/`.

Key cross-cutting pieces:
- `backend/src/app/app.ts` — Express app factory: helmet → cors → json → request logger → health check →
  `moduleRoutes` mounted at `appConfig.apiPrefix` → 404 handler → global error handler (in that order).
- `backend/src/app/modules/routes.ts` — the single place every module router is mounted.
- `backend/src/app/interfaces/base-repository.interface.ts` — generic `findById/findAll/create/update/delete`
  contract every repository implements. Services currently depend on repositories by concrete class (not the
  interface) with a constructor-injected default (`constructor(private readonly repo = new XRepository())`);
  swapping to interface-typed constructor params is the intended path if a DI container is introduced later —
  no container is imposed yet.
- `backend/src/app/shared/errors/` — `AppError` subclasses (`BadRequestError`, `UnauthorizedError`,
  `ForbiddenError`, `NotFoundError`, `ConflictError`). Throw these, never `res.status(...).send(...)` inline;
  `middleware/error-handler.middleware.ts` formats every response.
- `backend/src/app/shared/response/api-response.ts` — `ApiResponse.success(res, data, status?)`; controllers
  use this instead of calling `res.json` directly. Frontend's `api-client.ts` expects this exact envelope
  shape (`{ success, data }` / `{ success: false, error: { message, details? } }`).
- `backend/src/app/middleware/auth.middleware.ts` — `requireAuth` / `requireRole(...)`. JWT verification is
  currently a stub (hardcodes `req.user`); real verification is intended to move to
  `modules/authentication/jwt/jwt.service.ts`.
- `backend/src/app/config/` — env loading/validation happens once here; nowhere else should read
  `process.env` directly.
- `backend/src/app/shared/logger/` — structured logging (pino-based); never `console.log` in committed code
  (ESLint warns on it — `warn`/`error` are allowed).
- `frontend/src/services/api-client.ts` — the only place that calls `fetch()` directly; module `services/`
  files call `apiClient.get/post/patch/delete` instead of raw fetch, so auth header injection (bearer token
  from `localStorage['uts_token']`) and error unwrapping stay centralized.
- `frontend/src/store/auth.store.tsx` — React Context-based auth/session state (token + role), not a state
  library.
- `frontend/src/app/router.tsx` — central route table; each module still owns its own `pages/`.

**Access-control rules to keep in mind when touching `tickets`, `chatbot`, or `admin`** (see
`docs/architecture/README.md` §4 for the full negative-requirement list): students must only see their own
tickets, never staff-only notes; the chatbot must never leak another user's ticket contents; AI
classification may route/categorize but must never make the final call on sensitive matters (grade changes,
exam outcomes) — a human must decide.

`authentication/ldap/` and any future person-data integration client are stubbed pending unresolved
questions with university IT about the external SSO/LDAP interface (tracked as OI-01 in the architecture
doc) — don't build other modules to depend on them yet.

## Conventions

- TypeScript everywhere, `strict: true`, no implicit `any` (ESLint warns on explicit `any` too — needs a
  `// TODO` justification if unavoidable).
- One default export per controller/service/repository file, named the same as the file.
- Every request body is validated against a `schemas/` entry before it reaches the service layer.
- Unit-test services/repositories with mocked dependencies; route/integration tests are scaffolded but not
  required to assert much yet since business logic is still `TODO` — CI runs `--passWithNoTests`.
- Conventional Commits, scoped by module: `feat(tickets): ...`, `fix(auth): ...`. Full type/scope list in
  `docs/COMMIT_CONVENTIONS.md`.
- Branching: `main` (protected) ← `develop` ← `feature/<module>-<short-description>`; `hotfix/*` branches
  from `main`. Never commit directly to `main` or `develop`. Details in `docs/BRANCHING_STRATEGY.md`.
- One module/feature per PR where possible; PR description states the module, requirement ID(s) addressed
  (see the requirements-to-component table in `docs/architecture/README.md`), and what's still TODO.
- Don't bypass the Husky pre-commit hook (`--no-verify`) except in a genuine emergency, and say so in the PR.
