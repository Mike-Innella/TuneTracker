# Database

PostgreSQL (Supabase in production, `postgres:17` in Docker/CI). Schema: `data/prisma/schema.prisma`.

## Ownership (avoids Prisma/Supabase migration conflicts)

| Owner | Location | Owns |
|---|---|---|
| Prisma Migrate | `data/prisma/migrations` | every table in `public` |
| Supabase CLI | `data/supabase/migrations` | `storage.buckets` (and any `storage` policies) |

Never create `public` tables from Supabase migrations, and never touch `auth`/`storage` from Prisma.
`Profile.id` equals `auth.users.id` but has **no cross-schema foreign key**, so the same migrations
also run on plain Postgres for Docker and CI.

## Row Level Security

All app access is server-side through Prisma (the table owner, which bypasses RLS). Migration
`*_enable_rls` turns RLS on for every `public` table **with no policies**, so Supabase's PostgREST API
(anon/authenticated roles) can read nothing. An integration test fails if any table lacks RLS.
**When you add a table, enable RLS in the same migration.**

Storage: `media` (private; signed URLs only) and `public-media` (avatars, artwork, post images).
No object policies are granted to anon/authenticated; uploads use server-issued signed tokens.

## Entities

Profile, SocialLink, Project, ProjectMember (EDITOR/VIEWER; owner is `Project.ownerId`), BoardColumn,
Task, Label (m2m with Task), ChecklistItem, TaskComment, MediaAsset (audio/image/file; `verifiedAt`),
Post, PostComment, Reaction (composite PK), Notification, Activity, Report, RateLimit.

Cascades: deleting a project deletes its columns, tasks, members, labels and activity; posts linked to
it keep existing with `projectId = NULL`. Deleting a profile cascades to everything it owns.

## Connections on Vercel

`DATABASE_URL` → Supabase **transaction pooler** (port 6543). The `pg` adapter pool is capped at
`DB_POOL_MAX` (default 3) per function instance. `DIRECT_URL` → direct connection (port 5432), used
only by `prisma migrate`.

## Migrations, backups, recovery

```bash
npm run db:migrate      # dev: create + apply a migration (DIRECT_URL)
npm run db:deploy       # CI/prod: apply pending migrations only — never resets data
npm run migrate:status -w @tunetracker/data
```

- Production migrations are applied manually (or by a protected workflow you add) after review; CI
  never migrates production. Destructive changes use expand → migrate data → contract.
- Before any production migration: take a backup (Supabase dashboard → Database → Backups, or
  `pg_dump "$DIRECT_URL" -Fc -f backup.dump`).
- Recovery: `pg_restore --clean --no-owner -d "$DIRECT_URL" backup.dump`, or Supabase point-in-time
  recovery on paid plans.

## Phase 1 models

`Follow` (composite PK follower/following), `ProjectInvite` (PENDING → ACCEPTED / DECLINED / REVOKED;
`inviteeId` for artists, `email` for people without an account, linked on first sign-in),
`ModerationAction` (audit trail; survives a moderator's account deletion via `SetNull`).
`Profile` gains `role` (USER/MODERATOR/ADMIN), `suspendedAt` and a server-only `email` used to match
email invitations — it is never selected into public payloads. All new tables enable RLS in their migration.
