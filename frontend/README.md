# TicketHub · MediaDesign Hochschule (Frontend)

Multi-tenant campus ticketing & support portal — student, staff, and admin experiences.

## Stack

- Vite + React 19 + TypeScript
- React Router (student / agent / admin guards)
- Zustand (auth, tickets, notifications, UI toasts)
- Axios API client (mock data until backend is ready)
- React Hook Form + Zod validation
- ESLint + Prettier + Vitest

## Design system

MDH foundations: Inter, brand steel `#2574A9`, neutral scale, status chips, 6/8/12/16 radii.

Responsive breakpoints:
- **Mobile** ≤767px — drawer + bottom nav + chatbot above nav
- **Tablet** 768–1023px — collapsed icon rail
- **Desktop** ≥1024px — full sidebar (collapsible, persisted in `localStorage`)

## Quick start

```bash
npm install
cp .env.example .env   # optional — mock mode works out of the box
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo accounts

Password for all accounts: `password`

| Email | Role |
| ----- | ---- |
| `amara.k@stud.university.edu` | student |
| `agent@campus.edu` | agent |
| `admin@campus.edu` | admin |

## Main routes

- Institution picker: `/institution`
- Student: `/dashboard`, `/tickets`, `/tickets/new`, `/assistant`, `/faq`
- Staff: `/agent`, `/agent/queue`, `/agent/tickets/:id`, `/agent/knowledge`
- Admin: `/admin`, `/admin/settings` (Institution / Departments / People / Knowledge)

Floating **AI Assistant** chatbot is on every authenticated page.

## Task status

| Task | Status |
| ---- | ------ |
| 1–5, 7–19 | Done |
| 6 WebSocket | Pending backend |
| 20 Mobile responsive | Done (MDH breakpoints) |
