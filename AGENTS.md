# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

FixLocal is a civic issue reporting platform (pnpm monorepo). See `README.md` for full details.

| Package | Path | Purpose |
|---|---|---|
| `@fixlocal/api` | `apps/api` | Express + TypeScript REST backend |
| `@fixlocal/mobile` | `apps/mobile` | Expo Router React Native app |
| `@fixlocal/shared` | `packages/shared` | Shared Zod schemas |

### Quality commands

Standard commands from `package.json` scripts (root):

- **Lint:** `pnpm lint`
- **Typecheck:** `pnpm typecheck`
- **API tests:** `pnpm test`
- **Mobile tests:** `pnpm --filter @fixlocal/mobile test`
- **Format check:** `pnpm format`

### Running the API dev server

1. Ensure `apps/api/.env` exists (copy from `apps/api/.env.example` and fill in values).
2. Run `pnpm --filter @fixlocal/api dev` — starts on port 4000 with hot reload via `tsx watch`.
3. Health check: `curl http://localhost:4000/health` should return `{"status":"ok"}`.

### Known caveats

- **Typecheck TS2742 errors:** `pnpm typecheck` and `pnpm --filter @fixlocal/api build` produce TS2742 errors (`The inferred type of 'app' cannot be named...`) due to Express type inference with pnpm's strict node_modules layout. This is a pre-existing issue — the ESM runtime build succeeds and the API runs fine. Tests are not affected.
- **API tests use mocked env:** When `NODE_ENV=test` or `VITEST=true`, `apps/api/src/env.ts` injects hardcoded test values. No live Supabase/Resend/OpenAI connection is needed for tests.
- **OpenAI is optional:** If `OPENAI_API_KEY` is unset, the API falls back to a template-based email draft.
- **External services required for full functionality:** Supabase (Postgres + Auth + Storage), Resend (email), and optionally OpenAI. For dev without these, the API still starts and the `/health` endpoint works; only report submission/retrieval endpoints require live credentials.
