# Users module

User profile CRUD and role assignment.

**Requirement IDs:** NFR-1.4 (role-based access)

## Endpoints (mock — see routes/users.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/users` | List all users (mock data) |
| GET | `/api/v1/users/:id` | Get one by id (mock data) |
| POST | `/api/v1/users` | Create (echoes input as mock) |
| PATCH | `/api/v1/users/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/users/:id` | Delete (no-op) |

## Structure

```
users/
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

- [ ] Define real fields in `types/users.types.ts`, `dto/`, and `schemas/users.schema.ts`
- [ ] Implement `repository/users.repository.ts` against Prisma
- [ ] Implement real business rules in `service/users.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
