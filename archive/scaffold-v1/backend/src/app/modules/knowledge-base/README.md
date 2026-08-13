# KnowledgeBase module

FAQ storage/retrieval and the context-engine placeholder consumed by the chatbot module.

**Requirement IDs:** NFR-1.1.4, NFR-2.7.3 (context engine)

## Endpoints (mock — see routes/knowledge-base.routes.ts)

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/knowledge-base` | List all knowledge-base (mock data) |
| GET | `/api/v1/knowledge-base/:id` | Get one by id (mock data) |
| POST | `/api/v1/knowledge-base` | Create (echoes input as mock) |
| PATCH | `/api/v1/knowledge-base/:id` | Update (echoes input as mock) |
| DELETE | `/api/v1/knowledge-base/:id` | Delete (no-op) |

## Structure

```
knowledge-base/
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

- [ ] Define real fields in `types/knowledge-base.types.ts`, `dto/`, and `schemas/knowledge-base.schema.ts`
- [ ] Implement `repository/knowledge-base.repository.ts` against Prisma
- [ ] Implement real business rules in `service/knowledge-base.service.ts`
- [ ] Add meaningful tests beyond the scaffold smoke test
- [ ] Enforce any role restrictions specific to this module (see docs/architecture/README.md §4)
