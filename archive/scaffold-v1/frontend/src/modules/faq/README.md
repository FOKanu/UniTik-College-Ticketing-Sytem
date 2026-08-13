# Faq module (frontend)

Browsable FAQ list backed by the knowledge-base module.

**Requirement IDs:** NFR-1.1.4
**Backend counterpart:** `backend/src/app/modules/knowledge-base`

## Structure

```
faq/
├── components/      FaqList.tsx — TODO: replace generic JSON dump with real UI
├── pages/           FaqPage.tsx — routed in src/app/router.tsx
├── hooks/           useFaq.ts — data fetching (TODO: swap useEffect for React Query if needed)
├── services/        faq.service.ts — all calls to /knowledge-base go through here
├── types/           faq.types.ts
├── tests/
└── README.md
```

## TODO

- [ ] Replace placeholder types in `types/faq.types.ts` once backend knowledge-base module has real fields
- [ ] Build real UI in `components/` (currently a generic JSON dump for integration testing)
- [ ] Add loading/error/empty states matching the design system
- [ ] Add meaningful tests beyond the scaffold smoke test
