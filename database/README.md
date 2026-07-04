# Database

PostgreSQL is the system of record. **Prisma migrations** (`backend/prisma/migrations`, generated from
`backend/prisma/schema.prisma`) are the source of truth for actually applying schema changes.

The `.sql` files in `schemas/` are a **reference-only**, human-readable per-domain view of the schema — useful
for design discussions and onboarding without needing to read Prisma syntax. Keep them roughly in sync with
`schema.prisma`, but do not run them directly against a real environment.

- `migrations/` — placeholder; Prisma populates this via `npx prisma migrate dev`.
- `seed/` — placeholder seed data description; actual seed script lives at `backend/prisma/seed.ts`.
- `schemas/` — one reference `.sql` file per domain (ticket, user, faq, notification, audit, problem).
