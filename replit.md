# CifraPro

A music chord chart (cifra) management app for musicians and church groups. Users can create, store, and organize lyrics with chords, transpose songs to different keys, and group songs into songbooks (hinários). Includes offline PWA support and cross-device sync via Supabase.

## Run & Operate

- `pnpm --filter cifrapro run dev` — run the frontend (port 3000)
- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env (frontend): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — already set in shared userenv
- Optional env (API): `DATABASE_URL` — Postgres connection string (only needed for Drizzle migrations/server-side DB access)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Shadcn UI, Wouter (routing), Supabase JS client
- API: Express 5 (minimal — primary data logic lives in Supabase)
- DB: PostgreSQL via Supabase (auth + RLS + real-time sync)
- Server-side ORM: Drizzle ORM (for migrations)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cifrapro/` — React+Vite frontend
- `artifacts/api-server/` — Express API server
- `lib/db/` — Drizzle schema and DB config
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-zod/` — Zod schemas generated from OpenAPI spec
- `lib/api-client-react/` — React Query hooks generated from OpenAPI spec

## Architecture decisions

- Supabase is the primary data layer; the Express API is a thin complement for server-side logic not expressible via Supabase RLS
- Auth is handled entirely by Supabase (email/password + OAuth), with `/auth/callback` in the frontend for OAuth redirects
- Port 3000: frontend (Vite dev server); Port 8080: API server (also exposed externally on port 80)

## Product

- **Cifras**: create/edit chord charts with syntax-highlighted chord editor, automatic key detection, and real-time preview
- **Transposition**: change the musical key of any song on the fly
- **Hinários**: organize songs into songbooks/set lists
- **Search**: full-text search across all charts
- **Offline**: PWA capabilities (currently commented out in vite.config.ts — can be re-enabled)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `strictPort: true` is set in vite.config.ts — Vite will fail loudly if port 3000 is already in use instead of silently moving to the next port
- The PWA plugin (`vite-plugin-pwa`) is installed but commented out in `vite.config.ts` — re-enable by uncommenting the import and plugin config

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
