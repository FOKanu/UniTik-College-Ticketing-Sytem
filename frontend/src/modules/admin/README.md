# Admin module (frontend)

Admin-only view: audit log review and management actions.

**Requirement IDs:** NFR-2.6 (audit log), NFR-1.4 (RBAC)
**Backend counterpart:** `backend/src/app/modules/admin`

## Structure

```
admin/
├── components/      AdminList.tsx — TODO: replace generic JSON dump with real UI
├── pages/           AdminPage.tsx — routed in src/app/router.tsx
├── hooks/           useAdmin.ts — data fetching (TODO: swap useEffect for React Query if needed)
├── services/        admin.service.ts — all calls to /admin go through here
├── types/           admin.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Replace placeholder types in `types/admin.types.ts` once backend admin module has real fields
- [ ] Build real UI in `components/` (currently a generic JSON dump for integration testing)
- [ ] Add loading/error/empty states matching the design system
- [ ] Add meaningful tests beyond the scaffold smoke test
