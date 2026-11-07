# UniTik — University Support Ticketing System

> **An intelligent, privacy-first support platform for higher education.** UniTik combines AI-assisted chat, role-based ticketing, and knowledge management to streamline student support operations while keeping sensitive data on campus.

Built for universities that need GDPR/privacy compliance, multilingual support, and intelligent triage — without vendor lock-in or third-party data sharing.

---

## ✨ Highlights

- **🤖 AI-Powered Assistant** — Natural language chat with RAG-based FAQ retrieval, intelligent ticket escalation, and context-aware responses. Supports quick and detailed answer modes.
- **🔐 Privacy & Compliance** — Self-hosted with on-premises deployment. All data stays within university infrastructure. Role-based access ensures students only see their own tickets.
- **🌐 Multilingual** — Built-in i18n support (EN/DE) with automatic language detection for diverse student populations.
- **⚡ Modern Architecture** — FastAPI + React with async SQLAlchemy, pgvector for semantic search, streaming SSE responses, and vertical slice organization for parallel team development.
- **🔄 Production-Ready Pipeline** — Three-gate git workflow (workstream → debugging → PM review → main), automated path guards, Docker Compose orchestration, and Alembic migrations.
- **🎯 Intelligent Triage** — LLM-assisted categorization (Academics, IT, Finance, Maintenance) with human-in-the-loop validation to ensure accuracy on sensitive matters.
- **📊 Multi-Tenant Ready** — Department-based routing, SLA tracking foundation, and audit logging for institutional accountability.

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

### ✅ Shipped & Functional
- **Authentication System** — JWT-based auth with role guards (Student, Staff, Admin)
- **Ticket Management** — Full CRUD, status lifecycle (Open → In Progress → Resolved), department routing
- **AI Chat Assistant** — Streaming responses via SSE, conversation history, quick/detailed answer modes
- **Chat-to-Ticket Escalation** — One-click conversion with LLM-suggested subject and category
- **FAQ Knowledge Base** — Semantic search over markdown documents with pgvector
- **Multi-Role Access Control** — Students see only their tickets; internal comments hidden from students
- **Health Monitoring** — LLM provider health checks with graceful fallback
- **Audit Logging** — Track ticket lifecycle events for compliance
- **Docker Deployment** — Postgres (pgvector), Redis, backend, frontend in compose
- **Internationalization** — English and German locales with language switching

### 🚧 In Progress / Stubs
- **Notifications** — Backend route exists; email/push delivery in development
- **File Attachments** — UI components present; storage integration pending
- **University SSO** — LDAP/SAML integration pending IT coordination (see OI-01 in architecture docs)
- **Advanced Analytics** — Department dashboards and SLA breach reporting

---

## 👥 Team & Contributors

