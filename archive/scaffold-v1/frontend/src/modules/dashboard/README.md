# Dashboard module (frontend)

Live per-department ticket counts (open/in-progress/resolved).

**Requirement IDs:** NFR-1.6 (live dashboards)
**Backend counterpart:** `backend/src/app/modules/dashboard`

## Structure

```
dashboard/
├── components/      DashboardList.tsx — TODO: replace generic JSON dump with real UI
├── pages/           DashboardPage.tsx — routed in src/app/router.tsx
├── hooks/           useDashboard.ts — data fetching (TODO: swap useEffect for React Query if needed)
├── services/        dashboard.service.ts — all calls to /dashboard go through here
├── types/           dashboard.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Replace placeholder types in `types/dashboard.types.ts` once backend dashboard module has real fields
- [ ] Build real UI in `components/` (currently a generic JSON dump for integration testing)
- [ ] Add loading/error/empty states matching the design system
- [ ] Add meaningful tests beyond the scaffold smoke test
