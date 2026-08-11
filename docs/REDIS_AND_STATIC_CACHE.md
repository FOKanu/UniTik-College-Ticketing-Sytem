# Redis and static asset caching

Optional Redis and a production nginx frontend for CDN-like Cache-Control.
Embedding and email workers stay on Postgres job tables (no Redis broker).

## Redis (optional)

`docker compose up` starts a `redis:7-alpine` container on `127.0.0.1:6379`.
The backend does **not** require it.

| Mode | Config |
| --- | --- |
| Memory fallback (default) | Leave `REDIS_URL` empty in `backend/.env` |
| Shared cache | `REDIS_URL=redis://localhost:6379/0` (host) or `redis://redis:6379/0` (compose network) |

Today Redis backs the short-lived **LLM health** cache (`llm:health`, ~10s TTL) so multiple uvicorn workers share the same result. If Redis is down or unset, [`app.core.cache`](../backend/app/core/cache.py) falls back to an in-process dict.

## Production frontend (nginx)

Default compose still runs the Vite **development** target on port 5173.

For a static SPA with long-lived hashed assets:

```bash
docker compose --profile prod-frontend up --build frontend-prod
```

Serves on http://localhost:8080 with:

- `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`
- `/index.html` → `Cache-Control: no-cache`
- `/api/` → proxy to `backend:4000`

This is the prototype stand-in for a CDN: correct cache headers on immutable Vite builds, not a vendor (Cloudflare/CloudFront).
