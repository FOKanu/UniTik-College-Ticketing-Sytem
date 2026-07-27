# Ticket module (frontend)

Ticket list/detail — the student/staff-facing ticket portal.

**Requirement IDs:** NFR-1.2.1 (ticket report), NFR-1.1.2/1.1.3 (creation/correction)
**Backend counterpart:** `backend/src/app/modules/tickets`

## Structure

```
ticket/
├── components/      TicketList.tsx — TODO: replace generic JSON dump with real UI
├── pages/           TicketListPage.tsx — routed in src/app/router.tsx
├── hooks/           useTicket.ts — data fetching (TODO: swap useEffect for React Query if needed)
├── services/        ticket.service.ts — all calls to /tickets go through here
├── types/           ticket.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Replace placeholder types in `types/ticket.types.ts` once backend tickets module has real fields
- [ ] Build real UI in `components/` (currently a generic JSON dump for integration testing)
- [ ] Add loading/error/empty states matching the design system
- [ ] Add meaningful tests beyond the scaffold smoke test
