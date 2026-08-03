# Knowledge-base corpus

This document describes the current knowledge-base and RAG implementation on the `ai-rag` integration
branch. The former `feature/ai-rag-faq-content` branch was temporary; its committed work has been merged into
`ai-rag`, which is the authoritative branch for the information below.

This directory is the canonical, human-editable FAQ corpus used by the chatbot. Public reference material
was transformed into de-identified synthetic university policies and procedures. Every document is marked
`synthetic-draft`; no entry should be treated as a production policy without institutional review.

| File | Department | ID prefix | Entries | Size | Words |
| --- | --- | --- | ---: | ---: | ---: |
| `academics.md` | Academics | `faq-academics-` | 30 | 16,835 bytes | 2,477 |
| `finance.md` | Finance | `faq-finance-` | 15 | 7,700 bytes | 1,192 |
| `it-support.md` | IT Support | `faq-it-support-` | 15 | 8,434 bytes | 1,275 |
| `maintenance.md` | Maintenance | `faq-maintenance-` | 15 | 7,597 bytes | 1,226 |
| `registrar.md` | Registrar | `faq-registrar-` | 55 | 39,592 bytes | 5,340 |
| `housing.md` | Housing | `faq-housing-` | 53 | 38,138 bytes | 5,125 |
| **Total** | **6 departments** | | **183** | **118,296 bytes** | **16,635** |

The canonical corpus contains 183 entries across six departments. Parser code derives this total from
`CANONICAL_FILES`, so the table, front-matter counts, and parser specification must be updated together.
The measurements above are UTF-8 file sizes and whitespace-delimited word counts as of this revision. The
literal corpus size is **0.118296 MB** using decimal megabytes (1 MB = 1,000,000 bytes), or approximately
**0.112816 MiB** using binary mebibytes (1 MiB = 1,048,576 bytes).
Structured content includes 183 questions, 183 answers (6,470 words), 183 escalation instructions
(2,467 words), 549 related phrasings, and 595 keyword tags. Each entry currently has exactly three related
phrasings; keywords vary by entry.

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
bullets. IDs must remain sequential within a department and both IDs and normalized questions must be
globally unique. Existing IDs in established documents must not be renumbered.

## Runtime architecture and validation

The active application uses FastAPI with SQLAlchemy. The administrative ingester parses the canonical
Markdown, builds embeddings through the shared OpenAI-compatible LLM client in ``app.ai`` (same Funnel /
OpenAI / Gemini credentials as chat), and stores FAQ rows in PostgreSQL with pgvector. Vectors must be
exactly 1,536 finite floats to match ``FaqEntry.embedding``. Configure ``EMBEDDING_MODEL`` /
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

### Current implementation status

| Capability | Current status |
| --- | --- |
| Canonical Markdown corpus | Implemented and strictly validated: 6 files / 183 entries |
| Synthetic-content safeguards | Implemented in tests for de-identification, domains, IDs, counts, links, and duplicate questions |
| Embedding adapter | Implemented via ``app.ai.create_embedding`` (OpenAI-compatible ``/v1/embeddings``); enforces 1,536 dims |
| Database ingestion | Implemented as explicit, atomic insert-or-update ingestion into PostgreSQL/pgvector |
| Vector similarity query | Implemented in the service layer using cosine distance (`<=>`) |
| Public `POST /api/v1/kb/search` | **Text search only**; it currently searches question/answer text with `ILIKE` |
| Chatbot RAG orchestration | **Not wired yet**; chat responses do not retrieve KB entries or ground an LLM prompt |
| Student and staff KB screens | May still use fixtures in `hybrid`/`mock` modes; live `/kb` exists for API mode |
| Re-ranking, citations, score threshold, evaluation set | Not implemented |

The presence of embeddings and a vector-query function does not by itself make the running chatbot a RAG
system. The retrieval endpoint must embed the user's query and call `search_faq_vector`, and the chat flow
must pass approved results into the LLM prompt with traceable source IDs before responses are grounded in
this corpus.

## Administrative ingestion

From `backend/`, an administrator runs:

```bash
python -m scripts.ingest_kb
```

Prerequisites are a migrated PostgreSQL database with the pgvector extension, a reachable LLM provider that
exposes OpenAI-compatible embeddings, and an embedding model that returns **exactly 1536** dimensions
(see `backend/.env.example`: `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`, or set
`OLLAMA_EMBEDDING_MODEL` / `EMBEDDING_MODEL`). Chat can stay on Ollama while embeddings use OpenAI if you
set `LLM_PROVIDER=openai` only for the ingest run (or point Ollama at a 1536-dim embed model).

Ingestion does not run at FastAPI startup. It reads and validates the complete corpus before database work,
obtains embeddings before opening the database session, then performs insert-or-update operations in one
session and one commit. A failure rolls back the transaction. The process does not automatically delete
stale rows; removal requires a separate reviewed administrative operation.

## Verification

From the repository root, validate the parser, corpus rules, embedding contract, and ingestion transaction:

```bash
backend/.venv/bin/pytest \
  backend/tests/test_kb_content_parser.py \
  backend/tests/test_kb_synthetic_content.py \
  backend/tests/test_kb_embedding.py \
  backend/tests/test_kb_ingestion.py
```

The tests use mocks for the embedding provider and ingestion transaction. They validate software behavior;
they do not certify the synthetic answers as real policy or measure retrieval/answer quality.

## What comes next

1. Obtain institutional owner review for every department and keep all content marked `synthetic-draft`
   until it is approved or replaced.
2. Add a supported embedding-service deployment and document `EMBEDDING_SERVICE_URL` in the environment and
   Docker configuration.
3. Ingest into a non-production database, verify 183 populated embeddings, and record the embedding model and
   corpus revision used.
4. Wire query embedding and `search_faq_vector` into the KB search endpoint, with a configurable result limit
   and minimum relevance threshold.
5. Add chatbot retrieval and grounded prompting with FAQ IDs/categories returned as citations; fall back to
   clarification or ticket escalation when evidence is insufficient.
6. Replace frontend mock articles with the live KB API and align its category choices with all six canonical
   departments.
7. Build a versioned RAG evaluation set covering paraphrases, cross-department routing, no-answer cases,
   prompt injection, privacy boundaries, citation correctness, latency, and regression thresholds.
8. Define reviewed retirement/deletion and re-ingestion procedures so stale database rows cannot outlive an
   intentionally removed article.
