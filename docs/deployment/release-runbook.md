# Release runbook — first production launch

Everything below has been exercised locally against the production Docker image; the hosted steps
(1–5) need the owner's credentials and go-ahead. Do them in order.

## 0. Preconditions

- `main` is green on CI (lint/types/unit, integration on Postgres + Redis, production build, Docker
  + Trivy, e2e incl. axe, dependency audit, secret scan).
- The `sb_secret_…` service key that was shared in chat has been **rotated** in Supabase
  (Project Settings → API keys) and the new value is what goes into Vercel.

## 1. Back up the hosted database

Dashboard → Database → Backups (daily backups are on by default; take an on-demand one), **or**:

```bash
pg_dump "$DIRECT_URL" --format=custom --no-owner --file "tunetracker-$(date +%F).dump"
```

Keep the dump until the release is verified.

## 2. Apply the schema migrations

Hosted currently has `init` and `enable_rls`. Pending, all additive (new tables/columns/enums, RLS on
every new table; nothing is dropped or rewritten):

| Migration | Adds |
|---|---|
| `20261105150000_social_foundations` | follows, project invites, moderation roles/actions, profile email/suspension |
| `20261105160000_music_core` | tracks, likes, plays (+ turns existing audio posts into published tracks) |
| `20261106120000_comment_threads` | comment replies (`parentId`) |
| `20261106130000_blog` | articles, `ARTICLE` report target |
| `20261106140000_playlists` | playlists + items |

```bash
export DIRECT_URL='postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres'
# guard: the Prisma config prefers DIRECT_URL and also loads the local .env (which has a local
# DIRECT_URL). Only a variable set in the shell wins — confirm the target before touching anything:
node -e "console.log(new URL(process.env.DIRECT_URL).host)"          # must print the Supabase host
npm exec -w @tunetracker/data -- prisma migrate status              # expect 5 pending
npm run db:deploy                                                   # apply
npm exec -w @tunetracker/data -- prisma migrate status              # expect: up to date
```

Use the **session/direct** connection (port 5432), not the transaction pooler.

## 3. Storage

Buckets come from `data/supabase/migrations/20261105000000_storage_buckets.sql` (already applied to
hosted). Re-run only if `media` / `public-media` are missing:
`npx supabase db push --db-url "$DIRECT_URL" --workdir data` (with the same exported `DIRECT_URL`).

## 4. Auth settings (Dashboard → Authentication)

- **Site URL**: the production URL. **Redirect URLs**: production + `https://*-<team>.vercel.app/**`.
- **Email templates** (token-hash links; copy from `data/supabase/templates/`):
  - Confirm signup → `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/home`
  - Reset password → `…&type=recovery&next=/reset-password`
  - Invite user → `…&type=invite&next=/reset-password`
- **SMTP**: a real provider (the built-in sender is rate-limited to a few emails an hour).

## 5. Vercel

Project settings and environment variables: see `vercel.md` (Root Directory `frontend`, include
files outside the root, Node 24, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler 6543), `NEXT_PUBLIC_SITE_URL`, optional
`REDIS_URL`). Connect the GitHub repo, then deploy a **preview** first.

## 6. Verify the preview, then promote

Run the checks in `vercel.md` → *Verify a deployment*, plus:

1. A signed-out visitor can open `/home`, `/discover`, `/blog` and play a track.
2. Upload a file over 6 MB (resumable path) and publish it through the wizard.
3. Follow an artist, mention them in a post, reply in a thread — notifications arrive.
4. Write and publish an article; a guest reads it; report it from another account; a moderator
   (appointed with `DATABASE_URL='<hosted connection>' npm run set-role -w @tunetracker/data --
   <username> MODERATOR`; set in the shell so it beats the local `.env`) removes it.
5. `/studio/analytics` shows the listens from step 1.

Promote the preview to production when all pass.

## Rollback

- **App**: Vercel → Deployments → previous production deployment → *Promote* (instant).
- **Data**: the migrations are additive, so the previous app version runs against the new schema; a
  schema rollback is not needed to roll back the app. If data must be restored, restore the step-1
  backup (Dashboard → Backups → Restore, or `pg_restore --clean --no-owner -d "$DIRECT_URL" <dump>`).
