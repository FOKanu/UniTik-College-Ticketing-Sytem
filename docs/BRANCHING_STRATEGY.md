# Branching Strategy

**Updated 2026-07-23:** `main` is no longer the direct merge target for feature work. All changes pass
through a **Debugging** gate, then **Project Manager** acceptance, before landing on `main`.

Earlier PRs (`feature/database-schema-and-tickets-repository`, `feature/knowledge-base-pgvector-prep`,
`feature/chat-and-ticket-comments`) merged straight into `main`. New work must follow the flow below.

## Branch layout

### Protected / long-lived gates

| Branch | Purpose | Who merges in |
| --- | --- | --- |
| `main` | Always deployable / demo-ready. No direct commits. | Project Manager only (from `project-manager`) |
| `project-manager` | Release candidate / PM acceptance | PM after Debugging sign-off |
| `debugging` | QA, regression, and bugfix integration | Testing & Debugging team |

### Workstream branches

| Branch | Area |
| --- | --- |
| `frontend` | Client, portal, chatbot UI |
| `backend` | API, services, auth, tickets, etc. |
| `database` | Prisma schema, migrations, seed |
| `ai-rag` | LLM, embeddings, RAG / retrieval |
| `tooling-devops` | CI, Docker, scripts, hooks, infra |
| `testing` | Test suites, fixtures, QA harness |

### Short-lived task branches (recommended)

Daily work should use small branches off the relevant workstream (or off `debugging` if fixing a gate bug):

```
feature/<area>-<short-description>
```

Examples: `feature/frontend-login-page`, `feature/database-attachment-indexes`,
`feature/ai-rag-faq-retrieve`.

`hotfix/*` may branch from `main` for urgent demo/production fixes, but still prefer
`hotfix/*` → `debugging` → `project-manager` → `main` unless PM explicitly allows a fast path.

## Required flow

**Nothing reaches `main` without first passing Debugging, then Project Manager.**

```
workstream / feature/<area>-…
        ↓
   PR → debugging          (QA + Debugging review, CI green)
        ↓
   PR → project-manager    (PM acceptance)
        ↓
   PR → main               (PM merge only)
```

```
                    ┌─────────────┐
                    │    main     │
                    └──────▲──────┘
                           │ PM approve
                    ┌──────┴──────┐
                    │project-manager│
                    └──────▲──────┘
                           │ QA / debug sign-off
                    ┌──────┴──────┐
                    │  debugging  │
                    └──────▲──────┘
           ┌───────────┬───┴───┬───────────┬────────────┐
           │           │       │           │            │
      frontend    backend  database    ai-rag   tooling-devops
                                                    testing
```

### Sequence

1. Developer commits on a workstream branch (or `feature/<area>-…`).
2. Open a PR **into `debugging`**. Testing & Debugging runs tests, smoke checks, and fixes (or sends
   blockers back to the author).
3. When `debugging` is healthy for that change set, open a PR **`debugging` → `project-manager`**.
4. Project Manager reviews scope, demo readiness, and docs, then opens/approves PR
   **`project-manager` → `main`**.

Skip none of these gates for normal work.

## Rules

1. **`main` is protected.** No direct pushes. Only merges from `project-manager`.
2. **`debugging` and `project-manager` are protected.** No direct pushes from feature authors; use PRs.
3. Prefer **small, reviewable** `feature/<area>-…` branches over dumping weeks of work from a workstream
   branch in one PR into `debugging`.
4. **Database migrations** must stay linear: coordinate so only one migration PR is in flight into
   `debugging` at a time.
5. After each merge to `main`, **sync workstream branches**: merge `main` back into `frontend`,
   `backend`, `database`, `ai-rag`, `tooling-devops`, and `testing` to limit drift.
6. Tag milestones on `main` as they land, e.g. `v0.1-auth`, `v0.2-ticket-crud`, `v0.3-ai-chat`.
7. Cross-area work (e.g. ticket API + UI) uses separate PRs into `debugging` where possible, or one
   coordinated PR with a clear owner and checklist — still through Debugging → PM → `main`.

## GitHub protection (recommended)

| Branch | Required reviewers | CI |
| --- | --- | --- |
| `debugging` | ≥1 from Testing / Debugging | lint + typecheck + test must pass |
| `project-manager` | Project Manager (or delegate) | CI green on the PR |
| `main` | Project Manager | CI green; optional status checks matching demo |

Update `.github/workflows/*` branch filters to include `debugging` and `project-manager` (not only
`main`) so gates fail closed before PM merge.

## Suggested board columns

`Backlog → Sprint Ready → In Progress → Debugging → PM Review → Done (on main)`

Label issues by workstream: `frontend`, `backend`, `database`, `ai-rag`, `tooling-devops`, `testing`,
plus module labels (`tickets`, `chatbot`, `authentication`, …) as needed.

## Ownership (gate roles)

| Role | Gate responsibility |
| --- | --- |
| Developers (per workstream) | Land work via PR into `debugging` |
| Testing & Debugging | Own `debugging`; verify quality; block bad merges |
| Project Manager | Own `project-manager` → `main`; release / demo acceptance |

Named owners per workstream and layer: [`CONTRIBUTORS.md`](CONTRIBUTORS.md).
