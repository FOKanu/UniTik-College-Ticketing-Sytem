# UniTik — University Support Ticketing System

> **v2 — FastAPI implementation.** The original Express + Prisma scaffold is frozen in
> [`archive/scaffold-v1/`](archive/scaffold-v1/) (tag: `scaffold-v1-final`). Do not import from the archive
> into active code.

A self-hosted support ticketing platform for universities, with an AI chatbot front door,
role-based access (Student / Staff / Admin), and an FAQ knowledge base.

Designed for self-hosted deployment with multilingual support and department-based routing.

---

## ✨ Highlights

- **🤖 AI-Powered Assistant** — Natural language chat with RAG-based FAQ retrieval and ticket escalation. Supports quick and detailed answer modes.
- **🔐 Self-Hosted** — On-premises deployment option. Role-based access ensures students only see their own tickets.
- **🌐 Multilingual** — Built-in i18n support (EN/DE) with language switching.
- **⚡ Modern Stack** — FastAPI + React with async SQLAlchemy, pgvector for semantic search, SSE streaming, and vertical slice organization for parallel team development.
- **🔄 Continuous Integration** — Three-gate git workflow (workstream → debugging → PM review → main), automated path guards, Docker Compose orchestration, and Alembic migrations.
- **🎯 Department Routing** — Category-based ticket routing with keyword matching (Academics, IT, Finance, Maintenance). LLM can suggest categories on escalation.
- **📊 SLA Foundation** — Audit logging and SLA tracking preparation for institutional accountability.

---

## 🛠 Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115+ | Async REST API with OpenAPI documentation |
| **SQLAlchemy** | 2.0.32+ | Async ORM with declarative models |
| **PostgreSQL** | 16 | Primary database with pgvector extension |
| **pgvector** | 0.3.0+ | Vector embeddings for semantic FAQ search |
| **Alembic** | 1.13+ | Database schema migrations |
| **Python** | 3.11+ | Core language with async/await support |
| **OpenAI SDK** | 1.40+ | Unified LLM client (Ollama, OpenAI, Gemini) |
| **Redis** | 5.0+ | Optional shared cache for LLM health checks |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2+ | Component-based UI framework |
| **TypeScript** | 6.0+ | Type-safe development |
| **Vite** | 8.1+ | Lightning-fast build tool and dev server |
| **Tailwind CSS** | — | Utility-first responsive design |
| **Zustand** | 5.0+ | Lightweight state management |
| **React Hook Form** | 7.82+ | Form validation with Zod schemas |
| **i18next** | 26.3+ | Internationalization framework |
| **Axios** | 1.18+ | HTTP client with interceptors |

### Infrastructure & Tooling
| Technology | Purpose |
|------------|---------|
| **Docker Compose** | Multi-container orchestration (Postgres, Redis, backend, frontend) |
| **Uvicorn** | ASGI server with hot reload |
| **Ruff** | Fast Python linter and formatter |
| **ESLint + Prettier** | JavaScript/TypeScript code quality |
| **pytest** | Backend testing framework |
| **Vitest** | Frontend unit and component testing |
| **GitHub Actions** | CI/CD with workstream path guards |

---

## 🏗 Architecture & Development Process

### Vertical Slices
UniTik is organized by **domain features** rather than technical layers, enabling parallel development without merge conflicts:

```
backend/app/
├── api/v1/          # HTTP endpoints per slice
│   ├── auth.py      # Login, registration, JWT
│   ├── tickets.py   # Ticket CRUD, status updates
│   ├── chat.py      # Conversation management, SSE streaming
│   ├── kb.py        # FAQ search and retrieval
│   └── users.py     # Profile management
├── services/        # Business logic
├── models/          # SQLAlchemy ORM models
├── ai/              # LLM integration (prompts, client, triage)
└── db/              # Database session and utilities

frontend/src/
├── pages/           # Route components (auth, tickets, assistant)
├── components/      # Reusable UI (layout, tickets, chat, notifications)
├── lib/api/         # Typed API client adapters
├── stores/          # Zustand state management
└── hooks/           # Shared React hooks
```