**Project Lead & AI/RAG Architect**  
[**Francis Okorie Kanu** (@FOKanu)](https://github.com/FOKanu) — Project Manager, Lead Engineer. Architected the AI chat system with RAG retrieval, designed the three-gate git workflow, and built core LLM integration (Ollama/OpenAI/Gemini). Also contributed to frontend design system, API client adapters, and DevOps tooling.

### Core Development Team

**Database & Backend**  
[**Laurynas Stravinskas** (@Laurynas36)](https://github.com/Laurynas36) — Database lead. Designed the PostgreSQL schema, managed Alembic migrations, implemented ticket routing engines, and built the seed data pipeline. Key contributor to department models and SLA foundation.

**Knowledge Base & AI/RAG**  
[**Izzatkhanim Yashar** (@rzaest)](https://github.com/rzaest) — AI/RAG specialist. Built the knowledge base API, FAQ retrieval system, and RAG debugging tools. Focused on chunking strategies, embedding upsert, and context ranking.

**Embeddings & Search**  
[**Yegor Gariazha** (@GariazhaYegor)](https://github.com/GariazhaYegor) — AI/RAG engineer. Configured embedding models and implemented pgvector similarity search for semantic FAQ matching.

### Frontend Workstream
- **Milena** — Student portal UI, design system foundations, auth pages, and frontend linting tooling. Also contributed to notifications UI and file storage components (with Laurynas).
- **Alen** — Student portal, design system, auth guards (with Kinga), state management, and accessibility/responsive design.
- **Shahnas** — Staff/admin interfaces, departments router, notifications, and SLA breach views. Backend contributions to tickets & SLA tracking.
- **Arshdeep** — Staff queue, ticket action components, and admin analytics UI.

### Backend & Security
- **Kinga** — Backend auth lead. Implemented JWT issuance, RBAC middleware, users router, secrets management, and auth security tests. Collaborated on frontend auth pages and guards.

### Testing & QA
- **Khan** — Testing & QA lead. E2E test suites, integration tests, RAG quality verification, seed data coordination, and merge conflict resolution support.
- **Shahriar** — Critical-path E2E testing with Playwright/Cypress and load testing.
- **Anmol** — Backend API integration tests.

### AI/RAG Ingestion
- **Agrima** — Knowledge base ingestion pipeline. Chunking logic, embedding upsert, and re-ranking strategies.

### Observability & Debugging
- **Vivek** — Structured logging, Sentry integration, API contract tests, and correlation IDs for distributed tracing.
- **Adrian** — Debugging gate support. Tracing, health checks, LLM cost tracking UI, and debug admin panels. Git merge control assistance.
- **Sunil** — Uptime monitoring and OpenTelemetry integration (with Adrian).

---

## 🚀 Quick Start

### Prerequisites
- **Docker** & **Docker Compose** (recommended for fastest setup)
- **Python 3.11+** (for local backend development)
- **Node.js 18+** (for local frontend development)

### One-Command Setup

```bash
git clone <repository-url>
cd university-ticketing-system
./scripts/setup.sh
docker compose up --build
```

**Services:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/docs (OpenAPI/Swagger)

**Demo Login:**
```
Email: jordan.alvarez@student.university.edu
Password: demo1234
```

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
OLLAMA_OPENAI_BASE_URL=https://muc-a-3099.tail129a23.ts.net/v1
OLLAMA_API_KEY=<team-shared-key>
OLLAMA_MODEL=qwen3:8b
JWT_SECRET=<generate-strong-secret>
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE_URL=/api/v1
VITE_DATA_SOURCE=hybrid  # 'mock', 'hybrid', or 'api'
```

See `backend/.env.example` and `frontend/.env.example` for all options.

---

## 📖 Documentation

- **[Contributors & Ownership](docs/CONTRIBUTORS.md)** — Team roster, workstream assignments, and gate roles
- **[Branching Strategy](docs/BRANCHING_STRATEGY.md)** — Three-gate git flow, workstream paths, and protection rules
- **[Architecture Overview](docs/architecture/README.md)** — Requirements mapping, modular design, and component ownership
- **[LLM Integration](docs/LLM_INTEGRATION.md)** — Provider setup (Ollama/OpenAI/Gemini), streaming, and escalation
- **[Setup Instructions](docs/SETUP_INSTRUCTIONS.md)** — Detailed local development setup
- **[Refactor Roadmap](docs/REFACTOR.md)** — Migration from v1 Express scaffold to v2 FastAPI

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

---

## 🤝 Contributing

We follow a structured contribution workflow:

1. **Claim work** from the team board and align with workstream ownership (see [CONTRIBUTORS.md](docs/CONTRIBUTORS.md))
2. **Branch** from the relevant workstream (`feature/<area>-short-description`)
3. **Develop** with passing tests and lint checks
4. **PR into `debugging`** — Testing team verifies CI, smoke tests, and functionality
5. **Debugging → `project-manager`** — PM reviews scope and demo readiness
6. **Project Manager → `main`** — Production release

See [BRANCHING_STRATEGY.md](docs/BRANCHING_STRATEGY.md) for detailed workflow and [CONTRIBUTING.md](CONTRIBUTING.md) for day-to-day contribution guidelines.

---

## 📋 Project Status

**Current Phase:** Foundation refactor complete. Vertical slice architecture implemented. Core features (auth, tickets, chat, KB) functional. V1 Express/Prisma scaffold archived.

**Next Milestones:**
- Complete notification delivery pipeline
- File attachment storage integration
- University SSO/LDAP coordination with IT
- Advanced analytics dashboards
- Production deployment to university infrastructure

---

## 📜 License

*License information to be determined based on university policy.*

---

## 🙏 Acknowledgments

Built by a collaborative team of engineers, designers, and QA specialists. Special thanks to all contributors for making UniTik a reality. This project demonstrates modern full-stack development practices, AI integration, and enterprise-grade architecture suitable for real-world university deployment.

For questions, collaboration opportunities, or to learn more about the project, please reach out via GitHub or the team's project board.

---

**Note:** The original Express + Prisma v1 scaffold is preserved in [`archive/scaffold-v1/`](archive/scaffold-v1/) (tag: `scaffold-v1-final`) for reference but is no longer actively developed.
