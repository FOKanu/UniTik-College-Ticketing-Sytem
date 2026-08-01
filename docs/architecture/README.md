# Architecture

Derived from `REQUIREMENTS 1.0` and the initial `system_design` pass. This is a scaffold-stage document —
update it as modules are implemented and as Open Issues OI-01 / OI-02 are resolved with IT.

## 1. Layered overview

```
                 Students / Staff / Admins / Support Agents
                                  │
                 ┌────────────────┴─────────────────┐
                 │            Client layer            │
                 │   Chatbot (widget)  |  Ticket Portal │
                 └────────────────┬─────────────────┘
                                  │ HTTPS / REST
                 ┌────────────────┴─────────────────┐
                 │           Core services layer      │
                 │  Auth & SSO │ Ticket engine │ AI     │
                 │  classification │ Knowledge base │   │
                 │  Notifications │ Dashboard │ Admin   │
                 └────────────────┬─────────────────┘
                                  │
                 ┌────────────────┴─────────────────┐
                 │              Data layer            │
                 │   PostgreSQL (tickets, problems,   │
                 │   users, FAQ, notifications, audit)│
                 └────────────────┬─────────────────┘
                                  │
                 ┌────────────────┴─────────────────┐
                 │   External (pending IT — OI-01)    │
                 │  University SSO/LDAP │ Person-data  │
                 │  API                                │
                 └─────────────────────────────────────┘
```

## 2. Requirements → component mapping

| Layer | Component | Requirement IDs |
|---|---|---|
| Client | Chatbot | NFR-1.1, NFR-1.1.1 (language detection), NFR-1.1.2 (ticket generation), NFR-1.1.4 (FAQ) |
| Client | Ticket portal | NFR-1.2, NFR-1.2.1 (ticket report), NFR-1.2.3 (attachments) |
| Core services | Auth & SSO | NFR-2.5, Req-3.3 (interface auth) |
| Core services | Ticket engine | NFR-1.1.2, NFR-1.1.3 (correction), NFR-1.7 / 1.7.1 (incident clustering) |
| Core services | AI classification | NFR-1.3, NFR-2.7 / 2.7.4 (escalation), NFR-2.7.2 (perf under load) |
| Core services | Knowledge base | NFR-1.1.4, NFR-2.7.3 (context engine) |
| Data | Ticket & problem DB | NFR-1.5 (auditing), NFR-1.7.2 (root-cause traceability), NFR-1.4 (RBAC) |
| Data | Audit log | NFR-2.6 |
| External | University SSO/LDAP | NFR-2.5, Req-3.3 — pending IT interview (OI-01) |
| External | Person-data API | Req-3.1, 3.2 — pending IT interview (OI-01) |

## 3. Why modular-by-domain, not layered-by-type

A conventional Express app groups files by *type*:

```
src/controllers/  src/routes/  src/models/  src/services/
```

Every feature then touches four shared directories, so six people working in parallel constantly collide on
the same files. Instead, this repo groups by *domain*: each module is a vertical slice that owns its
controller, service, repository, routes, DTOs, schemas, validators, tests, and README. A module can be
deleted, rewritten, or reassigned to a different contributor without touching anything outside its folder.

Backend module list and what each owns:

| Module | Owns | Notes |
|---|---|---|
| `authentication` | login/register scaffolding, JWT issuance, role guard middleware | `ldap/` submodule isolated — pending IT (OI-01), rest of the app must not import it directly |
| `users` | user profile CRUD, role assignment | |
| `tickets` | ticket lifecycle, correction, problem clustering placeholders | |
| `chatbot` | conversation flow, language detection, FAQ routing, intent recognition | delegates AI calls to `ai` module, never implements model logic itself |
| `ai` | classification, summarization, embeddings, prompt templates | fully isolated — if AI is dropped, delete this folder only |
| `knowledge-base` | FAQ storage/retrieval, context engine placeholder | |
| `notifications` | ticket status change notifications (email, in-app) | v2 priority per requirements |
| `dashboard` | live counts of open/in-progress/resolved tickets per department | read-only aggregation over `tickets` |
| `admin` | admin-only management endpoints, audit log review | |
| `analytics` | reporting/metrics beyond the live dashboard | |

Frontend mirrors this 1:1 (`login`, `dashboard`, `ticket`, `chatbot`, `faq`, `admin`, `notifications`,
`profile`) so a contributor working on "tickets" touches `backend/.../modules/tickets` and
`frontend/.../modules/ticket` and nothing else.

## 4. Enforcement rules (negative requirements)

These are access-control rules, not components — they must be enforced in middleware/services across
`tickets`, `chatbot`, and `admin`:

- Row-level access control so students only see their own tickets and never staff-only notes (NEG-3, NEG-4).
- Chatbot must never disclose another user's ticket contents (NEG-5).
- AI classification/escalation may categorize and route but must never make final decisions on sensitive
  matters (grade changes, exam outcomes) — a human must decide (NEG-6).
- 2nd-level support email/verbal exchanges are out of scope for the system to document (NEG-1); no automated
  reminders are sent to 2nd-level support (NEG-2).
- Ticket deletion outside the retention policy is not permitted (NEG-6 / retention).

## 5. Open issues carried over

- **OI-01 — External interfaces for person data.** Source system, access method, authentication protocol,
  and publication-cleared fields are unconfirmed. The `authentication/ldap` and a future `integrations/`
  person-data client are stubbed with `TODO`s and must not be depended on elsewhere until confirmed.
- **OI-02 — USP vs. commercial platforms.** Positioning question, not architectural, but it justifies the
  self-hosted deployment (Docker Compose, own Postgres) used in this scaffold.

## 6. Gaps to resolve as a team

- Escalation threshold between AI classification and human 2nd-level support is unspecified — needs an
  explicit rule given NEG-6.
- Notifications and attachment support are v2/v3 priority; their module folders exist but should stay thin
  until prioritized.

## 7. Cross-cutting concerns

- **DI-style construction**: services take their repository (and collaborator services) as constructor
  arguments and are instantiated by small factory functions per module (see
  `backend/src/app/interfaces`). No DI container is imposed yet; swapping in `tsyringe`/`inversify` later is
  a drop-in change because controllers only depend on interfaces.
- **Centralized config**: `backend/src/app/config` loads and validates environment variables once.
- **Structured logging**: `backend/src/app/shared/logger` — every module logs through this, never `console.log`.
- **Global error handling**: `backend/src/app/middleware/error-handler.middleware.ts` catches
  `AppError` subclasses thrown anywhere and formats a consistent JSON error response.

## 8. Ticket lifecycle rules (confirmed via wireframe review)

Two behaviors surfaced while reviewing the ticket-portal wireframes, owned by the `tickets` module
(relates to the existing NFR-1.1.2 / NFR-1.1.3 mapping in §2 — no new requirement ID assigned here, flag to
the team if one should be minted):

- **Reopen-on-reply.** If a student adds a reply/comment to a ticket whose status is `Resolved`, the ticket
  engine must transition it back to `Open` (not silently stay `Resolved`) and re-surface it in the owning
  department's queue for staff review. This is a student-initiated transition — staff replies to a resolved
  ticket do not reopen it.
- **Department reassignment, decoupled from resolution.** Staff need a way to correct a ticket that was
  routed to the wrong department: reassign both the `department_id` and the specific assignee (not just
  round-robin within the current department), matched against which employees belong to which department.
  Submitting a reassignment must support **"keep open"** as a distinct outcome from resolving — moving a
  ticket to the right department/person is not the same action as closing it, and the API/UI must not force
  a status change to `Resolved` when the intent is only to redirect ownership.
