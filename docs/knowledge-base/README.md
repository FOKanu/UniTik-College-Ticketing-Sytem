# Knowledge-base corpus

This document describes the multilingual knowledge-base and RAG implementation. English and German are
first-class corpus languages; the selected UI language is authoritative for chatbot retrieval.

This directory is the canonical, human-editable FAQ corpus used by the chatbot. Public reference material
was transformed into de-identified synthetic university policies and procedures. Every document is marked
`synthetic-draft`; no entry should be treated as a production policy without institutional review.

| File | Department | ID prefix | Entries | Size | Words |
| --- | --- | --- | ---: | ---: | ---: |
| `academics_EN.md` / `academics_DE.md` | Academics | `faq-academics-` | 30 × 2 | 37,573 bytes | 5,180 |
| `finance_EN.md` / `finance_DE.md` | Finance | `faq-finance-` | 15 × 2 | 17,155 bytes | 2,426 |
| `it-support_EN.md` / `it-support_DE.md` | IT Support | `faq-it-support-` | 15 × 2 | 18,725 bytes | 2,618 |
| `maintenance_EN.md` / `maintenance_DE.md` | Maintenance | `faq-maintenance-` | 15 × 2 | 16,879 bytes | 2,508 |
| `registrar_EN.md` / `registrar_DE.md` | Registrar | `faq-registrar-` | 55 × 2 | 90,117 bytes | 11,456 |
| `housing_EN.md` / `housing_DE.md` | Housing | `faq-housing-` | 53 × 2 | 85,831 bytes | 10,848 |
| **Total** | **6 departments / 2 languages** | | **366** | **266,280 bytes** | **35,036** |

The canonical corpus contains 366 localized entries (183 logical FAQs in each language). Parser code derives this total from
`CANONICAL_FILES`, so the table, front-matter counts, and parser specification must be updated together.
The measurements above are UTF-8 file sizes and whitespace-delimited word counts as of this revision. The
literal bilingual corpus size is **0.266280 MB** using decimal megabytes, or approximately **0.253944 MiB**.
English accounts for 118,296 bytes and German for 147,984 bytes. Each logical FAQ has the same stable ID in
both files.

## What information the corpus contains

The material is synthetic student self-service content, not university-approved policy. It covers:

- **Academics:** student-record changes, registration and course processes, academic standing, advising,
  enrollment verification, transcripts, and related academic administration.
- **Finance:** tuition deadlines, invoices, payments, refunds, holds, sponsorship and third-party payment,
  and routes to the finance team.
- **IT Support:** accounts and password recovery, multi-factor authentication, connectivity, access,
  devices, and the synthetic IT support route.
- **Maintenance:** reporting faults, urgency and safety guidance, repair follow-up, access arrangements,
  and residence-related maintenance.
- **Registrar:** registration, records, forms, transcripts, enrollment verification, identity/access
  issues, deadlines, and cross-department handoffs.
- **Housing:** eligibility, applications, contracts, room and residence processes, arrivals/departures,
  accommodation routes, conduct, and housing maintenance handoffs.

Every answer provides an actionable synthetic procedure. Every entry also supplies escalation guidance,
search-oriented paraphrases, and keywords. Cross-department workflows deliberately point to a single
canonical owner where appropriate (for example Registrar for transcripts and enrollment verification,
Maintenance for housing repairs, IT Support for authentication, and Finance for third-party payments).

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
bullets. IDs must remain sequential within a department. IDs and normalized questions are unique within a
language; matching English and German entries intentionally share a logical ID.

## Runtime architecture and validation

The active application uses FastAPI with SQLAlchemy. The administrative ingester parses the canonical
Markdown, builds embeddings through the shared OpenAI-compatible LLM client in ``app.ai`` (same Funnel /
OpenAI / Gemini credentials as chat), and stores FAQ rows in PostgreSQL with pgvector. Vectors must be
exactly **768** finite floats to match ``FaqEntry.embedding`` (Ollama ``nomic-embed-text``; OpenAI
``text-embedding-3-*`` can request ``dimensions=768``). Configure ``EMBEDDING_MODEL`` /
``OPENAI_EMBEDDING_MODEL`` / ``OLLAMA_EMBEDDING_MODEL``; provider errors exposed by the command are
sanitized.

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
The pgvector column width is **768** (aligned with Ollama `nomic-embed-text`).

