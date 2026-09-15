# Contributors & Ownership

Role and workstream assignments for the university support ticketing system. Derived from the team
[Granular Implementation Plan](https://miro.com/app/board/uXjVH6FYl_M=/?moveToWidget=3458764678540299217&cot=14)
(local reference export: `Granular-Implementation-Plan.md`). Aligns with the gated git flow in
[`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md): workstream → `debugging` → `project-manager` → `main`.

Statuses in the Miro plan are the live source of truth for task progress; this doc is the **people map**.

---

## Roster

| Name | GitHub | Primary focus | Also contributes to |
| --- | --- | --- | --- |
| **Francis Kanu** | [@FOKanu](https://github.com/FOKanu) | Project Manager and Lead Engineer; AI/RAG LLM + chatbot; Tooling/DevOps | Frontend design system / API client / chat UI; chat schema; git gates |
| **Milena** | *TBD* | Frontend (student portal, design system) | Auth pages; notifications UI; file storage (with Laurynas); FE lint tooling |
| **Alen** | *TBD* | Frontend (student portal, design system) | Auth guard (with Kinga); state management; a11y / responsive |
| **Shahnas** | *TBD* | Frontend (staff / admin); Backend tickets & SLA | Departments router; notifications; SLA breach views |
| **Arshdeep** | *TBD* | Frontend (staff / admin) | Staff queue, ticket actions, admin analytics UI |
| **Kinga** | *TBD* | Backend auth, JWT, RBAC | Auth pages / guards (FE); users router; secrets; auth security tests |
| **Laurynas Stravinskas** | [@Laurynas36](https://github.com/Laurynas36) | **Database (lead)**; Backend ticket routing & engines | Departments / tickets / SLA; migrations; seed (with Khan) |
| **Izzatkhanim Yashar (Izzy)** | [@rzaest](https://github.com/rzaest) | Knowledge base; **AI/RAG** retrieval | KB routers & schema; FAQ UI (with Francis); RAG debug views |
| **Agrima** | *TBD* | Knowledge base; AI/RAG ingestion | Chunking, embedding upsert, re-ranking |
| **Yegor Gariazha** | [@GariazhaYegor](https://github.com/GariazhaYegor) | **AI/RAG** embeddings & search | Embedding model config; similarity search |
| **Khan** | *TBD* | Testing & QA lead | E2E / integration / RAG quality tests; seed data; merge conflict support |
| **Shahriar** | *TBD* | Testing (E2E, load) | Critical-path Playwright/Cypress; load tests |
| **Anmol** | *TBD* | Testing (API integration) | Backend integration tests |
| **Vivek** | *TBD* | Debugging / observability; logging | Structured logs; Sentry; API contract tests; correlation IDs |
| **Adrian** | *TBD* | Debugging / observability | Tracing, health checks, LLM cost views, debug admin UIs; git control |
| **Sunil** | *TBD* | Debugging / monitoring | Uptime checks; OpenTelemetry (with Adrian) |

`TBD` GitHub usernames: send invite by email and/or reply with `@username` so we can update [`.github/CODEOWNERS`](../.github/CODEOWNERS).

---

## Ownership by workstream (git branch)

Maps people to the long-lived branches in [`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md).

| Workstream branch | Primary owners | Typical scope |
| --- | --- | --- |
| `frontend` | Milena, Alen, Shahnas, Arshdeep, Francis | Pages, components, auth UX, chatbot UI, FE a11y |
| `backend` | Kinga, Laurynas, Shahnas, Francis, Izzy, Agrima | Routers, middleware, engines, chat/KB APIs |
| `database` | **Laurynas (@Laurynas36)** (lead); Kinga, Izzy, Francis, Khan | ERD, Prisma/migrations, seed, vector index schema |
| `ai-rag` | Francis (@FOKanu), **Izzy (@rzaest)**, Agrima, **Yegor (@GariazhaYegor)** | Chunking, embeddings, retrieval, prompts, LLM, escalation |
| `tooling-devops` | Francis (lead); Kinga, Milena, Alen, Vivek, Adrian, Sunil | Branching, CI/CD, Docker, secrets, lint, monitoring |
| `testing` | Khan (lead); Shahriar, Anmol, Vivek; + feature owners | Unit, component, E2E, integration, RAG/security tests |
| `debugging` | Adrian, Vivek, Sunil, Khan, Francis | QA integration gate; observability; conflict resolution |
| `project-manager` → `main` | Francis (PM) | Acceptance and release to `main` |

---

## Gate roles (merge path)

```
Developer (workstream / feature/*)
        →  Debugging / Testing   (Khan, Adrian, Vivek, Shahriar, Anmol, Sunil, Francis)
        →  Project Manager       (Francis)
        →  main
```

| Gate | Responsible | Responsibility |
| --- | --- | --- |
| PR into `debugging` | Testing & Debugging | CI green, smoke/regression, block incomplete work |
| PR into `project-manager` | Francis (PM) + Debugging sign-off | Demo readiness, scope, docs |
| PR into `main` | Francis (PM) | Final merge only from `project-manager` |

---

## Layer summary (from granular plan)

### Frontend

| Area | Owners |
| --- | --- |
| Layout, design system, student flows | Milena, Alen (+ Francis on shared foundations) |
| Staff / admin UI | Shahnas, Arshdeep |
| Auth pages & guards | Milena, Kinga, Alen |
| Chatbot widget & `/chatbot` | Francis |
| FAQ / KB browser | Francis, Izzy |
| Notifications UI | Milena, Shahnas |

### Backend

| Area | Owners |
| --- | --- |
| Auth, JWT, RBAC, users | Kinga |
| Tickets, departments, routing, SLA | Laurynas, Shahnas |
| Notifications | Shahnas (+ TBD) |
| Knowledge base API | Izzy, Agrima |
| Chat / RAG orchestration APIs | Francis (+ Izzy) |
| KB ingestion pipeline | Izzy, Agrima, Yegor |
| Background jobs / attachments | Laurynas (+ Milena for storage) |

### Database

| Area | Owners |
| --- | --- |
| ERD, core schemas, migrations, indexes | Laurynas |
| Users/roles with auth | Laurynas, Kinga |
| KB + vector sync | Laurynas, Izzy |
| Chat / conversation schema | Francis, Laurynas |
| Seed data | Laurynas, Khan |
| Backup policy | Francis, Laurynas |

### AI / RAG

| Area | Owners |
| --- | --- |
| Chunking, embeddings, retrieval, re-rank | Izzy, Agrima, Yegor |
| Prompts, LLM client, streaming, context | Francis (+ Izzy) |
| Escalation to ticket | Francis, Laurynas |
| Safety, feedback, Q&A set, cost tracking | Francis, Izzy, Khan, Adrian |

### Tooling / DevOps

| Area | Owners |
| --- | --- |
| Git strategy, CI/CD, Docker, hosting | Francis (+ Khan on branching) |
| Secrets | Kinga |
| FE lint/format | Milena, Alen |
| BE lint/types (when Python stack applies) | Laurynas, Kinga |
| Logging, Sentry, uptime, LLM cost UI | Vivek, Adrian, Sunil, Francis |

### Testing

| Area | Owners |
| --- | --- |
| Frontend unit / component | Milena, Alen, Khan |
| E2E & load | Khan, Shahriar |
| Backend unit / integration / contracts | Laurynas, Kinga, Khan, Anmol, Vivek |
| RAG quality & prompt regression | Izzy, Francis, Khan |
| RBAC / auth security / vulns | Kinga, Khan |

### Debugging / observability

| Area | Owners |
| --- | --- |
| Correlation IDs, Sentry aggregation | Vivek, Adrian |
| OpenTelemetry, uptime | Adrian, Sunil |
| Chat / RAG / jobs / SLA debug UIs | Francis, Izzy, Laurynas, Shahnas, Adrian |
| Git control & merge conflicts | Francis, Adrian, Khan |

---

## How to use this doc

1. **Claim work** on the Miro/board task; keep owners in sync here when roles change.
2. **Open PRs** into the matching workstream or `feature/<area>-…`, then into `debugging` — see
   [`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md).
3. **Cross-cutting changes** (e.g. ticket API + UI) need a named owner from each workstream and still
   pass Debugging → PM → `main`.
4. Do not treat this file as a task tracker; update **Status** on the granular plan / board.

## Related docs

- [`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md) — branch gates and PR flow
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — how to contribute day to day
- [`architecture/README.md`](architecture/README.md) — modules and requirements mapping
