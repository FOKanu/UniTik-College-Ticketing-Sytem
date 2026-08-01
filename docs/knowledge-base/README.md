# Knowledge-base corpus

The canonical, human-editable FAQ source for the KB/chat slices. One Markdown document per supported
department, 75 entries total.

| File             | Department  | ID prefix          | Entries |
| ---------------- | ----------- | ------------------ | ------: |
| `academics.md`   | Academics   | `faq-academics-`   |      30 |
| `finance.md`     | Finance     | `faq-finance-`     |      15 |
| `it-support.md`  | IT Support  | `faq-it-support-`  |      15 |
| `maintenance.md` | Maintenance | `faq-maintenance-` |      15 |

All entries are `status: synthetic-draft` — synthetic data written by the team, not content supplied by the
university. Replace with real content before any production use.

**Requirement IDs:** NFR-1.1.4, NFR-2.7.3 (context engine)

## Provenance

These documents were authored against the v1 Express/Prisma scaffold, alongside a TypeScript parser and
embedding-ingestion pipeline. The FastAPI rewrite archived that scaffold, so the pipeline no longer applies,
but the corpus and its format are implementation-independent and carried forward unchanged here.

The v1 TypeScript implementation (parser, ingestion service, embedding validator, and their tests) is
preserved on the `archive/ai-rag-embedding-ingestion-v1` tag. Consult it as a reference when porting
ingestion to Python; do not merge it, as it targets `backend/src/`, which no longer exists.

Ingestion into `FaqEntry` has **not** been ported yet. Nothing reads these files at runtime today.

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

## Validation rules for a future ingester

The v1 parser enforced these corpus-wide invariants. A Python port should preserve them:

- canonical filenames and departments, matching the table above
- entry count per document equal to front-matter `entryCount`
- sequential IDs with no gaps, and globally unique IDs across all four documents
- globally unique normalized questions across all four documents
- source order preserved

## Retrieval context

Embedding input and `FaqEntry.contextBlob` were built from the same deterministic JSON context, in this
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

Arrays retain canonical Markdown order. The pgvector column is fixed at 1536 dimensions
(`FaqEntry.embedding`), so the embedding model must match that width.

## Ingestion semantics

Ingestion was an explicit administrative operation — never an API route, and never run at application
startup. A full rebuild generated and validated every embedding before any database write, then wrote all
prepared records in a single transaction: provider failure left the database untouched, and any write
failure rolled the whole rebuild back. Embedding generation itself was not transactional.
