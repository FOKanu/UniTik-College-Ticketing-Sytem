# Profile module (frontend)

Current user's profile view.

**Requirement IDs:** NFR-1.4 (role-based access)
**Backend counterpart:** `backend/src/app/modules/users`

## Structure

```
profile/
├── components/      ProfileList.tsx — TODO: replace generic JSON dump with real UI
├── pages/           ProfilePage.tsx — routed in src/app/router.tsx
├── hooks/           useProfile.ts — data fetching (TODO: swap useEffect for React Query if needed)
├── services/        profile.service.ts — all calls to /users go through here
├── types/           profile.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Replace placeholder types in `types/profile.types.ts` once backend users module has real fields
- [ ] Build real UI in `components/` (currently a generic JSON dump for integration testing)
- [ ] Add loading/error/empty states matching the design system
- [ ] Add meaningful tests beyond the scaffold smoke test
