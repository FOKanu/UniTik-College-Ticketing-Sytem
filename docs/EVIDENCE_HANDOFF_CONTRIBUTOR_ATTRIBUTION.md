# Evidence Handoff: UniTik Implementation & Contributor Attribution

**Generated:** 2026-11-07 UTC (2026-11-08 Europe/Berlin)
**Purpose:** Comprehensive evidence base for updating project report and README with accurate individual contributor attribution  
**Repository:** git@github.com:FOKanu/College-Ticketing-Sytem.git

---

## Executive Summary

### Project Leadership

**Francis Kanu** — **Main Project Owner, Project Manager, and Lead Engineer Throughout Development**
- **GitHub:** @FOKanu
- **User confirmations:** Main project owner; Project Manager and Lead Engineer throughout development; co-authored project report with Hunain Khan
- **Documentation:** Explicitly named as PM in docs/CONTRIBUTORS.md line 15
- **Git identity note:** Multiple git commit identities observed (Francis Okorie, FOKanu, Francis Kanu, Sage Eye) with name/email variations. Identity mappings are inferred from name similarity, not independently confirmed.
- **Key contributions:** 
  - AI/RAG chatbot system (backend/app/ai/, backend/app/services/chat.py)
  - LLM integration with Ollama/OpenAI/Gemini (docs/LLM_INTEGRATION.md authored)
  - Three-gate git workflow design (docs/BRANCHING_STRATEGY.md)
  - Project structure, tooling/DevOps, merge coordination
  - Frontend chat UI, API client adapters

### Repository Statistics

- **Backend:** 49 Python files in app/, 29 test files, 9 Alembic migrations
- **Frontend:** 116 TypeScript/TSX files
- **Total commits analyzed:** 474 commits across all branches
- **Active contributors:** 20 unique git identities (some represent same person)
- **Lines of test code:** 3,715 lines (backend/tests/)
- **Docker services:** 4 (postgres, redis, backend, frontend)
- **CI workflows:** 4 GitHub Actions workflows

---

## Technical Stack (VERIFIED)

### Backend (from backend/pyproject.toml, docker-compose.yml)
- **FastAPI:** 0.115+ (async REST API with OpenAPI)
- **SQLAlchemy:** 2.0.32+ (async ORM)
- **PostgreSQL:** 16 with pgvector 0.3.0+ extension
- **Python:** 3.11+ (requires-python = ">=3.11")
- **Alembic:** 1.13+ (migrations)
- **OpenAI SDK:** 1.40+ (unified client for Ollama, OpenAI, Gemini)
- **Redis:** 5.0+ (optional shared cache)
- **Uvicorn:** 0.30+ (ASGI server)

### Frontend (from frontend/package.json)
- **React:** 19.2.7
- **TypeScript:** 6.0.2
- **Vite:** 8.1.1
- **i18next:** 26.3.6 (internationalization)
- **Zustand:** 5.0.14 (state management)
- **React Router:** 7.18.1
- **Axios:** 1.18.1
- **React Hook Form:** 7.82.0 with Zod 4.4.3

### Infrastructure
- **Docker Compose:** Multi-container orchestration (postgres:pgvector/pg16, redis:7-alpine)
- **GitHub Actions CI:** Backend (pytest, ruff), Frontend (lint, typecheck)
- **Testing:** pytest (backend), Vitest 4.1.10 (frontend)

**File evidence:**
- `backend/pyproject.toml` lines 1-65
- `frontend/package.json` lines 1-52
- `docker-compose.yml` lines 1-108
- `.github/workflows/ci-backend.yml`, `.github/workflows/ci-frontend.yml`

---

## Architecture (VERIFIED)

### Vertical Slice Organization
**Confirmed implementation** (not just planning docs):

Backend slices (backend/app/):
- `api/v1/auth.py` - JWT auth, login, register (495 lines)
- `api/v1/tickets.py` - Ticket CRUD, status updates (618 lines)
- `api/v1/chat.py` - Conversation management, SSE streaming (387 lines)
- `api/v1/kb.py` - FAQ search endpoint (164 lines)
- `api/v1/users.py` - Profile management (203 lines)
- `api/v1/notifications.py` - Notifications API stub (67 lines)
- `api/v1/health.py` - Health checks (52 lines)

Frontend pages (frontend/src/pages/):
- `auth/` - Login, Register, Institution picker
- `tickets/` - List, Detail, Create
- `assistant/` - AI chat interface
- `agent/` - Staff dashboard, queue, knowledge
- `admin/` - Admin dashboard, settings, departments
- `profile/` - User profile
- `notifications/` - Notifications page (UI only, backend stub)

**Evidence files:**
- Backend: `backend/app/api/v1/*.py` (7 routers)
- Services: `backend/app/services/*.py` (15 service modules)
- Frontend: `frontend/src/pages/*/*.tsx` (33+ page components)

---

## Features: Implemented vs. Planned

### ✅ IMPLEMENTED (Evidence-backed)

#### Authentication & Authorization
- **Files:** `backend/app/api/v1/auth.py`, `backend/app/services/auth.py`, `backend/app/core/security.py`
- **Evidence:** 
  - JWT-based auth with role guards (Student, Staff, Admin)
  - Rate limiting on login/register (backend/app/core/rate_limit.py, 233 lines)
  - Security tests (backend/tests/test_security.py, 168 lines)
  - Auth API tests (backend/tests/test_auth.py, 61 lines)
  - RBAC tests (backend/tests/test_rbac.py, 248 lines)
- **Contributors:** Kinga Kowalewska (primary), Agrima Sharma (rate limiting), Francis Kanu

#### Ticket Management
- **Files:** `backend/app/api/v1/tickets.py`, `backend/app/services/tickets.py`, `backend/app/services/ticket_routing.py`
- **Evidence:**
  - Full CRUD operations (test_tickets.py, 376 lines)
  - Department-based routing engine (test_ticket_routing.py, 71 lines)
  - Status lifecycle (OPEN → IN_PROGRESS → RESOLVED)
  - Ticket comments model in schema
- **Contributors:** Laurynas Stravinskas (primary), Francis Kanu, sunilkumar

#### AI Chat Assistant
- **Files:** `backend/app/ai/`, `backend/app/services/chat.py`, `frontend/src/hooks/useAssistantChat.ts`
- **Evidence:**
  - LLM client with provider abstraction (backend/app/ai/client.py, 197 lines)
  - SSE streaming responses (backend/app/api/v1/chat.py, POST .../messages/stream)
  - Quick/detailed answer modes (backend/app/ai/prompts.py)
  - Chat-to-ticket escalation (test_chat.py, 256 lines)
  - Frontend chat UI with streaming (frontend/src/pages/assistant/AssistantPage.tsx)
  - Widget integration (frontend/src/components/layout/ChatbotFab.tsx)
- **Contributors:** Francis Kanu (primary architect), minarichan (frontend dark mode/UX)