Each vertical slice (auth, tickets, chat, KB) owns its routes, services, schemas, tests, and UI components — enabling focused ownership and rapid iteration.

### Three-Gate Git Workflow
Ensures quality and demo-readiness at every stage:

```
Developer (workstream/feature branch)
        ↓
   PR → debugging           (QA + Testing team verifies CI, smoke tests)
        ↓
   PR → project-manager     (PM reviews scope, docs, acceptance criteria)
        ↓
   PR → main                (Production-ready release)
```

**Workstream branches** enable parallel development:
- `frontend` — Student/staff portal, design system, chat UI
- `backend` — API endpoints, business logic, integrations
- `database` — Schema migrations, seed data, indexes
- `ai-rag` — LLM prompts, embeddings, retrieval, escalation
- `tooling-devops` — CI/CD, Docker, scripts, monitoring
- `testing` — E2E, integration, and unit tests

**Path guards** (enforced in CI) prevent cross-cutting changes from accidentally landing on the wrong branch, maintaining clean separation of concerns.

---

## 🚀 Features

### ✅ Implemented (Code Present with Test Files)
- **Authentication System** — JWT-based auth with role guards (Student, Staff, Admin), rate limiting on login/register. Test files: test_auth.py, test_security.py, test_rbac.py (477 lines).
- **Ticket Management** — Full CRUD, status lifecycle (Open → In Progress → Resolved), category-based department routing with keyword matching. Test files: test_tickets.py, test_ticket_routing.py (447 lines).
- **AI Chat Assistant** — SSE streaming, conversation history, quick/detailed answer modes. Implementation present with test files (test_chat.py, test_chat_rag.py, 457 lines). **Tests not run in this audit; runtime not verified.**
- **Chat-to-Ticket Escalation** — Implementation present with LLM suggestion of subject and category. Test files included in chat tests. **Tests not run in this audit; runtime not verified.**
- **FAQ Knowledge Base** — Semantic search with pgvector, bilingual markdown content (EN/DE), ingestion pipeline. Test files: test_kb_*.py files (530+ lines). **Tests not run in this audit; runtime not verified.**
- **Multi-Role Access Control** — Students see only their tickets; internal comments hidden from students. Enforced in services layer with RBAC test files.
- **Internationalization** — English and German locales with manual language switching. Test files: i18n.test.tsx (122 lines).
- **Dark Mode** — Theme selector with persistence (theme store + CSS variables).
- **Multi-Institution Branding** — Institution picker with theme support (institution store).
- **Health Monitoring** — LLM provider health check endpoint. Graceful degradation path present.
- **Audit Logging** — Ticket lifecycle event tracking foundation.
- **Docker Deployment** — Postgres (pgvector), Redis, backend, frontend in docker-compose.yml.

**Note:** Test file line counts indicate file size, not measured code coverage. Tests were not executed in this audit session.

### 🚧 Partial / Foundation
- **Notifications** — Backend route exists; email/push delivery in development
- **File Attachments** — Model and UI components present; storage integration incomplete
- **SLA Tracking** — Foundation exists; breach tracking not integrated into workflow
- **Analytics Dashboard** — UI pages exist; backend aggregation minimal

### 📋 Planned / Design Specifications (Not Yet Implemented)
- **University SSO/LDAP** — Architecture docs mark as pending IT coordination (OI-01). Service stub present.
- **Advanced Analytics** — Wireframes show reports; refined prototype marks "Soon". UI pages present; backend aggregation minimal.
- **Native Mobile App** — Responsive web implemented; native iOS/Android shown in design artifacts only.
- **Advanced NLP Routing** — Category-based keyword routing implemented; natural language keyword extraction planned.

---

## 👥 Team & Contributors

### Project Leadership

