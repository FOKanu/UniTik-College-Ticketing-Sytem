# College Ticketing System — Technical Implementation Outline

Stack assumed: React/Next.js frontend, Python/FastAPI backend, PostgreSQL (relational) + a dedicated vector DB (Pinecone/Weaviate/Qdrant) for RAG, hosted LLM API. Organized by layer so each section can be assigned to an owner or sub-team.

---

## 1. Frontend

**Foundations**
- Project scaffold (Next.js or Vite+React), routing, environment config (`.env` per stage)
- Design system: component library base (shadcn/Tailwind or MUI), design tokens, responsive breakpoints
- Auth guard / role-based route protection, session persistence (httpOnly cookie or token refresh)
- API client layer: typed request wrappers per domain (`ticketApi`, `chatApi`, `kbApi`, `notificationApi`)
- State/data layer: React Query (server state) + Zustand/Context (UI state)
- Real-time layer: WebSocket or SSE client for ticket status updates and chat streaming

**Feature modules** (from prior pages/components outline)
- Auth pages, Student pages, Staff pages, shared ticket components, chatbot widget, notifications, KB pages

**Cross-cutting**
- Form validation (Zod/React Hook Form)
- Error boundaries + fallback UI
- Accessibility pass (keyboard nav, ARIA on chat + tables)
- Mobile-responsive pass (student flows prioritized for mobile)

---

## 2. Backend (Python/FastAPI)

**API layer** — one router module per domain:
- `auth` — login, register, refresh token, password reset, (optional) university SSO/LDAP
- `users` — profile CRUD, role assignment
- `departments` — Academics/IT/Finance/Maintenance config
- `tickets` — CRUD, status transitions, assignment, comments, attachments
- `notifications` — fetch, mark read
- `kb` — article CRUD, publish workflow
- `chat` — conversation CRUD, message send/stream, escalate-to-ticket

**Service/business logic layer** (kept separate from routers for testability)
- Ticket routing/assignment engine (rule-based or round-robin by department + load)
- SLA engine — deadline calculation, breach detection, escalation triggers
- Notification dispatcher (in-app + email)
- RAG orchestration service — coordinates embedding query → vector search → prompt construction → LLM call → response streaming
- KB ingestion pipeline — chunking, embedding, upsert to vector DB, triggered on publish/update

**Platform concerns**
- AuthN/AuthZ: JWT (access + refresh), RBAC middleware/dependency, permission checks per endpoint
- Background jobs: Celery or RQ + Redis — embedding generation, email sending, SLA breach sweeps, scheduled reports
- File storage: attachment upload/download (S3-compatible or MinIO for local/dev)
- API docs: FastAPI auto-generated OpenAPI/Swagger, kept in sync with router schemas (Pydantic models)
- Rate limiting on chat endpoint (protect LLM cost/abuse)

---

## 3. Database

**PostgreSQL — core schema**
- `users`, `roles`, `departments`
- `tickets`, `ticket_status_history`, `ticket_comments`, `ticket_attachments`
- `sla_rules`
- `notifications`
- `kb_articles`, `kb_article_versions`
- `chat_conversations`, `chat_messages`
- `audit_log`

**Tasks**
- ER diagram + schema review before migration
- Migration tooling: Alembic, versioned + reversible migrations
- Indexing plan (status/department/assignee for queue queries; full-text search on tickets/articles if not delegated to vector DB)
- Seed/fixture data for dev + demo
- Backup/retention policy (esp. audit log, chat history)

**Vector DB (Pinecone/Weaviate/Qdrant)**
- Index schema: KB article chunks with metadata (department, article_id, version)
- Sync strategy with Postgres (KB article is source of truth; vector DB is a derived index — reindex job on publish/update/delete)
- Namespace/partitioning by department if retrieval needs to be scoped

---

## 4. AI Chat / LLM / RAG Pipeline

**Ingestion**
- Chunking strategy for KB articles (size, overlap)
- Embedding model selection + client (consistent model for ingestion and query time)
- Upsert pipeline with retry/idempotency; reindex triggers wired to KB publish events

**Retrieval**
- Query embedding → similarity search (top-k) → optional department/category filter
- Re-ranking step (optional, if retrieval quality needs improvement)

**Generation**
- Prompt template design: system prompt, retrieved-context injection, citation formatting, refusal behavior when no relevant context found
- LLM provider client (hosted API), streaming response support to frontend
- Conversation/session context handling (window size, summarization for long chats)

**Escalation & guardrails**
- Confidence/relevance threshold → offer "create a ticket from this conversation"
- Content filtering, PII handling policy
- Feedback capture (thumbs up/down) on chatbot answers → feeds KB-gap analysis for staff

**Evaluation**
- Curated Q&A regression set to catch prompt/retrieval regressions
- Manual review workflow for low-confidence or escalated conversations
- Cost/latency tracking per conversation

---

## 5. Tooling & DevOps

- Git branching strategy + PR review process
- CI pipeline (GitHub Actions): lint → type-check → test → build, on every PR
- CD pipeline: staged deploy (dev → staging → prod), migrations run as part of deploy
- Containerization: Dockerfiles for frontend/backend, `docker-compose` for local dev (Postgres, Redis, vector DB emulator, backend, frontend)
- Secrets management: `.env` for local, secret manager for staging/prod (avoid committing LLM/API keys)
- Hosting/infra decision: cloud provider, target platform (e.g., managed containers vs. VM vs. university infra)
- Code quality: ESLint/Prettier (frontend), Ruff/Black + mypy or Pydantic strict mode (backend)
- Monitoring: structured logging, Sentry (frontend + backend), uptime checks, LLM usage/cost dashboard

---

## 6. Testing

- **Frontend**: unit (Jest/Vitest + React Testing Library), component tests for shared ticket/chat components, e2e (Playwright/Cypress) for core flows (create ticket, resolve ticket, chat escalation)
- **Backend**: unit tests (pytest) per service, integration tests against a test DB, API contract tests against OpenAPI schema
- **AI/RAG**: retrieval accuracy tests (does top-k contain the right article), prompt regression tests against the curated Q&A set, latency benchmarks
- **Load/performance**: queue behavior under concurrent ticket volume, chatbot under concurrent sessions (k6/Locust)
- **Security**: RBAC boundary tests (student can't hit agent-only endpoints), dependency vulnerability scans (`npm audit`, `pip-audit`), auth flow penetration pass

---

## 7. Debugging & Observability

- Correlation/request IDs threaded through frontend → backend → LLM calls, so a single chat or ticket action can be traced end to end
- Centralized error tracking (Sentry) for both frontend and backend
- Tracing (OpenTelemetry) around the RAG pipeline specifically — embedding time, vector search time, LLM response time, so slow chat responses are diagnosable
- Internal debug/admin view: inspect raw chatbot conversations, retrieval hits/misses, failed background jobs, SLA breach queue

---

## 8. Suggested Ownership Split

| Area | Primary focus |
|---|---|
| Frontend | Pages/components, state layer, chat UI, accessibility |
| Backend | API routers, business logic services, auth/RBAC, background jobs |
| Database | Schema design, migrations, indexing, backup policy |
| AI/RAG | Ingestion pipeline, retrieval tuning, prompt design, evaluation |
| DevOps/Tooling | CI/CD, containerization, hosting, monitoring |
| QA | Test suites across layers, load testing, security checks |

These can map to individuals or pairs depending on team size — the boundaries above are drawn so each area has a clean interface (API contracts, DB schema, vector index schema) to hand off against.
