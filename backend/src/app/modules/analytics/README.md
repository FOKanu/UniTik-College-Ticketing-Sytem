# Analytics module

Reporting/metrics beyond the live dashboard (trends, SLA stats).

**Requirement IDs:** beyond NFR-1.6 (v3 reporting)

## Endpoints (mock — see routes/analytics.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/analytics` | List all analytics (mock data) |
| GET | `/api/v1/analytics/:id` | Get one by id (mock data) |
| POST | `/api/v1/analytics` | Create (echoes input as mock) |
| PATCH | `/api/v1/analytics/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/analytics/:id` | Delete (no-op) |

## Structure

```
analytics/
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

- [ ] Define real fields in `types/analytics.types.ts`, `dto/`, and `schemas/analytics.schema.ts`
- [ ] Implement `repository/analytics.repository.ts` against Prisma
- [ ] Implement real business rules in `service/analytics.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