**Francis Kanu** ([@FOKanu](https://github.com/FOKanu)) — **Main Project Owner, Project Manager, and Lead Engineer Throughout Development**

Francis Kanu is the main project owner who founded and leads the UniTik project, serving as Project Manager and Lead Engineer throughout development. Co-authored the project report with Hunain Khan (report delivery 3 August 2026, submission 14 August 2026).

**Git-evidenced contributions** (attributable to git identities "Francis Okorie", "FOKanu", "Francis Kanu"; mapping to Francis Kanu inferred from name similarity and @FOKanu association):
- Designed and implemented the AI chat assistant with RAG-based FAQ retrieval
- Architected the LLM integration layer supporting Ollama, OpenAI, and Gemini providers
- Created the three-gate git workflow (workstream → debugging → PM → main) that enabled parallel team development
- Built the chat-to-ticket escalation system with LLM-based category suggestion
- Led DevOps setup: Docker orchestration, CI/CD pipelines, and workstream path guards
- Contributed to frontend chat UI, API client adapters, and design system foundations

### Core Development Team

**Database & Backend**  
[**Laurynas Stravinskas** (@Laurynas36)](https://github.com/Laurynas36) — Database lead. Designed the PostgreSQL schema with pgvector extension for semantic search, created 9 Alembic migrations from baseline through multi-tenant support, implemented ticket routing engine with department keyword matching, and built the database seed pipeline with realistic test data.

**Knowledge Base & AI/RAG**  
[**Izzatkhanim Mirzakhanova** (@rzaest)](https://github.com/rzaest) — AI/RAG specialist. Led comprehensive German localization (bilingual KB docs and UI translations), created synthetic university FAQs across 6 categories (academics, finance, housing, IT, maintenance, registrar), built knowledge base API and schema updates, and contributed to FAQ retrieval system.

**Embeddings & Search**  
[**Yegor Gariazha** (@GariazhaYegor)](https://github.com/GariazhaYegor) — AI/RAG engineer. Ported knowledge base ingestion pipeline from Express to FastAPI/SQLAlchemy stack, implemented embedding generation, and configured pgvector similarity search for semantic FAQ matching.

### Testing & Quality

**Agrima Sharma** — Testing and rate limiting specialist. Designed and implemented comprehensive rate limiting system with 5 test suites (486 lines covering concurrency, failure modes, integration, timing, and unit tests), created Q&A regression set for KB testing, migrated i18next v3→v4 with German localization tests, and fixed user response department resolution.

**Hunain Khan** — Testing & QA lead, project documentation. Co-authored the project report with Francis Kanu (report delivery 3 August 2026, submission 14 August 2026). Contributed to QA and documentation work throughout development.

### Frontend Development

**minarichan** — Frontend UX specialist (real name TBD). Implemented dark mode with theme selector and store, expanded German i18n across 70+ files, refined CSS modules for 20+ components (badges, buttons, inputs, cards), and fixed Docker proxy configuration for Vite dev server.

**AlenBaizhan** — Frontend developer. Built multi-institution support with institution picker and theme switching, improved analytics access for agent/admin roles, created empty notifications state, enhanced profile page with avatar cleanup and dashboard stat styling.

### Backend & Security

**Kinga Kowalewska** — Backend auth lead. Implemented JWT issuance, RBAC middleware, initial rate limiting on login/register, security tests (168 lines), RBAC boundary tests (248 lines), users router with department-scoped tickets, and backend tooling setup (Black, mypy).

### Tooling & CI

**Arshdeep Singh** — UI/UX prototyping and QA audit (report-documented, August 2026). Git evidence shows tooling contributions: enhanced workstream path guard with merge conflict detection, database branch guards, and multi-university branch protection (158 lines of path guard tests).

**sunilkumar** — Backend testing and routing (git evidence: 7 commits under sunilkumar/sunilkumar387388-rgb identities). Fixed department model test suite and implemented ticket routing engine service. Report-documented (August 2026): Debugging and monitoring work. Kept separate from Vivek per report's distinct naming.

**Vivek (SIRVK22)** — Debugging and observability (report-documented, August 2026). Git shows 1 PR merge (SIRVK22 identity); contributions may include monitoring setup, observability tooling, or work on un-merged branches. Kept separate from sunilkumar per report's distinct naming.

### Additional Contributors

**Report-documented contributions** (project report, August 2026):

- **Milena** — Frontend student portal and design system contributions (report-documented). Note: Git handle "minarichan" shows 12 commits with similar scope (dark mode, theme system, i18n, CSS) but identity linkage unconfirmed.
- **Shahnas** — Frontend staff/admin interfaces and backend ticket/SLA components (report-documented).
- **Shahriar** — Regression testing (12 August 2026 regression phase) and load testing (report-documented).
- **Anmol** — API integration testing (report-documented).
- **Adrian** — Debugging and observability work (report-documented). Git shows 1 PR merge.

**Note:** Report documented these contributions (delivery 3 August 2026, submission 14 August 2026). Absence of git evidence does not indicate absence of contribution; work may be in testing coordination, manual QA, un-merged branches, or pair programming.

---

## 🎨 Design Documentation

### Design Artifacts

The project includes comprehensive design specifications across two Figma files:

1. **[Low-Fidelity Wireframes](https://www.figma.com/design/eMdAoJ0lMeFkwPk8TAZviQ/College-Ticketing-System---Wireframes?node-id=0-1)** — 13 desktop frames establishing core student and staff journeys (dashboard, ticket list/creation/detail, AI chat, queue management, KB, reports/analytics, sign-in/up). Uses blue accents and tinted sidebar.

2. **[Refined Prototype](https://www.figma.com/design/VOVfOFvi2yGnlkOOr0krqr/University-Ticketing-App---Prototype-UI-Design?node-id=13-2)** — High-fidelity prototype with documented visual system (steel blue brand palette, Inter typography, component library), MediaDesign Hochschule branding, responsive specifications, and dedicated mobile student layouts (iPhone 14/15 390×844).

**Design Naming Note:** The refined prototype uses **"TicketHub"** as example product branding throughout the design artifacts. The actual project and implementation use **"UniTik"**. This is design artifact naming for illustration purposes, not a product rename.

**Design vs. Implementation:**
- ✅ **Implemented:** Ticket lifecycle, department routing, chat escalation, FAQ search, bilingual support, access control, loading/error/empty states
- 🚧 **Foundation:** File attachments, SLA tracking, analytics (UI exists, backend minimal)
- 📋 **Planned/Design-Only:** Advanced analytics (prototype marks "Soon"), native mobile app (responsive web implemented), SSO integration (marked "coming soon" in mobile designs)

The prototype explicitly marks certain features as placeholders or planned. Desktop AI is annotated as "placeholder" in design but is functionally implemented in code (see LLM Integration documentation). Refer to the [Evidence Handoff](docs/EVIDENCE_HANDOFF_CONTRIBUTOR_ATTRIBUTION.md) for detailed design-to-code reconciliation.

**Visual System:** Documented accessibility intentions (AA-safe color claims, ARIA annotations, focus states, validation) express design goals; runtime accessibility compliance requires separate testing and verification.

---

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose** (recommended for fastest setup)
- **Python 3.11+** (for local backend development)
- **Node.js 18+** (for local frontend development)

### One-Command Setup

```bash
git clone git@github.com:FOKanu/College-Ticketing-Sytem.git
cd College-Ticketing-Sytem
./scripts/setup.sh
docker compose up --build
```

**Services:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/docs (OpenAPI/Swagger)

**Note:** Demo credentials are available in the deployment environment. For local development, the seed script (`python -m scripts.seed` from `backend/` with venv) creates test users.

### Local Development (No Docker)

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -e ".[dev]"
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --port 4000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Vite dev server on :5173
```

### Configuration

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql+asyncpg://uts_user:uts_password@localhost:5432/university_ticketing
LLM_PROVIDER=ollama  # or 'openai', 'google'
OLLAMA_OPENAI_BASE_URL=<team-ollama-endpoint>
OLLAMA_API_KEY=<your-api-key>
OLLAMA_MODEL=qwen3:8b
JWT_SECRET=<generate-strong-secret>
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE_URL=/api/v1
VITE_DATA_SOURCE=hybrid  # 'mock', 'hybrid', or 'api'
```

See `backend/.env.example` and `frontend/.env.example` for all configuration options including LLM provider endpoints and credentials.

---

## 📖 Documentation

- **[Evidence Handoff](docs/EVIDENCE_HANDOFF_CONTRIBUTOR_ATTRIBUTION.md)** — Comprehensive implementation audit, contributor attribution with git evidence, design-to-code reconciliation
- **[Contributors & Ownership](docs/CONTRIBUTORS.md)** — Team roster, workstream assignments, and gate roles
- **[Branching Strategy](docs/BRANCHING_STRATEGY.md)** — Three-gate git flow, workstream paths, and protection rules
- **[Architecture Overview](docs/architecture/README.md)** — Requirements mapping, modular design, and component ownership
- **[LLM Integration](docs/LLM_INTEGRATION.md)** — Provider setup (Ollama/OpenAI/Gemini), streaming, and escalation
- **[Coding Standards](docs/CODING_STANDARDS.md)** — Code style, conventions, and best practices
- **[Commit Conventions](docs/COMMIT_CONVENTIONS.md)** — Conventional Commits format

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Backend linting
ruff check app tests

# Frontend tests
cd frontend
npm test

# Frontend linting
npm run lint
```

**Test Files Present:**
- **29 backend test files**, 3,715 lines total
- Rate limiting: 486 lines (5 test files covering concurrency, failures, integration, timing, unit)
- Security & RBAC: 416 lines
- Tickets: 376 lines
- Chat & RAG: 457 lines
- KB ingestion: 530+ lines
- Frontend: i18n tests, API client tests, component tests

**Note:** Line counts indicate test file size, not measured code coverage. Tests were not executed in this audit session.

---

## 📊 Repository Layout

```
university-ticketing-system/
├── backend/               # FastAPI API (vertical slices: auth → tickets → chat → kb)
│   ├── app/               # Application code (api, services, models, ai)
│   ├── alembic/           # Database migrations
│   ├── scripts/           # Seed data, ingestion
│   └── tests/             # pytest suite (29 files, 3,715 lines)
├── frontend/              # React SPA
│   ├── src/               # Pages, components, API clients, stores
│   └── public/            # Static assets
├── docs/                  # Architecture, branching, design tokens, refactor roadmap
│   ├── architecture/      # Requirements mapping, component ownership
│   ├── knowledge-base/    # Bilingual FAQ content (EN/DE)
│   └── design/            # Brand guide, design tokens
├── archive/scaffold-v1/   # READ-ONLY frozen Express/Prisma scaffold
├── docker/                # Dockerfiles + Postgres init scripts
├── .github/               # CI workflows, CODEOWNERS, path guards
└── scripts/               # Setup, path guards, seed helpers
```

---

## 🔄 Status

Foundation refactor complete. Original Express + Prisma scaffold archived in `archive/scaffold-v1/` (tag: `scaffold-v1-final`). New vertical feature slice approach adopted for incremental build — see [`docs/REFACTOR.md`](docs/REFACTOR.md) for implementation roadmap.

**Current State:**
- ✅ Core authentication, ticket management, AI chat, and KB retrieval functional
- 🚧 Notifications, attachments, and advanced analytics in development
- 📋 SSO integration, native mobile, and advanced keyword routing planned

---

## 📄 License & Academic Context

This project was developed as a university coursework project at MediaDesign Hochschule für Design und Informatik. All implementations prioritize self-hosted, privacy-compliant architecture suitable for educational institutions.

For questions about deployment, contributions, or academic collaboration, contact the project maintainers via GitHub.

---

**Project Manager:** Francis Kanu ([@FOKanu](https://github.com/FOKanu))  
**Repository:** https://github.com/FOKanu/College-Ticketing-Sytem
