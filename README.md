<p align="center">
  <img src="frontend/public/branding/logo-mark.svg" width="96" alt="TuneTracker logo" />
</p>

<h1 align="center">TuneTracker 2.0</h1>
<p align="center"><strong>Create. Collaborate. Share.</strong><br/>A workspace for music projects — Kanban boards shaped like your production workflow, collaborators with real roles, and a community to share demos and finished tracks.</p>

---

## Features

- **Kanban boards** — music-production templates (songwriting, recording, production, mixing,
  mastering, release prep); add/rename/reorder/delete columns; drag tasks with mouse, touch or
  keyboard (plus a Move menu); order persists. Tasks carry priority, due date, assignee, labels,
  checklist, comments, attachments with inline audio playback, BPM and key.
- **Projects** — artwork, deadlines, status, private/public visibility, archive, delete.
- **Collaboration** — invite by username as editor or viewer; permissions enforced on the server;
  notifications for invites, assignments and feedback.
- **Community** — posts with audio and cover images uploaded straight to Supabase Storage, tags,
  links, feedback requests, comments, reactions, reporting, pagination, project-to-community sharing
  that never exposes private project data.
- **Artist profiles** — avatar, bio, specialties, links, privacy toggle, published posts, public
  project showcase.
- **Dark (default) and light themes**, mobile-first layouts, WCAG 2.2 AA target, reduced-motion aware.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui
(Radix) · Motion · dnd-kit · Supabase (Auth, Storage, Postgres) · Prisma 7 · Zod · Vitest · Playwright
· Docker · GitHub Actions · Vercel.

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