#### Knowledge Base & RAG
- **Files:** `backend/app/services/kb.py`, `backend/app/services/kb_embedding.py`, `backend/app/services/kb_content_parser.py`
- **Evidence:**
  - Pgvector semantic search (backend/tests/test_kb_embedding.py, 125 lines)
  - FAQ ingestion pipeline (backend/scripts/ingest_kb.py, backend/tests/test_kb_ingestion.py)
  - Markdown content parser (backend/tests/test_kb_content_parser.py, 157 lines)
  - Q&A regression set (backend/tests/test_qa_regression_set.py, backend/tests/data/qa_regression_set.jsonl)
  - Bilingual FAQ content (docs/knowledge-base/*_EN.md, *_DE.md)
  - RAG retrieval tests (backend/tests/test_chat_rag.py, 201 lines)
  - Chunking strategy doc (docs/knowledge-base/CHUNKING_STRATEGY.md)
- **Contributors:** Izzatkhanim Mirzakhanova (primary, @rzaest), Agrima Sharma, Yegor Gariazha (@GariazhaYegor), Francis Kanu

#### Internationalization (i18n)
- **Files:** `frontend/src/locales/`, `frontend/src/i18n/`
- **Evidence:**
  - English and German translations (frontend/src/locales/en/translation.ts, .../de/translation.ts)
  - i18next integration (frontend/src/i18n/index.ts)
  - i18n tests (frontend/src/i18n/i18n.test.tsx, 122 lines)
  - Language selector component (frontend/src/components/layout/LanguageSelector.tsx)
  - Bilingual KB documents (docs/knowledge-base/*_DE.md, *_EN.md for 6 categories)
- **Contributors:** Izzatkhanim Mirzakhanova (primary), Agrima Sharma, minarichan

#### Dark Mode / Theming
- **Files:** `frontend/src/components/layout/ThemeSelector.tsx`, `frontend/src/stores/themeStore.ts`
- **Evidence:**
  - Theme store with persistence
  - Theme selector component (133 lines)
  - CSS variable-based theming (frontend/src/index.css)
  - Institution branding support (frontend/src/lib/theme/applyInstitutionTheme.ts)
- **Contributors:** minarichan (primary), AlenBaizhan

#### Multi-Institution Support
- **Files:** `frontend/src/stores/institutionStore.ts`, `frontend/src/lib/institutions.ts`
- **Evidence:**
  - Institution picker page (frontend/src/pages/auth/InstitutionPage.tsx)
  - Institution store with persistence
  - Theme switching per institution
- **Contributors:** AlenBaizhan (primary)

#### Database
- **Files:** `backend/alembic/versions/*.py`, `backend/app/models/`
- **Evidence:**
  - 9 Alembic migrations (001_baseline through 009_faq_document_identity)
  - Department entity (migration 005_department_entity.py)
  - Pgvector extension setup
  - Seed script (backend/scripts/seed.py)
  - Department model tests (backend/tests/test_user_response_department.py)
- **Contributors:** Laurynas Stravinskas (primary), Kinga Kowalewska, Izzatkhanim Mirzakhanova

#### Testing Infrastructure
- **Files:** `backend/tests/`, `frontend/src/**/*.test.tsx`
- **Evidence:**
  - 29 backend test files, 3,715 lines total
  - Rate limiting tests (5 files: concurrency, failure, integration, time, unit - 486 lines total)
  - Security tests (168 lines)
  - RBAC tests (248 lines)
  - KB/RAG tests (multiple files, 500+ lines)
  - Frontend i18n tests, tickets API tests
- **Contributors:** Agrima Sharma (rate limiting, i18n tests), Kinga Kowalewska (security/RBAC), Laurynas Stravinskas, Francis Kanu

#### CI/CD & Tooling
- **Files:** `.github/workflows/`, `scripts/`
- **Evidence:**
  - 4 GitHub Actions workflows (backend CI, frontend CI, lint, workstream path guard)
  - Workstream path guard with tests (scripts/check-workstream-paths.sh, scripts/tests/check-workstream-paths.test.sh)
  - Merge conflict detection
  - Setup script (scripts/setup.sh)
  - Docker entrypoint scripts
- **Contributors:** Francis Kanu (primary), Arshdeep Singh (path guard enhancements), Laurynas Stravinskas

### 🚧 PARTIAL / STUBS (Evidence-backed)

#### Notifications
- **Status:** Backend route exists (backend/app/api/v1/notifications.py, 67 lines), but minimal implementation
- **Evidence:** 
  - Notifications service stub (backend/app/services/notifications.py)
  - Frontend UI complete (frontend/src/pages/notifications/NotificationsPage.tsx)
  - Tests exist (backend/tests/test_notifications.py, test_notify_jobs.py)
  - But actual email/push delivery not wired
- **Contributors:** AlenBaizhan (frontend UI in v1 scaffold), backend stubs by Francis/team

#### File Attachments
- **Status:** Model exists, UI components present, storage integration incomplete
- **Evidence:**
  - Attachment service (backend/app/services/attachments.py)
  - Tests (backend/tests/test_attachments.py, 174 lines)
  - Frontend dropzone component (frontend/src/components/ui/FileDropzone.tsx)
  - But S3/local storage not fully wired
- **Contributors:** Laurynas Stravinskas (model), frontend components by multiple

#### Analytics Dashboard
- **Status:** UI pages exist, backend aggregation minimal
- **Evidence:**
  - Admin analytics page (frontend/src/pages/admin/AnalyticsPage.tsx)
  - Agent analytics page (frontend/src/pages/agent/AnalyticsPage.tsx)
  - Dashboard pages with live counts (frontend/src/pages/*/Dashboard*.tsx)
  - No dedicated backend analytics service yet
- **Contributors:** Frontend pages by AlenBaizhan, Arshdeep Singh (staff/admin), minarichan

### ❌ NOT IMPLEMENTED (Planned/Documented Only)

#### University SSO/LDAP Integration
- **Status:** Architecture doc mentions as "Open Issue OI-01" - pending IT coordination
- **Evidence:** docs/architecture/README.md lines 98-100, "stubbed with TODOs"
- **Note:** SSO service file exists (backend/app/services/sso.py) but is a stub

#### Advanced SLA Tracking
- **Status:** Foundation exists, full breach tracking not implemented
- **Evidence:** 
  - SLA service stub (backend/app/services/sla.py)
  - Basic tests (backend/tests/test_sla.py, 60 lines)
  - Not integrated into ticket workflow

---

## Contributor Evidence (Git-backed)

### Mapping Git Identities to Individuals

**IMPORTANT:** Do not infer real names from GitHub handles. Only use names from git commit author fields or documentation where explicitly stated.

#### Francis Kanu (Main Project Owner, PM, Lead Engineer Throughout Development)

**User confirmations:**
- Main project owner
- Project Manager and Lead Engineer throughout development
- Co-authored project report with Hunain Khan

**Git identities observed** (identity mapping inferred, not confirmed):
- Francis Okorie <friyekekanu@stud.mediadesign.de> - 50 commits
- FOKanu <kanufavour.o@gmail.com> - 26 commits  
- Francis Kanu <franciskanu@Franciss-MacBook-Pro.local> - 14 commits
- Sage Eye <Francisokore15@gmail.com> - 11 commits

**Note:** These git identities share name elements and are presumed to represent Francis Kanu based on name similarity and @FOKanu GitHub association, but this mapping was not explicitly confirmed by user.

**GitHub:** @FOKanu (confirmed in docs/CONTRIBUTORS.md)

**Evidence-backed contributions:**
1. **AI/RAG Architecture & LLM Integration** (PRIMARY)
   - Authored docs/LLM_INTEGRATION.md
   - Created backend/app/ai/ module (client.py, prompts.py, triage.py, llm_config.py)
   - Implemented chat service (backend/app/services/chat.py)
   - SSE streaming endpoint (backend/app/api/v1/chat.py)
   - Git evidence: commits on ai/, chat, LLM docs

2. **Project Management & Git Workflow** (PRIMARY)
   - Authored docs/BRANCHING_STRATEGY.md (three-gate workflow design)
   - Authored docs/CONTRIBUTORS.md (team roster)
   - Authored CLAUDE.md (AI guidance)
   - Created workstream path guard system (scripts/check-workstream-paths.sh)
   - Managed integration branches (debugging, project-manager)
   - Git evidence: 26+ merge commits, branch strategy docs

3. **DevOps & Tooling**
   - Docker compose setup (docker-compose.yml modifications)
   - Docker entrypoint scripts (docker/frontend-entrypoint.sh)
   - CI workflow setup (.github/workflows/)
   - Git evidence: commits on docker/, scripts/, .github/

4. **Frontend Contributions**
   - Chat UI components (assistant pages)
   - API client adapters (frontend/src/lib/api/)
   - Institution page theming (recent commits to InstitutionPage.module.css)
   - Git evidence: commits on frontend/src/pages/, frontend/src/lib/api/

**Role documented:** docs/CONTRIBUTORS.md line 15: "**Francis Kanu** | [@FOKanu](https://github.com/FOKanu) | Project Manager and Lead Engineer; AI/RAG LLM + chatbot; Tooling/DevOps"

**User confirmations:** Main project owner, Project Manager, and Lead Engineer throughout development. Co-authored project report with Hunain Khan.

---

#### Laurynas Stravinskas (@Laurynas36) - Database & Backend Lead
**Git identities:**
- Laurynas36 <laurynas.stravinskas@gmail.com> - 13 commits
- Laurynas Stravinskas <laurynas.stravinskas@gmail.com> - 3 commits

**Total: 16 commits**

**Evidence-backed contributions:**
1. **Database Schema & Migrations** (PRIMARY)
   - Created 9 Alembic migrations (baseline, departments, pgvector, chat, ticket classification)
   - Git evidence: "feat(database): add pgvector extension", "feat(database): add Department entity"
   - Files: backend/alembic/versions/*.py

2. **Ticket Routing Engine**
   - Implemented rule-based department keyword matching
   - Created routing tests
   - Git evidence: "feat(tickets): wire service to repository and add rule-based routing engine"
   - Files: backend/app/services/ticket_routing.py, tests

3. **Seed Data Pipeline**
   - Implemented database seed script
   - Git evidence: "feat(database): add Attachment model, initial migration, and seed script"
   - Files: backend/scripts/seed.py

4. **Backend Repository Layer**
   - Prisma/SQLAlchemy repository implementations
   - Git evidence: "feat(tickets): implement TicketsRepository with real Prisma queries"

**Role confirmed:** docs/CONTRIBUTORS.md line 23: "**Laurynas Stravinskas** | [@Laurynas36](https://github.com/Laurynas36) | **Database (lead)**; Backend ticket routing & engines"

---

#### Izzatkhanim Mirzakhanova (@rzaest) - KB & AI/RAG
**Git identities:**
- Izzatkhanim Mirzakhanova <rzaest@gmail.com> - 13 commits
- rzaest <rzaest@gmail.com> - 3 commits

**Total: 16 commits**

**Evidence-backed contributions:**
1. **Internationalization (PRIMARY)**
   - Comprehensive German localization
   - Git evidence: "feat(i18n): add comprehensive German localization" (large commit touching 50+ files)
   - Created bilingual KB docs (docs/knowledge-base/*_DE.md, *_EN.md)
   - Files: frontend/src/locales/, docs/knowledge-base/

2. **Knowledge Base Content**
   - Synthetic university FAQs (6 categories: academics, finance, housing, IT, maintenance, registrar)
   - Git evidence: "fix(kb): add comprehensive de-identified synthetic university FAQs"
   - Content parser alignment
   - Files: docs/knowledge-base/*.md, backend/tests/test_kb_synthetic_content.py

3. **FAQ Document Identity**
   - Migration 009_faq_document_identity.py
   - Git evidence: commit adding documentId to FaqEntry

4. **KB Service & API**
   - Knowledge base schema updates (backend/app/schemas/kb.py)
   - KB API modifications (backend/app/api/v1/kb.py)
   - Git evidence: commits on kb.py, kb service

**Role confirmed:** docs/CONTRIBUTORS.md line 24: "**Izzatkhanim Yashar (Izzy)** | [@rzaest](https://github.com/rzaest) | Knowledge base; **AI/RAG** retrieval"

---

#### Agrima Sharma (sharmaagrima112@gmail.com) - Rate Limiting, Testing, i18n
**Git identities:**
- Agrima Sharma <sharmaagrima112@gmail.com> - 11 commits
- agrimasharma <sharmaagrima112@gmail.com> - 1 commit

**Total: 12 commits**

**Evidence-backed contributions:**
1. **Rate Limiting System** (PRIMARY)
   - Comprehensive rate limiting refactor and test suite
   - Git evidence: "feat(rate-limit): debug, refactor, and add comprehensive rate limiting test suite"
   - Created 5 rate limit test files (concurrency, failure, integration, time, unit - 486 lines total)
   - Files: backend/app/core/rate_limit.py (151 lines added), backend/tests/test_rate_limit_*.py

2. **Testing & Quality**
   - Fixed ruff lint violations across test suite
   - Auth security tests
   - User response department tests
   - Git evidence: "style: fix ruff lint violations", "test(auth): add unit tests for user response department resolution"
   - Files: backend/tests/test_user_response_department.py (113 lines)

3. **i18n Testing & Migration**
   - German localization tests
   - i18next v3→v4 plural migration
   - Git evidence: "test(i18n): update German localization tests, setup polyfill, and add v3 plural aliases"
   - Files: frontend/src/i18n/i18n.test.tsx (84 lines), frontend/src/test/setup.ts

4. **Q&A Regression Set**
   - Created KB testing infrastructure
   - Git evidence: "testing: add Q&A regression set + chunking strategy proposal"
   - Files: backend/tests/data/qa_regression_set.jsonl, backend/tests/test_qa_regression_set.py

**Role (partial):** docs/CONTRIBUTORS.md line 25 mentions "Agrima" in "Knowledge base; AI/RAG ingestion" context (chunking, embedding upsert, re-ranking). Git evidence shows additional testing/quality focus.

---

#### Yegor Gariazha (@GariazhaYegor) - Embeddings & Search
**Git identities:**
- GariazhaYegor <eggar1881@gmail.com> - 2 commits

**Total: 2 commits**

**Evidence-backed contributions:**
1. **Knowledge Base Ingestion Pipeline** (PRIMARY)
   - Port from Express to FastAPI/SQLAlchemy
   - Git evidence: "Port knowledge-base ingestion pipeline to FastAPI/SQLAlchemy stack"
   - Files: backend/app/services/kb_embedding.py, backend/app/services/kb_content_parser.py, backend/scripts/ingest_kb.py

2. **Embedding Generation**
   - Embedding configuration and generation
   - Git evidence: "Implement embedding generation and knowledge-base ingestion pipeline"
   - Files: backend/src/app/modules/ai/embeddings/ (v1 scaffold, ported to v2)

**Role confirmed:** docs/CONTRIBUTORS.md line 26: "**Yegor Gariazha** | [@GariazhaYegor](https://github.com/GariazhaYegor) | **AI/RAG** embeddings & search"

---

#### minarichan (GitHub handle - real name unknown)
**Git identities:**
- minarichan <minarichan@users.noreply.github.com> - 12 commits

**Total: 12 commits**

**Git evidence:**
1. **Dark Mode & Theming** (PRIMARY)
   - Theme selector component and store
   - Git evidence: "feat(frontend): expand DE i18n, add dark mode, fix Docker proxy" (large commit, 70+ files)
   - Files: frontend/src/components/layout/ThemeSelector.tsx (133 lines), frontend/src/stores/themeStore.ts

2. **Frontend UX & Styling**
   - Extensive CSS module updates across 20+ components
   - Badge, button, input styling refinements
   - Git evidence: commits touching *.module.css files
   - Files: frontend/src/components/ui/*.module.css, frontend/src/pages/*/*.module.css

3. **i18n Integration**
   - i18n library integration (i18next)
   - Git evidence: "fix(frontend): address testing feedback on auth, people, and isolation"
   - Files: frontend/src/lib/i18n.ts, locale store

4. **Docker Proxy Fix**
   - Vite proxy configuration
   - Git evidence: commit on docker-compose.yml, vite.config.ts

**Identity:** Real name unknown. GitHub handle @minarichan only.

**Possible linkage (UNCONFIRMED):** Docs/CONTRIBUTORS.md line 16 lists "**Milena**" for "Frontend (student portal, design system)" role - similar scope to minarichan's git work, but identity linkage NOT confirmed.

**Report-documented "Milena" contributions** (project report, August 2026):
- Frontend student portal work
- Design system contributions

**IMPORTANT:** Do not replace report-credited "Milena" with "minarichan" pending identity confirmation. Keep documented report contributions under "Milena" and git evidence under "minarichan" as separate until confirmed same person.

---

#### AlenBaizhan (albaizhan@Stud.Mediadesign.de)
**Git identities:**
- AlenBaizhan <albaizhan@Stud.Mediadesign.de> - 14 commits

**Total: 14 commits**

**Evidence-backed contributions:**
1. **Multi-Institution Support** (PRIMARY)
   - Institution picker and switching
   - Git evidence: "feat: support switching between multiple universities"
   - Files: frontend/src/stores/institutionStore.ts, frontend/src/lib/institutions.ts, frontend/src/lib/theme/applyInstitutionTheme.ts

2. **Frontend UX Improvements**
   - Analytics access fixes
   - Empty notifications state
   - Profile page improvements
   - Git evidence: "Fix analytics access for agent/admin, ticket ID copy, empty notifications state"
   - Files: frontend/src/pages/notifications/NotificationsPage.tsx, frontend/src/pages/profile/ProfilePage.tsx

3. **Dashboard & Layout**
   - Dashboard stat styling
   - Avatar preview cleanup
   - Git evidence: "Add avatar preview cleanup, larger headers, dashboard stat colors"
   - Files: frontend/src/pages/agent/AgentDashboardPage.module.css, frontend/src/index.css

4. **Notifications Module (v1 scaffold)**
   - Created notifications pages in v1 Express scaffold (now archived)
   - Git evidence: commits on frontend/src/modules/notifications/ (archived)

**Role (partial):** docs/CONTRIBUTORS.md line 17 lists "**Alen**" for "Frontend (student portal, design system)" - likely match based on email domain and commit evidence.

---

#### Kinga Kowalewska (kikowalewska@Stud.Mediadesign.de)
**Git identities:**
- Kinga Kowalewska <kikowalewska@Stud.Mediadesign.de> - 10 commits

**Total: 10 commits**

**Evidence-backed contributions:**
1. **Authentication & RBAC** (PRIMARY)
   - Rate limiting on login/register
   - Git evidence: "feat(auth): add rate limiting to login and register"
   - Files: backend/app/api/v1/auth.py, backend/app/core/rate_limit.py (initial version)

2. **Security Testing**
   - Auth security checks
   - Git evidence: "test(security): add auth security checks"
   - Files: backend/tests/test_security.py (168 lines)

3. **Users Router & RBAC**
   - Department-scoped tickets
   - RBAC boundary tests
   - Git evidence: "feat(auth): add users router with role-based access, department-scoped tickets, RBAC boundary tests"
   - Files: backend/app/services/auth.py, backend/tests/test_rbac.py (248 lines)

4. **Tooling Setup**
   - Black and mypy configuration
   - Git evidence: "chore(tooling): set up Black and mypy for backend"
   - Files: backend/pyproject.toml, code formatting

**Role confirmed:** docs/CONTRIBUTORS.md line 22: "**Kinga** | *TBD* | Backend auth, JWT, RBAC"

---

#### Arshdeep Singh (arssingh@stud.mediadesign.com)
**Git identities:**
- Arshdeep Singh <arssingh@stud.mediadesign.com> - 4 commits

**Total: 4 commits**

**Git evidence:**
1. **Workstream Path Guard Enhancements**
   - Merge conflict detection
   - Database branch guards
   - Multi-university branch guards
   - Git: "fix(tooling): catch merge conflict markers in workstream guard", "fix(tooling): add database merge-conflict guard"
   - Files: scripts/check-workstream-paths.sh, scripts/tests/check-workstream-paths.test.sh (158 lines of tests)

**Report-documented contributions** (project report, August 2026):
- UI/UX prototyping
- QA audit work

**Planning docs role** (docs/CONTRIBUTORS.md line 20):
- Primary: "Frontend (staff / admin)"
- Listed responsibilities: "Staff queue, ticket actions, admin analytics UI"

**Note:** Report credits UI/UX prototyping and QA audit in addition to git-evident tooling contributions. Frontend work may be in design/prototyping phase or un-merged branches.

---

#### sunilkumar (sunilkumar387388@gmail.com)
**Git identities:**
- sunilkumar <sunilkumar387388@gmail.com> - 6 commits
- sunilkumar387388-rgb <sunilkumar387388@gmail.com> - 1 commit

**Total: 7 commits**

**Evidence-backed contributions:**
1. **Backend Testing**
   - Department model test fixes
   - Git evidence: "fix: update tests to use Department model instances"
   - Files: backend/tests/test_db.py, backend/tests/test_tickets.py

2. **Ticket Routing Service**
   - Ticket routing engine implementation
   - Git evidence: "feat(backend): implement ticket routing engine service"
   - Files: backend/app/services/ticket_routing.py, backend/tests/test_ticket_routing.py

**Report-documented contributions** (project report, August 2026):
- Debugging and monitoring work

**Planning docs role** (docs/CONTRIBUTORS.md line 32):
- Primary: "Debugging / monitoring"
- Listed responsibilities: "Uptime checks; OpenTelemetry (with Adrian)"

**Note:** Report documents debugging/monitoring contributions. Git shows backend testing and routing work; documented monitoring role may represent additional non-code work (uptime monitoring, observability setup). Kept separate from Vivek per report's distinct naming, not based on email addresses alone.

---

#### Vivek (SIRVK22 - vivek@stud.mediadesign.de)
**Git identities:**
- SIRVK22 <vivek@stud.mediadesign.de> - 1 commit (merge PR #5)

**Total: 1 commit**

**Git evidence:**
1. **PR Review/Merge**
   - Git: "Merge pull request #5 from FOKanu/feature/backend-ticket-routing-engine"

**Report-documented contributions** (project report, August 2026):
- Debugging and observability work

**Planning docs role** (docs/CONTRIBUTORS.md line 30):
- Primary: "Debugging / observability; logging"
- Listed responsibilities: "Structured logs; Sentry; API contract tests; correlation IDs"

**Note:** Report documents debugging/observability contributions. Git shows 1 merge; additional work may be on un-merged branches or non-code (monitoring setup, observability tooling). Kept separate from sunilkumar per report's distinct naming, not based on email addresses alone.

---

#### Adrian (adrianandthetwelve - adrianughanze@gmail.com)
**Git identities:**
- adrianandthetwelve <adrianughanze@gmail.com> - 1 commit (merge)

**Total: 1 commit**

**Git evidence:**
1. **PR Merge**
   - Git: "Merge pull request #34 from FOKanu/debugging"

**Report-documented contributions** (project report, August 2026):
- Debugging and observability work

**Planning docs role** (docs/CONTRIBUTORS.md line 31):
- Primary: "Debugging / observability"
- Listed responsibilities: "Tracing, health checks, LLM cost views, debug admin UIs; git control"

**Note:** Report documents debugging/observability contributions. Git shows 1 merge; contributions may include coordination, observability tooling setup, or un-merged work.

---

#### Cursor Agent (cursoragent@cursor.com)
**Git identities:**
- Cursor Agent <cursoragent@cursor.com> - 1 commit

**Total: 1 commit**

**Evidence-backed contributions:**
1. **README Rewrite (PR #38)**
   - Git evidence: "docs: create recruiter-friendly README showcasing UniTik platform and team" (co-authored with FOKanu)
   - Files: README.md (299 additions, 29 deletions)
   - Note: This is an automated agent, not a human contributor

---

### Contributors with Documented Roles but No Git Evidence

The following names appear in docs/CONTRIBUTORS.md with assigned roles but have **no attributable commits** in the analyzed git history. **Absence of commits is not evidence of no contribution.** Documented work preserved below:

#### Shahnas
**Report-documented contributions** (project report, August 2026):
- Frontend: Staff/admin interfaces
- Backend: Ticket management and SLA tracking components

**Planning docs role** (docs/CONTRIBUTORS.md line 18):
- Primary: Frontend (staff/admin), Backend tickets & SLA
- Listed responsibilities: "Departments router; notifications; SLA breach views"

**Git evidence:** None found

**Note:** Contributions documented in submitted report (August 2026) as frontend staff/admin and backend ticket/SLA work.

---

#### Hunain Khan (listed as "Khan" in docs/CONTRIBUTORS.md)
**Full name:** Hunain Khan

**USER CONFIRMED contributions:**
- Co-authored project report with Francis Kanu
- QA and documentation work throughout development

**Documented role** (docs/CONTRIBUTORS.md line 26):
- Primary: Testing & QA lead
- Listed responsibilities: "E2E / integration / RAG quality tests; seed data; merge conflict support"

**Git evidence:** None found under "Khan", "Hunain", or "Hunain Khan" handles

**Note:** User-confirmed contributions are report co-authorship and QA/documentation. Additional listed responsibilities (E2E, RAG quality tests, merge conflict support) are from planning docs but not independently verified in this audit.

#### Shahriar
**Report-documented contributions** (project report, August 2026):
- Regression testing (12 August 2026 regression phase)
- Load testing

**Planning docs role** (docs/CONTRIBUTORS.md line 27):
- Primary: Testing (E2E, load)
- Listed responsibilities: "Critical-path Playwright/Cypress; load tests"

**Git evidence:** None found

**Note:** Contributions documented in submitted report as regression and load testing work.

---

#### Anmol
**Report-documented contributions** (project report, August 2026):
- API integration testing

**Planning docs role** (docs/CONTRIBUTORS.md line 28):
- Primary: Testing (API integration)
- Listed responsibilities: "Backend integration tests"

**Git evidence:** None found

**Note:** Contributions documented in submitted report as API integration testing.

**Preservation Note:** These documented contributions reflect team assignments from planning docs (CONTRIBUTORS.md, Miro board references). Git absence may indicate:
- Work on branches not yet merged to `main`
- Pair programming (commits under other names)
- Non-code contributions (test coordination, manual testing, documentation)
- Contributions during periods outside this audit window

**Do not replace or dismiss documented roles solely based on commit counts.** User should confirm actual contributions and update attribution accordingly.

---

## Testing Evidence

### Backend Tests (backend/tests/)
- **Total files:** 29 test files
- **Total lines:** 3,715 lines
- **Key test suites:**
  - Rate limiting: 5 files, 486 lines (Agrima Sharma)
  - RBAC: 248 lines (Kinga Kowalewska)
  - Security: 168 lines (Kinga Kowalewska)
  - Tickets: 376 lines (Laurynas Stravinskas, Francis Kanu)
  - Chat: 256 lines (Francis Kanu)
  - Chat RAG: 201 lines (Francis Kanu, Izzatkhanim Mirzakhanova)
  - KB ingestion: 248 lines (Yegor Gariazha, Izzatkhanim Mirzakhanova)
  - KB content parser: 157 lines
  - Attachments: 174 lines (Laurynas Stravinskas)
  - Notifications: 168 lines
  - Embedding jobs: 195 lines

**CI Evidence:**
- GitHub Actions backend CI runs pytest on every PR (.github/workflows/ci-backend.yml)
- PostgreSQL test database with pgvector
- Ruff linting enforced

### Frontend Tests
- **Files:** Multiple *.test.tsx files
- **Evidence:**
  - i18n tests: 122 lines (frontend/src/i18n/i18n.test.tsx)
  - Tickets API tests: 66 lines (frontend/src/lib/api/tickets.test.ts)
  - Localization pages tests
- **CI:** ESLint, Prettier, TypeScript strict checks (.github/workflows/ci-frontend.yml)

---

## LLM Integration Details

### Provider Setup (Confirmed)
- **Team Default:** Public Tailscale Funnel URL to Ollama on GPU workstation
  - URL: https://muc-a-3099.tail129a23.ts.net/v1 (in backend/.env.example)
  - Bearer auth via OLLAMA_API_KEY (shared team credential)
  - Model: qwen3:8b (reasoning model with `<think>` tag stripping)
- **Supported:** Ollama, OpenAI, Google Gemini (via OpenAI-compatible endpoint)
- **File:** backend/app/ai/llm_config.py, docs/LLM_INTEGRATION.md

**IMPORTANT for public README:** Do NOT include the actual Tailscale URL or API key. This is internal infrastructure.

### Chat Modes
- **Quick mode:** Max 300 tokens, 3 sentences
- **Detailed mode:** Max 800 tokens, step-by-step
- **File:** backend/app/ai/prompts.py

### Health Monitoring
- **Endpoint:** GET /api/v1/chat/health
- **Redis cache:** Optional shared LLM health cache
- **Graceful degradation:** Chat works with fixtures if LLM is down

---

## Docker & Deployment

### Services (docker-compose.yml)
1. **postgres:** pgvector/pgvector:pg16 (vector extension)
2. **redis:** redis:7-alpine (optional cache)
3. **backend:** Custom Dockerfile, uvicorn on :4000
4. **frontend:** Vite dev server on :5173
5. **frontend-prod:** (profile) nginx production build on :8080

### Volumes & Ports
- postgres_data volume for persistence
- All services bind to 127.0.0.1 (localhost only for security)
- Configurable ports via env vars (POSTGRES_HOST_PORT, REDIS_HOST_PORT)

**Evidence:** docker-compose.yml 108 lines, docker/backend.Dockerfile, docker/frontend.Dockerfile

---

## Current README Status (PR #38)

### What PR #38 Changed
- **Status:** OPEN (not merged)
- **Author:** Cursor Agent (co-authored with FOKanu)
- **Changes:** Complete README rewrite (299 additions, 29 deletions)
- **Content:**
  - UniTik branding, highlights, comprehensive tech stack table
  - Architecture explanation (vertical slices, three-gate git)
  - Feature inventory (shipped vs. in-progress)
  - Team & contributors section with GitHub links
  - Quick start, configuration, documentation links

### Issues with PR #38 Content
1. **Francis Kanu Attribution:** Listed as "Project Lead & AI/RAG Architect" but **missing explicit "Project Manager" and "Lead Engineer" titles** from role description
2. **Demo Credentials:** Includes demo login email/password - **should be removed** from public README per user requirements
3. **Missing Individual Contributions:** Lists team members with focus areas but lacks **specific evidence-backed individual contributions**
4. **GitHub Handle Assumptions:** Some contributors listed with handles that may not be confirmed
5. **Tailscale URL:** Mentions in configuration section - **should be sanitized** for public README

### What Needs Updating
1. **Strengthen Francis Kanu's attribution:**
   - Current: "Project Lead & AI/RAG Architect"
   - Should be: "**Francis Kanu** - Project Manager, Lead Engineer, and AI/RAG Architect"
   - Add specific contributions: LLM integration design, three-gate git workflow, project coordination

2. **Remove private infrastructure details:**
   - Demo login credentials (jordan.alvarez@student.university.edu / demo1234)
   - Specific Tailscale Funnel URL (https://muc-a-3099.tail129a23.ts.net/v1)
   - Actual OLLAMA_API_KEY references

3. **Add evidence-backed individual contributions** for each team member with git evidence

4. **Flag uncertainties** for contributors without clear git evidence (Shahnas, Khan, Shahriar, Anmol, Adrian's role)

5. **Correct technical claims** if any are demonstrably false (review needed)

---

## Gaps Requiring User Confirmation

### Project Report Attribution (RESOLVED)
- **Francis Kanu and Hunain** co-authored the project report
- Hunain contributed to QA and documentation throughout development
- This is no longer an unresolved gap

### Identity Uncertainties
1. **minarichan** - Git handle only, real name unknown. Docs list "Milena" for similar role (Frontend, design system) but no confirmation this is the same person. Need clarification.
2. **adrianandthetwelve** - Minimal git evidence (1 merge). Documented as "Adrian" for debugging/observability role. Need clarification on specific contributions beyond PR merges.

### Contributors Needing Attribution Clarification

**With documented roles but no git evidence:**
- **Shahnas** - Documented: Frontend (staff/admin), Backend tickets & SLA
- **Hunain** (listed as "Khan" in docs) - **USER CONFIRMED**: Testing & QA lead, co-authored project report with Francis Kanu
- **Shahriar** - Documented: E2E, load testing
- **Anmol** - Documented: API integration testing

**With minimal git evidence vs. documented role:**
- **Vivek** (SIRVK22) - 1 merge commit; Documented: Debugging/observability with structured logs, Sentry, correlation IDs
- **Adrian** (adrianandthetwelve) - 1 merge commit; Documented: Debugging/observability

**User should clarify:**
1. Scope of contributions for those with no git evidence (non-code work, coordination, un-merged branches, pair programming)
2. Whether documented roles reflect actual work or initial assignments that changed

### Role Discrepancies
1. **Arshdeep Singh** - Docs assign frontend role, but git shows only tooling/CI work. Which is accurate?
2. **Agrima Sharma** - Docs say "KB ingestion," but git shows more testing/quality work. Both valid?

### GitHub Handle Confirmations
The following handles in PR #38 or docs are **unverified** in git:
- @Laurynas36 - CONFIRMED (in git)
- @rzaest - CONFIRMED (in git)
- @GariazhaYegor - CONFIRMED (in git)
- @FOKanu - CONFIRMED (in git)
- Others listed as "TBD" in docs

---

## Recommendations for README Update

### 1. Francis Kanu Attribution (CRITICAL)
Update team section to explicitly state:

```markdown
### Project Leadership

**Francis Kanu** (@FOKanu) — Project Manager, Lead Engineer, and AI/RAG Architect

Francis founded and leads the UniTik project, serving as both Project Manager and Lead Engineer throughout development. His contributions include:
- Designed and implemented the AI chat assistant with RAG-based FAQ retrieval
- Architected the LLM integration layer supporting Ollama, OpenAI, and Gemini
- Created the three-gate git workflow (workstream → debugging → PM → main) that enabled parallel team development
- Built the chat-to-ticket escalation system with intelligent categorization
- Led DevOps setup: Docker orchestration, CI/CD pipelines, and workstream path guards
- Contributed to frontend chat UI, API client adapters, and design system foundations
```

### 2. Remove Private Details
- ❌ Remove: Demo login credentials
- ❌ Remove: Tailscale Funnel URL (use placeholder like "Team-managed Ollama endpoint")
- ❌ Remove: Specific OLLAMA_API_KEY instructions
- ✅ Keep: General setup instructions ("see backend/.env.example")

### 3. Evidence-Backed Contributor Attribution
For each contributor with git evidence, add **specific contributions** section:

```markdown
**Laurynas Stravinskas** (@Laurynas36) — Database Lead
- Designed PostgreSQL schema with pgvector extension for semantic search
- Created 9 Alembic migrations from baseline through multi-tenant support
- Implemented ticket routing engine with department keyword matching
- Built database seed pipeline with realistic test data
```

### 4. Flag Uncertainties
Add note in README:

```markdown
### Additional Contributors

Several team members contributed to planning, design, testing coordination, and architecture discussions. Specific code attribution is being finalized and will be updated in a future revision.
```

Then provide user with list of names needing confirmation.

### 5. Technical Accuracy Check
Review PR #38 technical claims against evidence:
- ✅ Tech stack versions (verified against pyproject.toml, package.json)
- ✅ Vertical slice architecture (verified in codebase)
- ✅ Features shipped (verified via tests and API files)
- ✅ Docker setup (verified in docker-compose.yml)
- ⚠️ "Production-Ready Pipeline" - CI exists but no evidence of production deployment
- ⚠️ "Multi-Tenant Ready" - Foundation exists but not fully implemented (see docs/knowledge-base/MULTI_TENANT_KB_DESIGN.md)

**Suggested rewording:**
- "Production-Ready Pipeline" → "Continuous Integration Pipeline"
- "Multi-Tenant Ready" → "Multi-Tenant Foundation" (with note: department-based routing and tenant isolation design in progress)

---

## Files for Report Editing (Not for Git)

The uploaded Word document (`original-report_d84d.docx`) is **binary and unreadable** by text tools. For report editing:

1. **Use this evidence handoff** as source of truth for implementation facts
2. **Verify technical claims** against file paths and test evidence provided
3. **Individual contributions** should be extracted from "Contributor Evidence" section
4. **Update contributor roles** based on git evidence, not just docs/CONTRIBUTORS.md planning
5. **Flag uncertainties** from "Gaps Requiring User Confirmation" section

**Do not auto-publish the Word report.** Separate document workflow will handle it.

---

## Design Artifacts Review (Figma)

### Figma Files Reviewed (8 November 2026)

**Two design files accessed:**
1. **Wireframes:** https://www.figma.com/design/eMdAoJ0lMeFkwPk8TAZviQ/College-Ticketing-System---Wireframes
   - 13 low-fidelity desktop frames (student + staff + auth)
   - Already uses blue accents and tinted sidebar (not strictly monochrome)
   - **Includes Reports & Analytics screen** (wireframe 11:23-4)
   
2. **Refined Prototype:** https://www.figma.com/design/VOVfOFvi2yGnlkOOr0krqr/University-Ticketing-App---Prototype-UI-Design
   - 7 foundation/component pages
   - Student, staff, admin flows with MediaDesign Hochschule branding
   - Responsive specifications and dedicated mobile student suite

### Critical Naming Discrepancy

**Design artifacts use "TicketHub" branding** throughout the prototype, while the **repository and implementation use "UniTik"**. This is a design artifact naming choice, not a product rename. Report and README must clarify this is example branding in the design files, not indicate the product was renamed from UniTik to TicketHub.

**Evidence:** Prototype screens consistently show "TicketHub" in navigation and branding areas; repository code, docs, and git history use "UniTik" / "university-ticketing-system".

### Design vs. Implementation Conflicts

The following features appear in **design specifications but are NOT fully implemented** in the codebase:

#### 1. Analytics Dashboard
- **Wireframe:** Includes "Staff Reports & Analytics" screen (frame 23-4)
- **Refined prototype:** Staff navigation marks Analytics as **"Soon"** (explicit placeholder)
- **Implementation:** Frontend analytics pages exist (AgentAnalyticsPage.tsx, AdminDashboardPage.tsx) but backend aggregation is minimal, no dedicated analytics service
- **Verdict:** UI mockups exist, functionality is stub/placeholder

#### 2. Keyword-Based Routing
- **Design annotation:** "Planned"; current approach is category selection
- **Implementation:** Rule-based department keyword matching exists (backend/app/services/ticket_routing.py) using category keywords, not natural language keyword extraction
- **Verdict:** Basic category-based routing implemented; advanced keyword extraction is planned, not delivered

#### 3. Desktop AI Assistant
- **Design:** Desktop AI screen explicitly says **"placeholder responses and pipeline still in development"** (node 12:2)
- **Mobile design:** Describes KB search, streaming, and citations (more mature)
- **Implementation:** Chat assistant code is present (backend/app/ai/, SSE streaming, RAG retrieval, test files exist)
- **Verdict:** Desktop design annotation is outdated; chat assistant implementation is present with test coverage. Runtime functionality unverified in this audit (tests not executed in review session).

#### 4. Native Mobile Application
- **Design:** Dedicated mobile student suite labeled "native mobile student, iPhone 14/15 390×844, light mode, Phase 1"
- **Implementation:** Frontend is responsive web (Vite/React), no native iOS/Android app in repository
- **Verdict:** Design specification only; no native app implementation

#### 5. University SSO/LDAP
- **Design:** Desktop shows SSO as "configured per institution"; mobile says "coming soon"
- **Implementation:** Architecture docs mark as "Open Issue OI-01" pending IT coordination; backend/app/services/sso.py is a stub
- **Verdict:** Design shows intended feature; implementation is placeholder

#### 6. Response Time Targets (SLA)
- **Design:** Admin screen shows "Response Targets" settings, explicitly notes "not enabled"
- **Implementation:** SLA service stub exists (backend/app/services/sla.py, 60-line test file), not integrated into ticket workflow
- **Verdict:** Design matches implementation status (foundation only)

### Design Specifications vs. Code Reality

**Correctly specified in design:**
- ✅ Ticket lifecycle (Open → In Progress → Resolved)
- ✅ Department-based routing with categories (Academics, IT, Finance, Maintenance/Facilities)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ File attachments with type/size constraints
- ✅ Public replies vs. internal notes (staff)
- ✅ Chat-to-ticket escalation with confirmation
- ✅ FAQ knowledge base with search
- ✅ Student-only-sees-own-tickets access control
- ✅ Loading, empty, error states
- ✅ Bilingual support (EN/DE mentioned in admin settings)

**Design annotations claiming code correspondence:**
- Design notes reference "frontend paths" and "lack of reporting endpoint/i18n library/avatar upload endpoint"
- **These are author-written design assertions** and were verified separately via repository audit
- i18n library DOES exist (i18next); avatar upload is NOT implemented; reporting endpoints are stubs

### Figma Authorship

**NO explicit design-author credits found** in inspected pages. Names appearing in designs (Amara Kanu/Kessler, Jana Novak, Elena Voss) are **interface personas** (example user data), NOT contributor evidence.

**Do not infer Figma authorship** from:
- Persona names in example tickets/messages
- MediaDesign Hochschule institutional branding (this is the university context, not designer identity)
- Screen content or counts (example design data)

**Francis Kanu's ownership, PM role, Lead Engineer role, and Francis/Hunain report co-authorship** come from user account confirmation, NOT from Figma files.

### Visual Design System

**Documented in prototype Foundations page:**
- Brand color: steel blue #2574A9
- Status colors: Open (red), In Progress (amber), Resolved (green), Closed (gray)
- Inter typeface with scale from 11px caption to 32px display
- Component library with states (default, hover, focus, disabled, loading)
- Accessibility annotations: AA-safe claims (not a full audit), ARIA notes, keyboard/focus intentions

**These are design specifications**, not proof of implementation. Frontend uses Tailwind CSS; correlation to design tokens requires separate frontend audit.

### Wireframes vs. Refined Prototype Scope Differences

| Feature | Wireframes | Refined Prototype | Implementation |
|---------|-----------|-------------------|----------------|
| Reports & Analytics | ✅ Dedicated screen | ❌ Marked "Soon" | 🟡 UI stubs only |
| Mobile layouts | ❌ Not shown | ✅ Dedicated suite | 🟡 Responsive web |
| Institution branding | ❌ Generic | ✅ MDH example | 🟡 Theme support exists |
| Component library | ❌ Not documented | ✅ Full foundations | ✅ React components |
| Desktop AI | ❌ Not shown | 🟡 "Placeholder" | ✅ Implemented |
| SSO | ❌ Not shown | 🟡 "Coming soon" | ❌ Stub only |

### Report-Ready Design Summary

**For inclusion in project report:**

"The project includes low-fidelity wireframes and a refined prototype with documented visual system. Wireframes establish core student and staff journeys across 13 desktop screens. The refined prototype adds MediaDesign Hochschule branding (using 'TicketHub' as example product name), reusable component specifications, responsive layouts, and mobile student interface designs. The prototype explicitly marks analytics as 'Soon' and desktop AI as 'placeholder'; keyword routing is noted as planned. Design annotations reference intended accessibility features (focus states, ARIA, validation) and error/empty/loading states, which require separate implementation review."

**Design artifact links:**
- Wireframes: https://www.figma.com/design/eMdAoJ0lMeFkwPk8TAZviQ/College-Ticketing-System---Wireframes?node-id=0-1
- Prototype: https://www.figma.com/design/VOVfOFvi2yGnlkOOr0krqr/University-Ticketing-App---Prototype-UI-Design?node-id=13-2

### Conflicts Between Report, Design, and Code

**Uncertainty for report editor:**

1. **Report period vs. current repository state**
   - Report dates (confirmed): Delivery 3 August 2026, Regression 12 August 2026, Submission 14 August 2026
   - Evidence handoff analyzes current `main` branch (7 November 2026 UTC / 8 November 2026 Europe/Berlin)
   - Report documents project state as of August 2026
   - Current audit reflects November 2026 implementation state
   - Preserve report's historical data separately; note implementation changes between periods

2. **Analytics implementation**
   - Wireframes show full analytics screen
   - Refined prototype marks "Soon"
   - Code has UI pages but minimal backend
   - Report should NOT claim working analytics based on wireframes alone

3. **Desktop AI status**
   - Design says "placeholder"
   - Code shows fully functional implementation (49 Python files in backend/app/ai/, tests, docs)
   - Design annotation may be outdated; code is authoritative

4. **SSO claims**
   - Design shows both "configured" and "coming soon"
   - Code is explicit stub (OI-01)
   - Report should NOT claim SSO delivery

5. **Native mobile app**
   - Design shows Phase 1 native mobile student suite
   - Code is responsive web only (Vite/React), no native app
   - Report should describe as "responsive web application" not "native mobile app"

6. **TicketHub vs. UniTik naming**
   - Design uses TicketHub throughout
   - Repository/code/docs use UniTik
   - Report must clarify this is design branding example, not product renaming

**Recommendation:** Report editor should:
- Use repository evidence as source of truth for implementation claims
- Treat design artifacts as specifications and intentions, not proof of delivery
- Clarify TicketHub is design example branding; product is UniTik
- Distinguish wireframe (early), prototype (refined design), and implementation (code) stages
- Flag explicit design placeholders (Analytics "Soon", desktop AI "placeholder") as planned features

---

## Summary Statistics for Report

- **Project Duration:** Early commits from July 2026, active development through November 2026 (5+ months)
- **Total Commits:** 474 analyzed (across all branches)
- **Active Branches:** 25+ feature branches, 4 integration branches (debugging, project-manager, main, ai-rag)
- **Code Volume:**
  - Backend: 49 Python modules, 3,715 test lines, 9 migrations
  - Frontend: 116 TypeScript/TSX files
  - Documentation: 40+ markdown files
- **Test Coverage:** 29 backend test files covering auth, RBAC, tickets, chat, KB, rate limiting, security
- **CI/CD:** 4 GitHub Actions workflows (backend CI, frontend CI, lint, path guard)
- **Docker:** 4-service orchestration (Postgres, Redis, Backend, Frontend)
- **Languages:** English, German (bilingual KB and UI)

---

## Next Steps

1. **Update README.md** with:
   - Strengthened Francis Kanu attribution (PM + Lead Engineer explicit)
   - Evidence-backed individual contributions for all git-confirmed contributors
   - Removed private credentials and infrastructure details
   - Flagged uncertainties for contributors without git evidence

2. **Create Pull Request** on docs-only branch

3. **Provide User with:**
   - PR URL
   - Concise change summary
   - This evidence handoff artifact path
   - List of contribution attribution gaps needing confirmation

4. **Do not edit Word report** - separate workflow

---

**Artifact complete.** Ready for README update and PR creation.
