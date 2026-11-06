<p align="center">
  <img src="frontend/public/branding/logo-mark.svg" width="96" alt="TuneTracker logo" />
</p>

<h1 align="center">TuneTracker 2.0</h1>
<p align="center"><strong>Create. Collaborate. Share.</strong><br/>A workspace for music projects — Kanban boards shaped like your production workflow, collaborators with real roles, and a community to share demos and finished tracks.</p>

---

## Features

**Listen** — open to everyone, no account needed
- **Home** — new releases, trending (most played in 30 days), fresh samples, and — signed in — tracks
  from artists you follow.
- **Discover** — search tracks, samples and artists; Tracks/Samples tabs, genre and sort filters,
  pagination; play straight from the grid.
- **A player that never stops** — one app-wide player with a queue and lock-screen controls; playback
  continues while you browse.
- **Track and artist pages**, **public playlists**, and a **blog** (categories, tags, search, related
  reads).

**Share**
- **Community** — posts with audio, images and embedded tracks; threaded replies; @mentions that
  notify; reactions; feedback requests; reporting.
- **Follows** — follower counts, a Following feed and notifications.
- **Blog** — write in a rich-text editor (server-sanitized), drafts, publishing.

**Make** (Studio)
- **Guided upload** — upload → details (artwork, genre, BPM, key, tags, credits) → release; large files
  resume if the connection drops; samples carry usage rights before they can be downloaded.
- **Playlists** (ordered, public or private) and **saved tracks**.
- **Analytics** from real listens — plays per day, listeners, likes, playlist adds, top tracks.
- **Projects** — Kanban boards with music-production templates, drag and drop (mouse, touch,
  keyboard), tasks with checklists, comments, attachments, BPM and key; collaborators join by
  accepting an invitation (by username or email) as editor or viewer.
- **A first-run checklist** that ticks itself off as you go.

**Trust & safety** — moderation dashboard (remove content, suspend accounts, audit trail), account
deletion, rate limits (Redis or Postgres), Row Level Security on every table.

Dark (default) and light themes, mobile-first, **zero axe violations (WCAG 2.2 AA)** across the app in
both themes, reduced-motion aware.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui
(Radix) + Animate UI (Motion) · dnd-kit · Tiptap · Supabase (Auth, Storage, Postgres) · Prisma 7 · Redis
(optional) · Zod · Vitest · Playwright + axe · Docker · GitHub Actions · Vercel.

## Repository layout

```text
frontend/   Next.js app (routes, UI, Server Actions, route handlers)
backend/   server-only services: auth, authorization, projects, board, tasks, community, media…
data/     Prisma schema + migrations, Supabase config/storage migrations, db client
packages/shared/   Zod schemas, constants, shared types
infrastructure/   multi-stage Dockerfile (dev + production)
tests/e2e Playwright end-to-end suite
docs/     architecture, API, development, deployment, security, brand
```

## Quick start

```bash
npm ci
npm run supabase:start              # local Auth + Storage + Mailpit
cp .env.example .env                # paste keys from: npx supabase status --workdir data
docker compose up -d db && npm run db:deploy
npm run dev                         # http://localhost:3000
```

Or the full Docker dev stack with hot reload:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

Confirmation and reset emails arrive in Mailpit at http://127.0.0.1:54324.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / start |
| `npm run lint` · `typecheck` · `format:check` | Quality gates |
| `npm test` | Unit + integration (integration uses an isolated `<db>_test` database) |
| `npm run test:e2e` | Playwright against the app + Supabase local |
| `npm run db:migrate` · `db:deploy` · `db:seed` | Prisma migrations |

## Documentation

- [System overview](docs/architecture/system-overview.md) · [Database](docs/architecture/database.md) · [Legacy audit](docs/architecture/legacy-audit.md)
- [Server entrypoints](docs/api/endpoints.md)
- [Local setup](docs/development/local-setup.md) · [Docker](docs/development/docker.md) · [Contributing](docs/development/contributing.md)
- [Vercel](docs/deployment/vercel.md) · [Supabase](docs/deployment/supabase.md)
- [Security model](docs/security/security-model.md)
- [Design system](frontend/DESIGN.md) · [Product](frontend/PRODUCT.md)

## History

TuneTracker 1.x (Express + MySQL + Vite) is preserved at tag
[`legacy-baseline`](https://github.com/Mike-Innella/TuneTracker/tree/legacy-baseline).

## License

[MIT](LICENSE)
