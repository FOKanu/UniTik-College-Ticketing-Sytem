# Multi-tenant Knowledge Base — design proposal

**Owner:** Agrima (KB / AI-RAG ingestion) · **Reviewers:** Izzy (KB pair), Laurynas (DB / tenant schema), Yegor (embeddings)
**Status:** Draft for review · **Requirement:** NFR-1.1.4 (FAQ knowledge base) + multi-tenant support

## Goal

Every institution has slightly different processes, so each institution needs its **own** KB content, and
the chatbot must only ever return **that institution's** answers. A student at University A should never see
University B's registrar or housing steps.

## Current state (single-tenant)

- `FaqEntry` has **no tenant/institution column** (`backend/app/models/__init__.py`).
- The corpus is one global set of files in `docs/knowledge-base/` (academics, finance, it-support,
  maintenance, registrar, housing), loaded by a hard-coded `CANONICAL_FILES` map in
  `app/services/kb_content_parser.py`.
- Retrieval (`search_faq`, `search_faq_vector` in `app/services/kb.py`) queries **all** FAQ rows with no
  institution filter.

So today the KB is effectively "one university." Making it multi-tenant touches the data model, the corpus
layout, ingestion, and retrieval.

## Proposed changes

### 1. Data model (depends on Laurynas's tenant schema)
Add an `institutionId` foreign key to `FaqEntry`, referencing the Institution/Tenant table Laurynas owns.
- Uniqueness becomes **per institution** (e.g. unique on `(institutionId, id)`), not global.
- Every FAQ row belongs to exactly one institution.
- Existing single-tenant content migrates to a default "demo" institution so nothing breaks.

### 2. Corpus layout (per-institution folders)
```
docs/knowledge-base/
  <institution-slug>/
    registrar.md
    housing.md
    ...
```
Each file's front-matter gains an `institution:` field (matching the folder), so a file is self-describing.
Institutions can share a department name but have different answers.

### 3. Parser
`load_corpus` / `CANONICAL_FILES` become **per-institution**: iterate each institution folder, validate its
files, and stamp every parsed entry with that institution. Same 5-section format and validation rules as now,
just scoped per institution.

### 4. Ingestion
`ingest_kb.py` tags every embedded chunk with its `institutionId` and upserts keyed by
`(institutionId, id)`. Embedding generation itself is unchanged.

### 5. Retrieval (the part students feel)
`search_faq` and `search_faq_vector` take an `institutionId` and add `WHERE institutionId = :institutionId`
so results are scoped to the caller's institution. The chatbot passes the current user's institution on
every query.

## Open questions (need the team)

1. **Field name + type** — must match Laurynas's Institution/Tenant table (`institutionId`? `tenantId`? UUID?).
2. **How is a user's institution determined?** From their account / JWT claim? This drives what the chat/KB
   endpoints pass into retrieval.
3. **Shared/global content** — is there any content common to all institutions (a fallback), or is everything
   institution-specific?
4. **Sequencing** — this is blocked on the tenant schema existing in `main`. Until then, this doc + agreement
   is the deliverable; code follows once the schema lands.

## Migration path (non-breaking)
1. Land Laurynas's Institution/Tenant table.
2. Add `institutionId` to `FaqEntry` via Alembic (nullable first), backfill existing rows to a default
   institution, then make it non-null.
3. Move current corpus files under a default institution folder.
4. Update parser + ingestion + retrieval to be institution-aware.
5. Update tests + docs.
