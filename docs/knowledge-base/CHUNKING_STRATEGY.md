# Document chunking strategy — design proposal

**Owner:** Agrima (KB / AI-RAG ingestion) · **Reviewers:** Izzy (KB pair), Yegor (embeddings)
**Status:** Draft for review · **Board task:** AI/RAG #56 · **Requirement:** NFR-1.1.4, NFR-2.7.3 (context engine)

## What chunking means here

Chunking = deciding how to split KB content into the units we embed and retrieve. Get it wrong and the
chatbot either retrieves half an answer or drowns the right answer in noise.

## Key observation: our KB is already chunk-shaped

Unlike a wiki of long articles, our corpus is a set of **small, self-contained FAQ entries**, each with a
fixed shape (Question / Answer / Escalation / Related phrasings / Keywords). Each entry is already about the
size of a good chunk. So we should **not** apply arbitrary token-window splitting — that would cut answers in
half. The natural unit is the FAQ entry.

## Proposal

**1. Granularity — one chunk per FAQ entry (entry-level chunking).**
Each `FaqEntry` becomes exactly one embedded chunk. Entries are short, curated, and self-contained, so this
gives clean, precise retrieval with no mid-answer cuts.

**2. What text gets embedded (the context blob).**
Keep the deterministic field order the v1 pipeline already defined, so re-embeddings are reproducible:
stable ID → department → audience → language → question → related phrasings → keywords → answer → escalation.
Including the **related phrasings** in the embedded text is deliberate — it boosts recall when a student
phrases the question differently.

**3. Size & overlap.**
Because entries are small, there is no sliding window and no cross-entry overlap. The only edge case is an
answer that exceeds the embedding model's token limit — then split *that answer* into sub-chunks that each
repeat the question + metadata as a shared prefix (that prefix is the "overlap" that keeps sub-chunks
grounded). Add a guard: if `tokens(context_blob) > model_max`, sub-chunk; otherwise one chunk.

**4. Metadata carried on every chunk.**
`id`, `department`/`category`, `language`, and (per the multi-tenant proposal) `institutionId`, so retrieval
can filter by institution and language before ranking.

## Open questions (need the team)

1. **Embedding model token limit** — depends on Yegor's model choice (#57). That number decides whether any
   current answer even needs sub-chunking. (Most of ours are well under any typical limit.)
2. **Keywords: embed or metadata-only?** Embedding them helps keyword-style queries; keeping them as
   filter-only metadata keeps the vector cleaner. Proposal: embed them (recall matters more here).
3. **Future long-form content** — if we later ingest real handbook pages (not FAQ entries), we'll need a
   second strategy (semantic/heading-based splitting) for those. Out of scope for the current FAQ corpus.

## Why this is safe to decide now

This is a design decision, not blocked code — it only depends on the model's token limit for the one edge
case, and our entries are small enough that entry-level chunking works regardless. It feeds directly into
#58 (embedding upsert pipeline).
