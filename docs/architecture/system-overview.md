# System overview

```text
Browser ──► Next.js on Vercel (frontend/)
              │  App Router pages (Server Components), Server Actions, Route Handlers, proxy.ts
              ▼
            @tunetracker/backend (backend/)  ← server-only: auth, authorization, services, storage
              │                 │
              ▼                 ▼
   @tunetracker/data (data/)   Supabase Auth + Storage (service role, server only)
   Prisma 7 + pg adapter        ▲
              │                 │ direct signed uploads / signed playback URLs
              ▼                 │
   Supabase Postgres  ◄─────────┘   Browser ──► Supabase Storage
```

There is **no standalone backend**. All server code runs inside Next.js (Vercel functions in production,
the Next standalone server in Docker).

## Packages

| Package | Responsibility | May import |
|---|---|---|
| `packages/shared/` (`@tunetracker/shared`) | Zod schemas, constants, result types | `zod` only |
| `data/` (`@tunetracker/data`) | Prisma schema, migrations, generated client, `db()` | shared |
| `backend/` (`@tunetracker/backend`) | Supabase session verification, permission rules, services, rate limiting, storage signing | data, shared |
| `frontend/` (`@tunetracker/frontend`) | Next.js app: routes, UI, Server Actions (thin wrappers), route handlers | backend (server files only), shared |

Boundaries:

- `backend/` and `data/` start with `import 'server-only'`; importing them from a Client Component fails the build.
- `@tunetracker/backend/proxy` is the one edge-safe entry (no `server-only`), used by `frontend/src/proxy.ts`.
- Client Components only import **types** from `@tunetracker/backend`.
- No circular dependencies: `shared ← data ← server ← client`.

Workspace packages export TypeScript source (`exports: ./src/index.ts`); Next.js/Turbopack transpiles
them automatically (npm workspaces). There is no separate package build step.

## Request flow

1. `proxy.ts` refreshes the Supabase session cookie and redirects anonymous visitors away from app
   routes (convenience only — not the security boundary).
2. The `(application)` layout calls `requireProfile()`, which verifies the user with Supabase Auth
   (`auth.getUser()` round-trip) and creates the profile row on first visit.
3. Pages call services with the verified profile id. Mutations go through Server Actions →
   `runAction()` → service → `authorizeProject()` (role check) → Prisma.
4. Errors become `{ ok: false, error, fieldErrors }`; unexpected errors are logged and never leaked.

## Key decisions

- **One board per project** — columns belong to the project; no separate Board table.
- **Ordering** — integer positions, renumbered inside a transaction that first takes
  `SELECT … FOR UPDATE` on the project row, so concurrent drags cannot interleave.
- **Uploads** — the server reserves a `MediaAsset` row + single-use signed upload token; the browser
  PUTs the file directly to Storage; the server then verifies size/type from Storage before marking
  it verified. Files never pass through Vercel functions.
- **Rate limiting** — fixed windows in a Postgres `RateLimit` table (works across serverless instances).
- **Cache Components** are off: authenticated pages are dynamic; marketing pages are static.

## Layout

```text
frontend/                 Next.js app (Vercel Root Directory)
backend/                  server-only services imported by Next.js entrypoints (no running server)
data/                     Prisma schema + migrations, Supabase config and storage migrations
packages/shared/          Zod schemas, constants, shared types
infrastructure/docker/    Dockerfile (dev + production targets)
infrastructure/scripts/   verification and gate scripts
tests/e2e/                Playwright journeys
```
