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
| 5 | Done | Auth — JWT login, `/auth/me`, LoginPage + RegisterPage (student self-signup) |
| 6 | Done | Tickets — CRUD, RBAC scoping, FE list/create + TicketDetailPage (comment thread, staff reassign form, status control) |
| 7 | Done | Chat — conversations, messages, escalate-to-ticket |
| 8 | Done | KB — FAQ list/search (text fallback; vector when embeddings populated) + staff-only "Add FAQ entry" form |

_2026-07-27: closed a frontend/backend gap — the app rendered blank-ish minimal pages because
`backend/.env` and `frontend/.env` didn't exist yet (only `.env.example`), and Sign Up + a real
Ticket Detail page were never built even though the backend endpoints (`POST /auth/register`,
`GET/PATCH /tickets/{id}`, comments) already existed. Also fixed: `services/tickets.py::add_comment`
wasn't implementing the "reopen-on-reply" rule from `docs/architecture/README.md` §8; a stray
`vite.config.js`/`.d.ts` pair was being emitted next to `vite.config.ts` by `tsc -b`
(see `frontend/tsconfig.node.json`)._

_2026-07-27 (later same day): started porting the Figma wireframes (file `eMdAoJ0lMeFkwPk8TAZviQ`)
into real components, screen by screen, starting with auth. `LoginPage.tsx` / `RegisterPage.tsx` now
match frames 85:2 / 85:3 (card layout, spacing, colors pulled from the Figma design tokens). Two
elements from the design — "Forgot password?" and "Continue with University SSO" — are rendered but
disabled, since there's no password-reset endpoint or SSO integration (OI-01) on the backend yet.
**Decision (2026-07-27): "TicketHub" is the canonical product name.** `Layout.tsx` header,
`HomePage.tsx` heading, and `index.html`'s `<title>` were updated to match (previously read
"University Ticketing" / "University Support Ticketing"). "University Support Ticketing System"
remains the descriptive subtitle in the browser tab title only._

_2026-07-28: implemented the Student Dashboard (Figma node `1:2`) at a new `/dashboard` route,
student-only (staff/admin redirect to `/tickets`, since the wireframe footer says "STUDENT PORTAL"
and the framing — "your" tickets — doesn't fit staff who see everyone's queue). New post-login/
register redirect sends students here instead of `/tickets`. Two design gaps handled honestly:
"Awaiting Response" isn't a real backend status, so that stat card was relabeled "In Progress" and
counts the real `IN_PROGRESS` status instead of inventing one; "Suggested Articles" has no
recommendation endpoint, so it shows the first 3 real `GET /kb/faq` entries rather than a fake
ranking. Also extracted `frontend/src/modules/tickets/types.ts` — `TicketsPage`, `TicketDetailPage`,
and the new `DashboardPage` had each been redefining their own local `Ticket` interface.
Also added dev-only ("import.meta.env.DEV" gated) quick-fill buttons on `LoginPage` for the real
seeded demo accounts from `backend/scripts/seed.py` (password `demo1234` for all) — not an auth
bypass, still goes through real `/auth/login`._

_2026-07-29: completed the Figma port for every screen with real backend backing. `Layout.tsx` is
now the shared app shell from the wireframes (dark Mdh brand block, 220px gradient sidebar with
role-specific nav and active-item highlight, top bar with page title + EN/bell/logout, floating AI
bubble); auth pages render shell-less. New/redesigned pages: `TicketsPage` (table layout with
status/department filters, search, client-side pagination — serves as student "My Tickets" AND staff
"Ticket Queue", node 1:3/1:8), `CreateTicketPage` at `/tickets/new` (category + priority pills;
selected category is sent as both `category` and `department` for routing; attachments dropzone
rendered disabled — no upload endpoint, node 1:4/23:2), `TicketDetailPage` (meta sidebar with status
timeline + conversation bubbles; staff variant adds status select + reassign panel, node 1:5/1:9),
`ChatPage` (bubbles, suggested-topic quick sends, real escalate-to-ticket that navigates to the
created ticket, node 1:6), `StaffDashboardPage` at `/staff` (node 1:7 — stat cards + My Queue +
CSS bar chart of tickets-by-department, all derived from GET /tickets; **"SLA Breaches" replaced
with "Unassigned"** since no SLA engine exists), FaqPage header restyle (doubles as staff
"Knowledge Base", 23:3 — its "Knowledge Gaps" AI panel omitted, needs an endpoint). Staff land on
`/staff` after login. Shared helpers split into `tickets/ui.tsx` (chips) and `tickets/format.ts`
(labels/colors/relative time). Still unbuilt: Analytics (23:4, no aggregation endpoints),
Notifications, Profile — nav items render disabled._

_2026-07-29 (follow-up): `/` no longer shows the old health-check landing page — it now redirects
(signed-out → `/login`, student → `/dashboard`, staff → `/staff`); the health-check page moved to
`/status` for developers. Polish pass beyond the wireframes: page background softened to `#F7F8FA`
(`--uts-bg`) so white cards read as raised surfaces, `shadow-sm` on cards/auth forms, the tickets
table wrapped in a card, sidebar got a right border + nav hover/transition states, font smoothing
enabled._

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
- Staff-facing Dashboard / Queue / Analytics pages from the Figma wireframes — intentionally NOT
  built yet. They need backend support first: a staff-directory endpoint (so "reassign" can offer a
  real dropdown instead of a raw user-id field) and aggregation endpoints for queue counts/analytics.
  Wiring fake data into those screens would violate the "no mock success responses" rule in
  `CLAUDE.md`.

## Laurynas review checklist (Stage 3)

- [ ] All 11 models match archived `schema.prisma`
- [ ] Enums: Role, TicketStatus, TicketPriority
- [ ] pgvector on `FaqEntry.embedding` (1536 dims)
- [ ] FK relations and `TicketComment.isInternal` (NEG-4)
