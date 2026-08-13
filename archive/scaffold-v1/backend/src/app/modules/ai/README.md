# AI module

Fully isolated AI layer: classification, summarization, embeddings, and prompt templates. Consumed by
`chatbot` (intent/answers) and `tickets` (auto-classification), but depends on nothing outside itself.

**Requirement IDs:** NFR-2.7, NFR-2.7.1 (language detection), NFR-2.7.2 (performance under load),
NFR-2.7.4 (AI escalation), NFR-1.3 (auto-classification)

## Isolation rule

If the university decides to remove AI entirely, delete this folder. `chatbot` and `tickets` call it only
through `service/ai.service.ts` — TODO: once real logic lands, make sure those modules degrade gracefully
(e.g. chatbot falls back to FAQ-only, tickets fall back to manual categorization) if this module is absent.

## Enforcement rule (NEG-6)

This module may categorize and route. It must never make a final decision on sensitive matters (grade
changes, exam outcomes, etc.) — those always require human sign-off in `tickets`/`admin`.

## Structure

```
ai/
├── classifier/     ticket/topic classification — TODO: pick a model/provider
├── summarizer/     conversation/ticket summarization — TODO
├── embeddings/      vector embeddings for the knowledge-base context engine (NFR-2.7.3) — TODO
├── prompts/         reusable prompt templates
├── service/         ai.service.ts — the only entry point other modules should call
├── routes/          optional direct /api/v1/ai/* endpoints for testing in isolation
├── types/
├── tests/
└── README.md
```

## TODO

- [ ] Choose an AI provider/model (see AI Tool Market Comparison in the knowledge base research doc)
- [ ] Implement `classifier/ticket-classifier.ts` (NFR-1.3)
- [ ] Implement `embeddings/` for the FAQ context engine (NFR-2.7.3)
- [ ] Load-test for semester-start peak traffic (NFR-2.7.2)
- [ ] Define the human-escalation boundary explicitly (NEG-6, see docs/architecture/README.md §6)
