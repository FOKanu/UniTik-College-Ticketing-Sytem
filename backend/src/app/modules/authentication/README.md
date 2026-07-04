# Authentication module

Login/register scaffolding, JWT issuance/verification, and the role-guard middleware contract.
Role-based access scaffolding for **Student / Staff / Admin** — see `roles/`.

**Requirement IDs:** NFR-2.5 (SSO integration), Req-3.3 (interface authentication), NFR-1.4 (RBAC)

## Isolation rule — read before touching `ldap/`

University SSO/LDAP integration is an **open issue (OI-01)** — source system, access method, and
authentication protocol are still pending confirmation from IT. `ldap/ldap.service.ts` is therefore a fully
isolated stub:

- Nothing outside this module imports it.
- `service/authentication.service.ts` does **not** call it yet — it's wired to local JWT auth only.
- When LDAP is confirmed, implement `ldap/ldap.service.ts` and wire it into
  `authentication.service.ts` behind a feature flag, without touching any other module.
- If LDAP is ultimately dropped, delete `ldap/` — nothing else breaks.

## Structure

```
authentication/
├── controller/      HTTP layer (login, register, me)
├── service/         orchestrates jwt/ + repository; LDAP not yet wired (OI-01)
├── repository/      user credential lookup (Prisma)
├── routes/          /api/v1/auth/*
├── jwt/             token issuance/verification — isolated, reusable by middleware
├── ldap/            STUB ONLY — pending IT confirmation (OI-01), not depended on elsewhere
├── roles/           role guard contract (re-exports shared middleware for module-local use)
├── dto/, schemas/, types/, validators/
├── tests/
└── README.md
```

## Endpoints (mock)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register (mock — echoes input) |
| POST | `/api/v1/auth/login` | Login (mock — returns a signed placeholder JWT) |
| GET | `/api/v1/auth/me` | Current user (mock, requires `Authorization: Bearer <token>`) |

## TODO

- [ ] Implement real password hashing + credential check in `repository/authentication.repository.ts`
- [ ] Implement real JWT verification in `jwt/jwt.service.ts` (currently issues/decodes only)
- [ ] Resolve OI-01 with IT, then implement `ldap/ldap.service.ts`
- [ ] Decide session/refresh-token strategy
