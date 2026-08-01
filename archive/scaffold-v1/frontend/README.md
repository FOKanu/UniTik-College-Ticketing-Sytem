# Frontend — University Support Ticketing System

React + TypeScript + Vite + Tailwind CSS. Structure mirrors the backend 1:1 so a contributor working on
"tickets" touches `backend/.../modules/tickets` and `frontend/.../modules/ticket` and nothing else.

## Structure

```
src/
├── app/            router.tsx, providers.tsx — composition root only
├── components/     shared UI primitives (Button, Input, Card, Spinner)
├── layouts/         MainLayout (nav shell), AuthLayout (centered auth pages)
├── services/        api-client.ts — the only place raw fetch() is used
├── hooks/            cross-module hooks (useAuth)
├── store/            auth session state (React Context — see store/auth.store.ts)
└── modules/
    ├── login/         NFR-1.2
    ├── dashboard/      NFR-1.6
    ├── ticket/         NFR-1.2.1, NFR-1.1.2/1.1.3
    ├── chatbot/        NFR-1.1, NFR-1.1.1, NFR-1.1.2, NFR-1.1.4
    ├── faq/            NFR-1.1.4
    ├── admin/          NFR-2.6
    ├── notifications/  NFR-1.2.2
    └── profile/        NFR-1.4
```

Each module owns `components/`, `pages/`, `hooks/`, `services/`, `types/`, `tests/`, `README.md`.

## Scaffold status

Every module currently renders a generic JSON dump of whatever its backend endpoint returns (login and
chatbot have real forms/chat UI since those flows needed more than a list view). Replace
`components/<Module>List.tsx` in each module with real UI as that module's backend counterpart gains real
data.

## Commands

```bash
npm install
npm run dev         # http://localhost:5173
npm run build
npm run lint
npm run typecheck
npm test
```
