# Chatbot module

Conversation flow, language detection routing, FAQ-first answering, and intent recognition. Delegates any
model inference (classification, summarization, embeddings) to the `ai` module — this module never
implements model logic itself.

**Requirement IDs:** NFR-1.1, NFR-1.1.1 (language detection), NFR-1.1.2 (ticket generation),
NFR-1.1.4 (FAQ first), NFR-2.7.1, NFR-2.7.2 (performance under load), NFR-2.7.3 (context engine)

## Enforcement rules (see docs/architecture/README.md §4)

- NEG-5: must never disclose another user's ticket information.
- NEG-6: must never make final decisions on sensitive matters (grade changes, exam outcomes) — it can
  categorize/route, a human decides.

## Structure

```
chatbot/
├── controller/
│   └── conversation.controller.ts   HTTP layer for the chat endpoint
├── service/
│   ├── conversation.service.ts      turn-taking orchestration
│   ├── faq.service.ts               checks knowledge-base module before escalating to a ticket
│   ├── intent.service.ts            classifies user intent (delegates to ai module)
│   └── prompt.service.ts            builds prompts sent to the ai module
├── routes/          /api/v1/chatbot/*
├── dto/, schemas/, types/, validators/
├── tests/
└── README.md
```

## Endpoints (mock)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/chatbot/message` | Send a message, get a mock reply + detected language |

## TODO

- [ ] Implement real language detection in `service/intent.service.ts` (NFR-2.7.1)
- [ ] Wire `faq.service.ts` to the real `knowledge-base` module once implemented
- [ ] Wire `intent.service.ts` / `prompt.service.ts` to the real `ai` module once a provider is chosen
- [ ] Implement ticket-creation handoff (NFR-1.1.2) when the bot cannot answer from FAQ
- [ ] Define and enforce the escalation threshold to 2nd-level support (see docs/architecture/README.md §6 gap)
