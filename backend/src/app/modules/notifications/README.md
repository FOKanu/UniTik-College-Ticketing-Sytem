# Notifications module

Ticket status-change notifications (email, in-app).

**Requirement IDs:** NFR-1.2.2 (v2 priority)

## Endpoints (mock — see routes/notifications.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/notifications` | List all notifications (mock data) |
| GET | `/api/v1/notifications/:id` | Get one by id (mock data) |
| POST | `/api/v1/notifications` | Create (echoes input as mock) |
| PATCH | `/api/v1/notifications/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/notifications/:id` | Delete (no-op) |

## Structure

```
notifications/
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

- [ ] Define real fields in `types/notifications.types.ts`, `dto/`, and `schemas/notifications.schema.ts`
- [ ] Implement `repository/notifications.repository.ts` against Prisma
- [ ] Implement real business rules in `service/notifications.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
