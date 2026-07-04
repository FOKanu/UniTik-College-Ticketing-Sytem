# shared/

Cross-cutting, **non-business-logic** artifacts referenced conceptually by both `backend/` and `frontend/`.
Because the two apps run in different runtimes (Node vs. browser) this is not an npm workspace package by
default — it documents the contracts both sides must agree on. Copy/mirror types from here into
`backend/src/app/shared/types` and `frontend/src/store` (or import directly if the team later converts this
into a real shared npm workspace package — see TODO below).

- `types/` — cross-domain TypeScript types (e.g. `Role`, `TicketStatus`) that both frontend and backend need
  to agree on.
- `constants/` — cross-domain constants (e.g. role names, ticket statuses).

TODO: if duplication becomes painful, convert this into a real workspace package
(`@uts/shared`) referenced by both `backend/package.json` and `frontend/package.json`.

**Never put business logic here.** If it's domain-specific, it belongs in a backend or frontend module.
