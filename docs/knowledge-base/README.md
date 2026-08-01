# Knowledge-base corpus

The canonical, human-editable FAQ source for the KB/chat slices. One Markdown document per supported
department, 113 entries total.

| File             | Department  | ID prefix          | Entries |
| ---------------- | ----------- | ------------------ | ------: |
| `academics.md`   | Academics   | `faq-academics-`   |      30 |
| `finance.md`     | Finance     | `faq-finance-`     |      15 |
| `it-support.md`  | IT Support  | `faq-it-support-`  |      15 |
| `maintenance.md` | Maintenance | `faq-maintenance-` |      15 |
| `registrar.md`   | Registrar   | `faq-registrar-`   |      24 |
| `housing.md`     | Housing     | `faq-housing-`     |      14 |

All entries are `status: synthetic-draft` — synthetic data written by the team, not content supplied by the
university. Replace with real content before any production use. The `registrar.md` and `housing.md`
documents were written as synthetic FAQs derived from the team's University of Rochester reference doc
(Izzy/Kinga), covering the Registrar and Housing departments.

**Requirement IDs:** NFR-1.1.4, NFR-2.7.3 (context engine)

## Provenance

These documents were authored against the v1 Express/Prisma scaffold and carried forward unchanged. The
active ingestion implementation is Python on FastAPI's SQLAlchemy/Alembic backend, with PostgreSQL and
pgvector storage.

The v1 TypeScript implementation (parser, ingestion service, embedding validator, and their tests) is
preserved on the `archive/ai-rag-embedding-ingestion-v1` tag. It remains a behavioral reference only; its
`backend/src/` code belongs to the archived stack.

## Authoring format

Each document opens with constrained front matter:

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

Each FAQ is a level-two heading holding a stable ID, followed by exactly five required level-three sections:

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

IDs are stable and sequential within a department: `faq-academics-001` through `faq-academics-030`,
`faq-finance-001` through `faq-finance-015`, and likewise for `it-support` and `maintenance`.

To add a FAQ, append it to the appropriate department file, use the next sequential ID, include every
required section, provide at least one bullet under both `Related phrasings` and `Keywords`, and increment
the front-matter `entryCount`. Never reuse or renumber an existing ID — they are referenced by ingested rows.

## Validation rules

The Python parser preserves these corpus-wide invariants from the v1 implementation:

- canonical filenames and departments, matching the table above
- entry count per document equal to front-matter `entryCount`
- sequential IDs with no gaps, and globally unique IDs across all four documents
- globally unique normalized questions across all four documents
- source order preserved

## Retrieval context

Embedding input and `FaqEntry.contextBlob` are built from the same deterministic JSON context, in this
fixed field order:

1. stable ID
2. department
3. audience
4. language
5. question
6. related phrasings
7. keywords
8. answer
9. escalation guidance

Arrays retain canonical Markdown order. `contextBlob` is the persisted, inspectable serialized retrieval
context; it is distinct from the numeric embedding stored in the native SQLAlchemy `Vector(1536)` column.

## Embedding service contract

Provider and model selection remain unresolved. The current implementation uses the configured generic HTTP
endpoint and does not assert that a particular provider or model has been selected. It sends:

```json
{"input": "<contextBlob>"}
```

and requires a response shaped as:

```json
{"embedding": [/* exactly 1536 finite numeric values */]}
```

Set `EMBEDDING_SERVICE_URL` for the administrative process. Do not put credentials in its query string.

## Ingestion semantics

Ingestion is an explicit administrative operation. From `backend/`, invoke it as:

```bash
python -m scripts.ingest_kb
```

It is never an API route and does not run automatically at FastAPI startup. The script parses all four
canonical files and generates and validates all 75 embeddings before opening a database session. A provider
failure therefore leaves the database untouched. It then inserts missing `FaqEntry` rows or updates matching
IDs through normal SQLAlchemy ORM behavior, using one session and one commit. A database failure rolls the
transaction back.

Ingestion is deliberately insert/update-only. Records absent from Markdown are not removed, and stale-record
reconciliation remains a future design decision. The Markdown corpus is canonical for the IDs it contains,
not currently an instruction to delete every other FAQ row.
