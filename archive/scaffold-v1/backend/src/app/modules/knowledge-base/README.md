# KnowledgeBase module

FAQ storage/retrieval and the context-engine placeholder consumed by the chatbot module.

**Requirement IDs:** NFR-1.1.4, NFR-2.7.3 (context engine)

## Endpoints (mock — see routes/knowledge-base.routes.ts)

| Method | Path                         | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | `/api/v1/knowledge-base`     | List all knowledge-base (mock data) |
| GET    | `/api/v1/knowledge-base/:id` | Get one by id (mock data)           |
| POST   | `/api/v1/knowledge-base`     | Create (echoes input as mock)       |
| PATCH  | `/api/v1/knowledge-base/:id` | Update (echoes input as mock)       |
| DELETE | `/api/v1/knowledge-base/:id` | Delete (no-op)                      |

## Structure

```
knowledge-base/
├── controller/      HTTP layer only
├── service/         business logic (currently mock/TODO)
├── repository/      Prisma access (currently TODO)
├── routes/          Express router, mounted in app/modules/routes.ts
├── dto/             request shape types
├── schemas/         Zod validation (currently permissive placeholder)
├── validators/      middleware wrapping the schemas
├── types/           module-local types
├── tests/           unit tests (placeholder)
└── README.md         this file
```

## TODO

- [ ] Define real fields in `types/knowledge-base.types.ts`, `dto/`, and `schemas/knowledge-base.schema.ts`
- [ ] Implement `repository/knowledge-base.repository.ts` against Prisma
- [ ] Implement real business rules in `service/knowledge-base.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)

## Static canonical corpus

The permanent, human-editable knowledge-base source is `content/`. It contains one canonical Markdown
document per supported department:

| File                     | Department  | ID prefix          | Entries |
| ------------------------ | ----------- | ------------------ | ------: |
| `content/academics.md`   | Academics   | `faq-academics-`   |      30 |
| `content/finance.md`     | Finance     | `faq-finance-`     |      15 |
| `content/it-support.md`  | IT Support  | `faq-it-support-`  |      15 |
| `content/maintenance.md` | Maintenance | `faq-maintenance-` |      15 |

The corpus contains 75 entries. These files are synthetic draft data. The root `incoming-kb/` directory is
temporary source material only; edits belong in the canonical module-owned files above.

### Authoring format

Each document starts with constrained front matter:

```yaml
---
department: Academics
audience: Student
language: en
status: synthetic-draft
source: team-synthetic-data
entryCount: 30
---
```

Each FAQ is a level-two heading followed by exactly five required level-three sections:

```md
## faq-academics-001

### Question

Question text

### Answer

Answer text

### Escalation

Escalation instructions

### Related phrasings

- Alternative phrasing

### Keywords

- keyword
```

IDs are stable and sequential within a department:

- Academics: `faq-academics-001` through `faq-academics-030`
- Finance: `faq-finance-001` through `faq-finance-015`
- IT Support: `faq-it-support-001` through `faq-it-support-015`
- Maintenance: `faq-maintenance-001` through `faq-maintenance-015`

To add a FAQ, append it to the appropriate department file, use the next sequential ID, include every
required section, provide at least one bullet under both `Related phrasings` and `Keywords`, and increment
the front-matter `entryCount`. Do not reuse or renumber existing stable IDs.

### Parser and validation

`service/knowledge-base-content.parser.ts` parses the constrained front matter and FAQ state machine,
validates entries with Zod, preserves source order, and validates the complete four-document corpus.
Corpus validation enforces canonical filenames, departments, counts, sequential IDs, globally unique IDs,
and globally unique normalized questions.

The parser uses only Node filesystem/path APIs and local Zod schemas. It does not connect to Prisma or
PostgreSQL and is not wired into the API service, application startup, chatbot, or AI modules.

Tests live in `tests/knowledge-base-content.parser.test.ts`. From `backend/`, run:

```bash
npx jest src/app/modules/knowledge-base/tests/knowledge-base-content.parser.test.ts --runInBand
```

### Manual embedding ingestion

Canonical ingestion is an explicit administrative operation; it is not an API route and does not run during
normal application startup. Configure `EMBEDDING_SERVICE_URL` and `EMBEDDING_TIMEOUT_MS`, ensure PostgreSQL
and the embedding service are available, then run from `backend/`:

```bash
npm run knowledge-base:rebuild
```

Embedding input and `contextBlob` use the same deterministic JSON retrieval context in this fixed order:
stable ID, department, audience, language, question, related phrasings, keywords, answer, and escalation
guidance. Arrays retain canonical Markdown order. The pgvector dimension is fixed at 1536.

Full rebuild generates and validates every embedding before database writes begin. Prepared FAQ records are
then written in one database transaction: provider failure leaves the database untouched, while any
database-write failure rejects and rolls back the rebuild. Embedding generation itself is not transactional.

The canonical source remains `src/app/modules/knowledge-base/content/*.md`. `npm run build` compiles
TypeScript and then copies only the four canonical Markdown files to
`dist/src/app/modules/knowledge-base/content`, which is the location resolved by the compiled ingestion
service.

Content hashing, unchanged-entry skipping, provider/model version tracking, concurrency/rate limiting,
similarity retrieval, and RAG generation remain deferred decisions.
