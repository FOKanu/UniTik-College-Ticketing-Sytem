# Postgres init scripts

Any `.sql` file placed here runs automatically on first container start (empty data volume only).
Not used yet — Prisma migrations (`backend/prisma/migrations`) are the source of truth for schema changes.
TODO: add extensions here if needed (e.g. `pgcrypto` for UUID generation) once confirmed.
