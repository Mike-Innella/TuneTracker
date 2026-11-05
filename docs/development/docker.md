# Docker

One Dockerfile (`infrastructure/docker/frontend.Dockerfile`) with these targets:

| Target | Use |
|---|---|
| `deps` | `npm ci` from the root lockfile; runs `prisma generate` |
| `dev` | `next dev` with hot reload, runs as `node` |
| `builder` | `next build` (standalone output, workspace packages traced from the repo root) |
| `runner` | minimal Node 24 image, non-root, `HEALTHCHECK` on `/api/health` |

Compose project name: **`tunetracker2`** (deliberately different from the legacy `tunetracker`
stack so `docker compose` commands can never touch the old MySQL container).

## Development (hot reload)

```bash
npm run supabase:start                       # Auth + Storage on the host
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

`frontend/`, `backend/`, `packages/shared/` and the Prisma schema are bind-mounted; edits reload live.
Postgres data persists in the `tunetracker2_pgdata` volume. The one-shot `migrate` service applies
migrations before the app starts.

## Production image

```bash
docker compose up --build -d
node infrastructure/scripts/verify-docker-prod.mjs   # health, non-root uid, migrations, rendered page
```

`NEXT_PUBLIC_*` values are inlined at build time (build args from `.env`). Server secrets are
runtime environment only. Inside Docker the server reaches Supabase at `SUPABASE_INTERNAL_URL`
(`host.docker.internal:54321`) while browsers use `NEXT_PUBLIC_SUPABASE_URL`; the auth cookie name is
fixed so both agree.

Shutdown: `init: true` gives the server a proper PID 1, so `docker compose stop` sends SIGTERM and the
server exits cleanly.

Vercel does **not** use this image — see `docs/deployment/vercel.md`.
