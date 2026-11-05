# Deploying to Vercel

Status: **build verified locally with `vercel build`** from a clean checkout (workspace packages,
generated Prisma client, Prisma query compiler WASM and `pg` are traced into the functions).
A real deployment has not been performed yet — it needs the Vercel project and Supabase credentials.

## Project settings

| Setting | Value |
|---|---|
| Framework | Next.js |
| Root Directory | `client` |
| Include files outside the Root Directory | **Enabled** (needed for `server/`, `data/`, `shared/`) |
| Install Command | default (`npm install` at the repo root — npm workspaces + root lockfile) |
| Build Command | default (`next build`) |
| Node.js | 24.x |

`prisma generate` runs from the `data` workspace's `postinstall`, so the client exists before
`next build`. The build needs no database access.

## Environment variables

| Name | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | all | anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | all (server) | **secret**; never prefix with `NEXT_PUBLIC_` |
| `DATABASE_URL` | all | transaction pooler, port 6543 |
| `DIRECT_URL` | where migrations run | direct connection, port 5432 |
| `NEXT_PUBLIC_SITE_URL` | production | canonical URL, used in auth emails |

## GitHub integration

Connect the repository in Vercel: every PR gets a Preview Deployment, `main` deploys to Production.
In GitHub, protect `main` and require the CI checks (`quality`, `integration`, `build`, `docker`,
`e2e`, `Security`) so production only receives green commits. In Vercel, add the preview URL pattern
to Supabase Auth redirect URLs (see `supabase.md`).

## Verify a deployment

1. `GET /api/health` → `{ "ok": true }`.
2. Sign up → confirmation email → lands on `/dashboard`.
3. Create a project, drag a task, reload: order persists.
4. Upload a short audio file to a post and play it.
