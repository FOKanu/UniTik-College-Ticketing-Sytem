# Contributing

This project is built by a team where **each person (or pair) owns one module** — not one shared file tree.
Read this before writing any code.

## 1. Pick a module, not a file

Backend modules live in `backend/src/app/modules/<module>/`. Frontend modules live in
`frontend/src/modules/<module>/`. Claim one in the team board (see `docs/architecture/README.md` for the
module list and what each owns) and work inside it. Only touch `shared/`, `backend/src/app/shared`, or another
module's folder if you're fixing something genuinely cross-cutting — and flag it in the PR description.

## 2. Branching strategy

```
main        → always deployable, protected, no direct commits
develop     → integration branch, all feature branches merge here first
feature/*   → one per module or task, branched from develop
hotfix/*    → urgent fixes branched from main
```

Naming: `feature/<module>-<short-description>`, e.g. `feature/tickets-crud-endpoints`,
`feature/chatbot-intent-service`.

Flow: `feature/*` → PR into `develop` → review → merge → periodic release PR `develop` → `main`.

Never commit directly to `main` or `develop`.

## 3. Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<module>): <short summary>

feat(tickets): add ticket creation endpoint
fix(auth): correct role guard precedence
chore(repo): configure husky pre-commit hook
docs(architecture): document AI escalation boundary
test(chatbot): add intent service unit tests
refactor(users): extract base repository usage
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Scope = the module name where possible.

## 4. Coding standards

See `docs/CODING_STANDARDS.md`. In short: TypeScript everywhere, strict mode on, ESLint + Prettier enforced
via Husky pre-commit hooks (`lint-staged`), no `any` without a `// TODO` justification, one export per
controller/service/repository file, DTOs and Zod/Joi schemas required for every request body.

## 5. Module contract

Every backend module must contain:

```
<module>/
├── controller/      # HTTP layer only — no business logic
├── service/         # business logic — currently TODO stubs
├── repository/      # data access, implements a repository interface
├── routes/          # express Router, mounted once in backend/src/app/modules/routes index
├── dto/             # request/response shape types
├── schemas/         # runtime validation schemas
├── types/           # module-local TypeScript types
├── validators/      # thin wrappers around schemas used by middleware
├── tests/           # unit/integration tests
└── README.md        # what this module owns, its endpoints, its TODOs
```

Frontend modules mirror this with `components/`, `pages/`, `hooks/`, `services/`, `types/`, `tests/`.

## 6. Pull requests

- One module/feature per PR where possible.
- PR description must state: what module, what requirement ID(s) it addresses (see
  `docs/architecture/README.md` requirements-to-component mapping), and what's still TODO.
- At least one reviewer approval required before merging into `develop`.
- CI (lint + typecheck + test) must pass — see `.github/workflows/`.

## 7. Getting started

See `docs/SETUP_INSTRUCTIONS.md`.
