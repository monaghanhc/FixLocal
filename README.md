# FixLocal

FixLocal is an Expo + Node.js MVP for reporting civic issues (potholes, graffiti, broken lights) with photo evidence and auto-routed email delivery to the right local authority.

## What this MVP ships

- Expo React Native app (`apps/mobile`) with:
  - Supabase Auth (anonymous session + optional magic link)
  - Report flow:
    - capture/select photo(s)
    - auto-detect location + reverse geocode
    - choose issue type + notes
    - AI-assisted email preview with editable subject/body
    - send report
  - History screen with status, timestamp, location, and thumbnail
  - Offline messaging + loading/error states
- API (`apps/api`) with:
  - `POST /api/report` (multipart photo upload, authority lookup, AI draft generation fallback, email send, DB log)
  - `GET /api/reports?userId=...`
  - Supabase JWT verification middleware
  - input validation with `zod`
  - report rate limiting
  - Supabase Postgres + Storage integration
  - Resend email sending
  - OpenAI Responses API draft generation with safe fallback template
- Shared package (`packages/shared`) for types/schemas
- CI (`.github/workflows/ci.yml`) running lint + typecheck + API tests

## Monorepo layout

```text
apps/
  api/       Express + TypeScript backend
  mobile/    Expo Router app (TypeScript)
packages/
  shared/    shared types/schemas
```

## Tech stack

- Mobile: Expo SDK 54, Expo Router, React Hook Form, Zod, Supabase Auth
- API: Node.js, Express, Zod, Supabase JS, OpenAI, Resend
- Database: Supabase Postgres + Supabase Storage
- Tests: Vitest (API + mobile component smoke)
- CI: GitHub Actions

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project
- OpenAI API key
- Resend account + API key
- (For builds) EAS account + CLI

## Environment variables

### API (`apps/api/.env`)

Start from `apps/api/.env.example`:

- `PORT`
- `NODE_ENV`
- `API_CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_STORAGE_BUCKET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO` (optional)
- `DEFAULT_CONTACT_NAME`
- `DEFAULT_CONTACT_EMAIL`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

### Mobile (`apps/mobile/.env`)

Start from `apps/mobile/.env.example`:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

For physical devices, set `EXPO_PUBLIC_API_URL` to your machine LAN IP (not `localhost`).

## Supabase schema + migrations

Migrations live in `apps/api/supabase/migrations`:

- `001_init.sql`
  - `authorities` table (zip/city/default routing contacts)
  - `reports` table (audit log for each submitted report)
  - indexes + constraints + restrictive anon policies
- `002_storage_bucket.sql`
  - creates public storage bucket `report-photos`

Seed data:

- SQL seed file: `apps/api/supabase/seed.sql`
- Node seed script: `pnpm --filter @fixlocal/api seed:authorities`

Suggested setup sequence:

1. Create Supabase project.
2. Apply migrations (`001_init.sql`, `002_storage_bucket.sql`) in SQL editor or via Supabase CLI.
3. Apply `seed.sql` or run `seed:authorities`.
4. In Supabase Auth settings, enable anonymous auth and/or email OTP.

## Run locally

1. Install deps:

```bash
pnpm install
```

2. Configure API env:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Configure mobile env:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

4. Start API (terminal 1):

```bash
pnpm --filter @fixlocal/api build
pnpm --filter @fixlocal/api start
```

For hot reload:

```bash
pnpm --filter @fixlocal/api dev
```

5. Start mobile app (terminal 2):

```bash
pnpm --filter @fixlocal/mobile start
```

## API behavior notes

### `POST /api/report`

- Accepts multipart form-data:
  - `photos` (1-4 images)
  - `userId`
  - `issueType`
  - `notes` (optional)
  - `location` JSON (`latitude`, `longitude`, `city`, `state`, `zip`, `formattedAddress?`)
  - `mode`: `preview` or `send`
  - `subject` / `body` (optional overrides)
- Flow:
  1. Verify Supabase JWT
  2. Validate payload
  3. Lookup authority by zip -> city/state -> default
  4. Generate email draft via OpenAI (or fallback template)
  5. If `preview`: return draft only
  6. If `send`: upload photos, insert queued report, send email via Resend, mark sent/failed

### `GET /api/reports?userId=...`

- Requires bearer token
- Token `sub` must match `userId`
- Returns report history ordered newest first

## Authority management

- Seed defaults:

```bash
pnpm --filter @fixlocal/api seed:authorities
```

- Add a single authority:

```bash
pnpm --filter @fixlocal/api add:authority --name=\"City Public Works\" --email=\"pw@city.gov\" --city=\"City\" --state=\"CA\" --zip=\"94103\"
```

Optional: set `--is_default=true` for fallback routing.

## Email sending and sandbox behavior

- Provider: Resend (server-side only)
- API keys are never stored in mobile app
- If your sending domain is not fully configured, Resend may restrict delivery. In that case:
  - keep using preview mode for UX validation
  - review report status in History (`failed` with reason)
  - finish domain verification before production launch

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @fixlocal/mobile test
```

## Deploy backend (Render)

Create a **Web Service** from this repo and configure:

- Root directory: repository root
- Build command:

```bash
pnpm install --frozen-lockfile && pnpm --filter @fixlocal/api build
```

- Start command:

```bash
pnpm --filter @fixlocal/api start
```

- Add all API env vars from `apps/api/.env.example`.

After deploy, set `EXPO_PUBLIC_API_URL` in mobile env to the Render URL.

## Expo EAS setup and release builds

From `apps/mobile`:

```bash
pnpm exec eas login
pnpm exec eas build:configure
```

`apps/mobile/eas.json` already includes `development`, `preview`, and `production` profiles.

Build examples:

```bash
pnpm exec eas build --platform ios --profile preview
pnpm exec eas build --platform android --profile production
```

## Manual smoke test (MVP)

1. Launch API and mobile with valid env vars.
2. Sign in anonymously or via magic link.
3. On Report Issue:
   - capture/select image
   - confirm location auto-filled
   - choose issue type and notes
4. Tap **Generate Email Preview**, edit subject/body.
5. Tap **Send Report**.
6. Confirm:
   - success (or documented failure reason)
   - report appears in History with status + thumbnail.

