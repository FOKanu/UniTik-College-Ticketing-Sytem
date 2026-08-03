# Issues

Open items to revisit later (not blocking day-to-day work).

## TypeScript `baseUrl` deprecation (frontend)

- **Status:** Silenced for now
- **Where:** `frontend/tsconfig.json` (and already in `frontend/tsconfig.app.json`)
- **What:** TypeScript 6.0 deprecates `compilerOptions.baseUrl`; it will stop working in TypeScript 7.0. We added `"ignoreDeprecations": "6.0"` so the IDE/tsc stop flagging the root config red.
- **Follow-up:** Migrate off `baseUrl` per https://aka.ms/ts6 (path mapping without deprecated `baseUrl`) before upgrading to TypeScript 7.
- **Noted:** 2026-08-03
