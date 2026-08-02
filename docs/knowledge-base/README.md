# Knowledge-base corpus

This directory is the canonical, human-editable FAQ corpus used by the chatbot. Public reference material
was transformed into de-identified synthetic university policies and procedures. Every document is marked
`synthetic-draft`; no entry should be treated as a production policy without institutional review.

| File | Department | ID prefix | Entries |
| --- | --- | --- | ---: |
| `academics.md` | Academics | `faq-academics-` | 30 |
| `finance.md` | Finance | `faq-finance-` | 15 |
| `it-support.md` | IT Support | `faq-it-support-` | 15 |
| `maintenance.md` | Maintenance | `faq-maintenance-` | 15 |
| `registrar.md` | Registrar | `faq-registrar-` | 55 |
| `housing.md` | Housing | `faq-housing-` | 53 |

The canonical corpus contains 183 entries across six departments. Parser code derives this total from
`CANONICAL_FILES`, so the table, front-matter counts, and parser specification must be updated together.

## Synthetic authoring conventions

Use only the unnamed phrase “the university.” All online processes use literal `https://portal.university.example`
URLs in answers, not hidden or vague links. Escalations use the responsible `@university.example` address or
an explicit synthetic support URL. Do not add real institutions, systems, vendors, people, addresses, phone
numbers, email domains, or web domains.

Each file begins with strict front matter:

```text
---
department: Academics
audience: Student
language: en
status: synthetic-draft
source: team-synthetic-data
entryCount: 30
---
```

Each FAQ has a stable level-two ID followed by exactly `Question`, `Answer`, `Escalation`,
`Related phrasings`, and `Keywords` level-three sections. Related phrasings and keywords use Markdown
bullets. IDs must remain sequential within a department and both IDs and normalized questions must be
globally unique. Existing IDs in established documents must not be renumbered.

## Runtime architecture and validation

The active application uses FastAPI with SQLAlchemy. The administrative ingester parses the canonical
Markdown, builds embeddings through a generic configured embedding-service contract, and stores FAQ rows in
PostgreSQL with pgvector. The provider receives `{"input": "<contextBlob>"}` and must return a finite vector
with the configured dimensions; provider errors exposed by the command are sanitized.

The strict parser validates the exact canonical filenames, metadata keys and values, non-empty metadata,
document count, department counts, heading and subsection structure, bullet syntax, sequential IDs, global
ID uniqueness, and global normalized-question uniqueness. Source order is preserved.

`contextBlob` is deterministic JSON in this exact field order:

1. stable ID
2. department
3. audience
4. language
5. question
6. related phrasings
7. keywords
8. answer
9. escalation guidance

Arrays retain Markdown order. The serialized `contextBlob` is distinct from the numeric pgvector embedding.

## Administrative ingestion

From `backend/`, an administrator runs:

```bash
python -m scripts.ingest_kb
```

Ingestion does not run at FastAPI startup. It reads and validates the complete corpus before database work,
obtains embeddings before opening the database session, then performs insert-or-update operations in one
session and one commit. A failure rolls back the transaction. The process does not automatically delete
stale rows; removal requires a separate reviewed administrative operation.
