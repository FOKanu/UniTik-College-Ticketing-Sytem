# LLM Integration

The chat assistant talks to a language model through the backend only. The browser never
holds an API key and never opens a connection to a model provider.

```
Browser ──► FastAPI /api/v1/chat/… ──► app/ai/client.py ──► Ollama | OpenAI | Gemini
```

## Where things live

| File | Responsibility |
| --- | --- |
| `backend/app/ai/llm_config.py` | All provider config, read from env vars |
| `backend/app/ai/client.py` | Chat calls, SSE streaming, health check, reasoning-tag stripping |
| `backend/app/ai/prompts.py` | System prompt and per-mode generation settings |
| `backend/app/ai/triage.py` | Suggests a ticket subject and category on escalation |
| `backend/app/services/chat.py` | Persists turns, falls back when the model is down |
| `backend/app/api/v1/chat.py` | HTTP + SSE endpoints |
| `frontend/src/hooks/useAssistantChat.ts` | Shared chat state for the page and the widget |
| `frontend/src/lib/api/chat.ts` | Typed client, SSE parser |

## Default setup: public Funnel URL (team / prototype)

The GPU workstation exposes an OpenAI-compatible Ollama API through **Tailscale Funnel**
(HTTPS) with a Caddy Bearer check in front of loopback Ollama. Teammates do **not** need
Tailscale, SSH, or a local Ollama install — only these `backend/.env` values:

```bash
LLM_PROVIDER=ollama
OLLAMA_OPENAI_BASE_URL=https://muc-a-3099.tail129a23.ts.net/v1
OLLAMA_API_KEY=<from print-credentials.sh PUBLIC section on the GPU box>
OLLAMA_MODEL=qwen3:8b
OLLAMA_KEEP_ALIVE=10m
```

Copy `backend/.env.example` → `backend/.env` and paste the real API key. Requests without
a valid `Authorization: Bearer …` key receive `401` from the proxy.

Confirm the backend can see it:

```bash
curl -s localhost:4000/api/v1/chat/health | python3 -m json.tool
```

`"status": "online"` means you are good. `"offline"` usually means the Funnel/proxy is
down, the GPU box is off, or `OLLAMA_API_KEY` is missing/wrong — the UI shows an
"LLM server offline" banner in that state.

Smoke-test the public endpoint directly (no app required):

```bash
curl -sS https://muc-a-3099.tail129a23.ts.net/v1/models \
  -H "Authorization: Bearer $OLLAMA_API_KEY"
```

### Running the backend in Docker

`docker-compose.yml` defaults `OLLAMA_OPENAI_BASE_URL` to the same Funnel URL. Put the
Bearer key in `backend/.env` (`OLLAMA_API_KEY`); compose loads that file.

### Optional: local Ollama on the GPU host only

When developing **on** the GPU workstation itself, you may override:

```bash
OLLAMA_OPENAI_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_API_KEY=ollama
```

SSH port-forwarding (`ssh -N -L 11434:…`) is no longer required for teammates.
## Switching providers

Every provider speaks the OpenAI chat-completions protocol, so only env vars change.

```bash
# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-…
OPENAI_MODEL=gpt-4o-mini

# Google Gemini (via its OpenAI-compatible endpoint)
LLM_PROVIDER=google
GOOGLE_API_KEY=…
GOOGLE_MODEL=gemini-2.0-flash
```

No application code changes. `GET /api/v1/chat/health` reports which provider is active.

## Answer modes

`mode` on a send request picks the system prompt and generation limits:

| Mode | Style | max tokens |
| --- | --- | --- |
| `quick` (default) | At most three sentences, direct answer | 300 |
| `detailed` | Step-by-step, under 200 words | 800 |

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/v1/chat/conversations` | Start a conversation |
| `GET` | `/api/v1/chat/conversations/{id}/messages` | Full history |
| `POST` | `/api/v1/chat/conversations/{id}/messages` | Blocking reply |
| `POST` | `/api/v1/chat/conversations/{id}/messages/stream` | SSE reply |
| `POST` | `/api/v1/chat/conversations/{id}/escalate` | Turn the chat into a ticket (idempotent) |
| `GET` | `/api/v1/chat/health` | Provider reachability |

The stream emits three event types:

```
event: start   data: {"userMessage": {…}}
event: token   data: {"delta": "…"}
event: done    data: {"botMessage": {…}}
```

An `error` event appears instead of further tokens when the provider drops out. The
`done` event still arrives, because the reply is persisted either way — a dead model
server never loses the user's message.

## Chat-to-ticket escalation

`POST /api/v1/chat/conversations/{id}/escalate` turns a conversation into a ticket:

1. Rejects the request with 400 if the user has not asked anything yet.
2. Asks the model for a subject line and a category (`academics`, `it`, `finance`,
   `maintenance`, `other`).
3. Creates an open ticket owned by the user, in their department, with the full
   transcript as the description (capped at 20k characters).
4. Appends a confirmation turn to the chat so the conversation reads coherently.

Response:

```json
{
  "conversation": { "...": "..." },
  "ticketId": "…",
  "ticket": { "id": "…", "subject": "…", "status": "OPEN", "category": "it" },
  "alreadyEscalated": false,
  "botMessage": { "...": "..." }
}
```

The call is idempotent per conversation. A second call returns the original ticket with
`alreadyEscalated: true`, `botMessage: null`, and does not spend another model call.

If the model is unreachable, escalation still succeeds — the subject falls back to the
user's first message and the category is left empty for an agent to set. Triage is a
suggestion attached to a human-owned ticket, which is what NEG-6 requires.

In the UI, the assistant's "Still stuck?" panel becomes an **Escalate to Ticket** button
once a conversation exists, then shows the created ticket with a link to it. The floating
widget gets the same action in its footer.

## Frontend

`VITE_DATA_SOURCE` controls how much of the UI talks to FastAPI:

| Mode | Behaviour |
| --- | --- |
| `mock` | Full fixture UI. Assistant returns placeholders. |
| `hybrid` | **Recommended for LLM work.** Live auth, chat, and tickets. Notifications and knowledge keep mock fixtures until those backend slices exist. |
| `api` | Everything calls FastAPI. Unfinished slices (notifications) degrade to empty. |

Set `VITE_DATA_SOURCE=hybrid` in `frontend/.env`. `VITE_API_BASE_URL` defaults to
`/api/v1`, which the Vite dev server proxies to `http://localhost:4000`
(override with `VITE_PROXY_TARGET`).

Demo login (hybrid/api): `jordan.alvarez@student.university.edu` / `demo1234`.

## Notes on qwen3

qwen3 is a reasoning model: it emits `<think>…</think>` before its answer. The client
strips those spans from both streaming and non-streaming responses, including when a tag
is split across chunk boundaries, so the scratchpad never reaches the UI or the database.

## Safety

`backend/app/ai/prompts.py` encodes the NEG-5 and NEG-6 rules from
`docs/architecture/README.md`: the assistant must not disclose another user's data, and
must not make final decisions on sensitive matters — it routes those to a human via
ticket escalation. Prompt rules are a guardrail, not a guarantee; access control still
lives in the service layer.
