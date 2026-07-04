# Coding Standards

## General

- TypeScript everywhere, `strict: true`. No implicit `any`.
- One default export per controller/service/repository file, named the same as the file.
- Business logic never lives in controllers — controllers parse/validate input, call a service, format the
  response via the shared `ApiResponse` helper.
- Business logic never lives in `shared/` — if it's domain-specific, it belongs in a module.
- Every new module ships with: interfaces first, TODO-stubbed implementation, at least one test file, and a
  README describing its endpoints and open TODOs.

## Backend

- Express routers are mounted per-module and combined once in `backend/src/app/modules/routes.ts` — never
  register routes ad hoc elsewhere.
- Repositories are the only layer allowed to import the Prisma client.
- Services depend on repository **interfaces**, not concrete classes, so they can be unit tested with mocks.
- All request bodies are validated against a schema in `schemas/` before reaching the service layer.
- Errors are thrown as `AppError` subclasses (`shared/errors`) and handled centrally — never
  `res.status(500).send(...)` inline.
- Log through `shared/logger`, include a request ID where available. Never `console.log` in committed code.

## Frontend

- Function components + hooks only. No class components.
- Each module's API calls live in that module's `services/` folder and go through the shared
  `services/api-client.ts` (never raw `fetch` in components).
- Shared, reusable UI primitives (buttons, inputs, modals) live in `src/components`; module-specific UI lives
  inside the module.
- Co-locate types with the module in `types/`; only cross-module types live in `shared/types`.

## Testing

- Unit test services and repositories with mocked dependencies.
- Integration test routes with a test database (or mocked Prisma client) — scaffolded, not required to pass
  meaningfully yet since business logic is still `TODO`.

## Linting/formatting

- ESLint + Prettier are the source of truth; do not hand-format against them.
- Husky's pre-commit hook runs `lint-staged`, which runs ESLint --fix and Prettier on staged files. Do not
  bypass with `--no-verify` except in a genuine emergency, and say so in the PR.