### Current implementation status

| Capability | Current status |
| --- | --- |
| Canonical Markdown corpus | Implemented and strictly validated: 12 files / 366 localized entries |
| Synthetic-content safeguards | Implemented in tests for de-identification, domains, IDs, counts, links, and duplicate questions |
| Embedding adapter | Implemented via ``app.ai.create_embedding`` (OpenAI-compatible ``/v1/embeddings``); enforces **768** dims |
| Database ingestion | Implemented as explicit, atomic insert-or-update ingestion into PostgreSQL/pgvector |
| Vector similarity query | Implemented in the service layer using cosine distance (`<=>`) |
| Public `POST /api/v1/kb/search` | **Text search only**; it currently searches question/answer text with `ILIKE` |
| Chatbot RAG orchestration | Implemented with citations, score threshold, text fallback, and UI-language filtering |
| Student and staff KB screens | May still use fixtures in `hybrid`/`mock` modes; live `/kb` exists for API mode |
| Re-ranking, citations, score threshold, evaluation set | Not implemented |

`FaqEntry.documentId` stores the shared logical FAQ ID. Localized rows have distinct primary keys
(`documentId` for English and `documentId:de` for German), while a unique tenant/document/language index
prevents duplicate variants. Ingestion carries front-matter language into every row and embedding context.
Chat requests carry the selected UI language, and vector and text-fallback retrieval both filter on it.

## Administrative ingestion

From `backend/`, an administrator runs:

```bash
# Upsert FAQ text and enqueue embedding jobs (default)
python -m scripts.ingest_kb

# Drain the queue (one-shot) — or leave the worker running
python -m scripts.embedding_worker --once

# Continuous worker (polls every 2s)
python -m scripts.embedding_worker

# Legacy: embed in-process before commit
python -m scripts.ingest_kb --sync
```

Prerequisites are a migrated PostgreSQL database with the pgvector extension (through
Alembic `006_embedding_job`), a reachable LLM provider that exposes OpenAI-compatible
embeddings, and an embedding model that returns **exactly 768** dimensions
(see `backend/.env.example`: `OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest`, or
`OPENAI_EMBEDDING_MODEL=text-embedding-3-small` with `dimensions=768`). Chat can stay on Ollama while
embeddings use the same Funnel endpoint.

Ingestion does not run at FastAPI startup. Default mode validates the corpus, upserts
FAQ rows (leaving existing vectors until refreshed), and inserts `EmbeddingJob` rows.
A separate worker process claims jobs with `FOR UPDATE SKIP LOCKED`, calls the embedding
provider, and writes vectors onto `FaqEntry`. Use `--sync` only for emergency/CI when no
worker is available. The process does not automatically delete stale rows; removal requires
a separate reviewed administrative operation.

Admins can also enqueue re-embeds without re-parsing Markdown:

```bash
# All FAQs, or only those missing a vector
curl -X POST "$API/api/v1/kb/admin/reembed?missing=1" -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Verification

From the repository root, validate the parser, corpus rules, embedding contract, and ingestion transaction:

```bash
backend/.venv/bin/pytest \
  backend/tests/test_kb_content_parser.py \
  backend/tests/test_kb_synthetic_content.py \
  backend/tests/test_kb_embedding.py \
  backend/tests/test_kb_ingestion.py \
  backend/tests/test_embedding_jobs.py
```

The tests use mocks for the embedding provider and ingestion transaction. They validate software behavior;
they do not certify the synthetic answers as real policy or measure retrieval/answer quality.

## What comes next

1. Obtain institutional owner review for every department and keep all content marked `synthetic-draft`
   until it is approved or replaced.
2. Add a supported embedding-service deployment and document `EMBEDDING_SERVICE_URL` in the environment and
   Docker configuration.
3. Ingest into a non-production database, verify 366 populated embeddings, and record the embedding model and
   corpus revision used.
4. Replace frontend mock articles with the live KB API and align its category choices with all six canonical
   departments.
5. Build a versioned RAG evaluation set covering paraphrases, cross-department routing, no-answer cases,
   prompt injection, privacy boundaries, citation correctness, latency, and regression thresholds.
6. Define reviewed retirement/deletion and re-ingestion procedures so stale database rows cannot outlive an
   intentionally removed article.
