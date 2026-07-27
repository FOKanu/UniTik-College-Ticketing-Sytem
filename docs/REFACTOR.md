# Refactor Roadmap — FastAPI v2

**Status:** Foundation complete (Stages 0–4). Feature slices 5–8 implemented.

## Archive policy

- Original scaffold: `archive/scaffold-v1/` (frozen at tag `scaffold-v1-final`)
- Never import from `archive/` at runtime
- Schema reference for Alembic port: `archive/scaffold-v1/backend/prisma/schema.prisma`

## Stages

| Stage | Status | Deliverable |
| --- | --- | --- |
| 0 | Done | Tag `scaffold-v1-final`, brand tokens committed |
| 1 | Done | Archive move |
| 2 | Done | FastAPI shell + thin React frontend |
| 3 | Done | SQLAlchemy models + Alembic baseline + Python seed |
| 4 | Done | Docker, CI, path guards, docs |
| 5 | Done | Auth — JWT login, `/auth/me`, LoginPage |
| 6 | Done | Tickets — CRUD, RBAC scoping, FE list/create |
| 7 | Done | Chat — conversations, messages, escalate-to-ticket |
| 8 | Done | KB — FAQ list/search (text fallback; vector when embeddings populated) |

## Vertical slice layout

```
backend/app/
├── api/v1/       # HTTP routers only
├── services/     # business logic
├── models/       # SQLAlchemy (database workstream)
├── schemas/      # Pydantic request/response
└── core/         # config, security, deps, responses
```

## Post-foundation work (team backlog)

- LDAP/SSO integration (OI-01)
- Real LLM + embedding pipeline for chat/KB
- Attachment upload storage
- SLA engine, notifications email dispatch
- E2E tests (Playwright)

## Laurynas review checklist (Stage 3)

- [ ] All 11 models match archived `schema.prisma`
- [ ] Enums: Role, TicketStatus, TicketPriority
- [ ] pgvector on `FaqEntry.embedding` (1536 dims)
- [ ] FK relations and `TicketComment.isInternal` (NEG-4)
