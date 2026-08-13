# Login module (frontend)

Login form wired to the authentication module's mock `/auth/login` endpoint.

**Requirement IDs:** NFR-1.2 (ticket portal login)
**Backend counterpart:** `backend/src/app/modules/authentication`

## Structure

```
login/
├── components/LoginForm.tsx   email/password form
├── pages/LoginPage.tsx        routed at /login (see src/app/router.tsx)
├── hooks/useLogin.ts          calls loginService, stores session via useAuth
├── services/login.service.ts  POST /auth/login
├── types/login.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Add registration form (backend `POST /auth/register` already scaffolded)
- [ ] Add an SSO login option once university SSO/LDAP is confirmed (OI-01) — do not wire until then
- [ ] Decode real role from JWT once authentication module issues real tokens
- [ ] Add form validation feedback beyond the basic error string
