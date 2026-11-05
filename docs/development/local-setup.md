# Local setup

Requirements: Node 24 (or 22+), npm 11, Docker.

```bash
npm ci                         # installs all workspaces + generates the Prisma client
npm run supabase:start         # Supabase local: Auth, Storage, Mailpit (first run pulls images)
npx supabase status --workdir data   # copy ANON_KEY and SERVICE_ROLE_KEY
cp .env.example .env           # paste the keys
docker compose up -d db        # Postgres for app data
npm run db:deploy              # apply migrations
npm run dev                    # http://localhost:3000
```

Supabase Storage buckets are created by `data/supabase/migrations` when Supabase starts.

Emails (sign-up confirmation, password reset) land in **Mailpit**: http://127.0.0.1:54324.

## Tests

```bash
npm run test:unit          # shared schemas, permission rules, ordering, upload rules, client utils
npm run test:integration   # services against real Postgres (creates <db>_test automatically)
npm test                   # both
npm run test:e2e           # Playwright against the running app + Supabase local
```

E2E signs up real users through Supabase Auth and Mailpit. Many sign-ups from one IP hit the app's
own rate limits; set `RATE_LIMIT_SCALE=50` in `.env` for local e2e runs (it can only raise limits).

## Quality

```bash
npm run format:check && npm run lint && npm run typecheck
```

## Troubleshooting

- **Dev server reload loop** after many edits to workspace packages: stop `next dev`, delete
  `frontend/.next`, start again. (Seen with Turbopack 16.4 on long-running dev sessions.)
- **Hydration warnings** in dev after hot edits: restart the dev server before investigating.
