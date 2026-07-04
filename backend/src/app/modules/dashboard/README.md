# Dashboard module

Read-only aggregation of ticket counts per department, for the live admin dashboard.

**Requirement IDs:** NFR-1.6 (live dashboards)

## Endpoints (mock — see routes/dashboard.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/dashboard` | List all dashboard (mock data) |
| GET | `/api/v1/dashboard/:id` | Get one by id (mock data) |
| POST | `/api/v1/dashboard` | Create (echoes input as mock) |
| PATCH | `/api/v1/dashboard/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/dashboard/:id` | Delete (no-op) |

## Structure

```
dashboard/
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

- [ ] Define real fields in `types/dashboard.types.ts`, `dto/`, and `schemas/dashboard.schema.ts`
- [ ] Implement `repository/dashboard.repository.ts` against Prisma
- [ ] Implement real business rules in `service/dashboard.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
