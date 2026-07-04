# Tickets module

Ticket lifecycle: creation, correction, status transitions, and problem clustering placeholders.

**Requirement IDs:** NFR-1.1.2, NFR-1.1.3, NFR-1.7, NFR-1.7.1

## Endpoints (mock — see routes/tickets.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/tickets` | List all tickets (mock data) |
| GET | `/api/v1/tickets/:id` | Get one by id (mock data) |
| POST | `/api/v1/tickets` | Create (echoes input as mock) |
| PATCH | `/api/v1/tickets/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/tickets/:id` | Delete (no-op) |

## Structure

```
tickets/
├── controller/      HTTP layer only
├── service/         business logic (currently mock/TODO)
├── repository/      Prisma access (currently TODO)
├── routes/          Express router, mounted in app/modules/routes.ts
├── dto/             request shape types
├── schemas/         Zod validation (currently permissive placeholder)
├── validators/      middleware wrapping the schemas
├── types/           module-local types
├── tests/           unit tests (placeholder)
└── README.md         this file
```

## TODO

- [ ] Define real fields in `types/tickets.types.ts`, `dto/`, and `schemas/tickets.schema.ts`
- [ ] Implement `repository/tickets.repository.ts` against Prisma
- [ ] Implement real business rules in `service/tickets.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
