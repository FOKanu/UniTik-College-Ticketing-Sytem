# Admin module

Admin-only management endpoints and audit log review.

**Requirement IDs:** NFR-2.6 (audit log)

## Endpoints (mock — see routes/admin.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin` | List all admin (mock data) |
| GET | `/api/v1/admin/:id` | Get one by id (mock data) |
| POST | `/api/v1/admin` | Create (echoes input as mock) |
| PATCH | `/api/v1/admin/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/admin/:id` | Delete (no-op) |

## Structure

```
admin/
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

- [ ] Define real fields in `types/admin.types.ts`, `dto/`, and `schemas/admin.schema.ts`
- [ ] Implement `repository/admin.repository.ts` against Prisma
- [ ] Implement real business rules in `service/admin.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
