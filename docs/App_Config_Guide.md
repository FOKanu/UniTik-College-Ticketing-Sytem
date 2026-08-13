# App config guide (UI + working chatbot)

How to run TicketHub locally so the UI works and the assistant talks to the **real LLM**
(not the mock placeholder). See also [`LLM_INTEGRATION.md`](LLM_INTEGRATION.md) for provider
details.

## Prerequisites

- Git, Node.js 20+, Python 3.11+ (3.12 preferred), Docker Desktop
- Internet access — **no** Tailscale, SSH, or local Ollama needed for the team Funnel setup

## 1. Clone & install

```bash
git clone git@github.com:FOKanu/College-Ticketing-Sytem.git
cd College-Ticketing-Sytem
# or: cd university-ticketing-system   # if your local folder uses the project name
npm run setup
```

`npm run setup` copies `.env.example` → `.env` when missing and installs root, backend, and
frontend dependencies.

## 2. Start the database

From the repo root:

```bash
docker compose up -d postgres
```

(Or `docker compose up --build` if you prefer the full stack later.)

## 3. Backend env (`backend/.env`)

Open `backend/.env` (created from `.env.example`) and set at least:

```bash
LLM_PROVIDER=ollama
OLLAMA_OPENAI_BASE_URL=https://muc-a-3099.tail129a23.ts.net/v1
OLLAMA_API_KEY=<ask the team / GPU runbook — PUBLIC key, NOT "replace-me">
OLLAMA_MODEL=qwen3:8b
OLLAMA_KEEP_ALIVE=10m

JWT_SECRET=any-long-random-string-for-local-dev
DATABASE_URL=postgresql+asyncpg://uts_user:uts_password@localhost:5432/university_ticketing
CORS_ORIGIN=http://localhost:5173
```

**Important:** without a real `OLLAMA_API_KEY`, chat will say the assistant is unavailable.
Never commit `backend/.env` — keep the key only on your machine.

Get the PUBLIC key from the GPU runbook (`print-credentials.sh` PUBLIC section) or ask Francis
in the team chat.

## 4. Frontend env (`frontend/.env`)

Must look like this — especially `VITE_DATA_SOURCE`:

```bash
VITE_DATA_SOURCE=hybrid
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://127.0.0.1:4000
VITE_WS_PROXY_TARGET=ws://127.0.0.1:4000
```

If you leave `VITE_DATA_SOURCE` unset or set to `mock`, you only get:

> Placeholder response — set VITE_DATA_SOURCE=hybrid…

After changing this file, **restart** the frontend (Vite reads env only at startup).

Prefer `127.0.0.1` over `localhost` on macOS so the proxy hits IPv4 (backend listens on IPv4).

## 5. Migrate + seed

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
python -m scripts.seed
cd ..
```

## 6. Run the apps (two terminals)

```bash
# Terminal 1 — API on :4000
npm run dev:backend

# Terminal 2 — UI on :5173
npm run dev:frontend
```

Open: [http://localhost:5173](http://localhost:5173)

## 7. Log in (demo account)

| Field | Value |
| --- | --- |
| Email | `jordan.alvarez@student.university.edu` |
| Password | `demo1234` |

Then open the AI Assistant page or the floating chat bubble and send a message.

## 8. Quick health check (if chat fails)

```bash
# Funnel + key OK?
curl -sS https://muc-a-3099.tail129a23.ts.net/v1/models \
  -H "Authorization: Bearer $OLLAMA_API_KEY"

# Backend sees the model?
curl -s http://127.0.0.1:4000/api/v1/chat/health | python3 -m json.tool
```

You want `"status": "online"` and `"modelAvailable": true`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Placeholder reply | Set `VITE_DATA_SOURCE=hybrid` in `frontend/.env`, restart Vite |
| “Assistant unavailable” / offline banner | Fix `OLLAMA_API_KEY`, or GPU/Funnel is down |
| Can’t log in / API errors | Postgres up? Ran migrations + seed? Backend on `:4000`? |
| Weird Mac connection issues | Use `127.0.0.1` instead of `localhost` in proxy/API URLs |

## Related docs

- [`LLM_INTEGRATION.md`](LLM_INTEGRATION.md) — providers, Funnel architecture, SSE endpoints
- [`CONTRIBUTORS.md`](CONTRIBUTORS.md) — team roster and ownership
- [`BRANCHING_STRATEGY.md`](BRANCHING_STRATEGY.md) — git flow
