# Notifications module (frontend)

Ticket status-change notifications list.

**Requirement IDs:** NFR-1.2.2
**Backend counterpart:** `backend/src/app/modules/notifications`

## Structure

```
notifications/
├── components/      NotificationsList.tsx — TODO: replace generic JSON dump with real UI
├── pages/           NotificationsPage.tsx — routed in src/app/router.tsx
├── hooks/           useNotifications.ts — data fetching (TODO: swap useEffect for React Query if needed)
├── services/        notifications.service.ts — all calls to /notifications go through here
├── types/           notifications.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Replace placeholder types in `types/notifications.types.ts` once backend notifications module has real fields
- [ ] Build real UI in `components/` (currently a generic JSON dump for integration testing)
- [ ] Add loading/error/empty states matching the design system
- [ ] Add meaningful tests beyond the scaffold smoke test
