# Security model

## Identity

- Supabase Auth (email + password, mandatory email verification, password reset via token-hash
  links). Sessions are HTTP-only cookies managed by `@supabase/ssr`; `proxy.ts` refreshes them.
- Every page and action re-verifies with `supabase.auth.getUser()` (a round-trip to Auth), never by
  decoding the cookie alone.
- The service-role key exists only on the server (`backend/src/auth/supabase.ts`); it is used for
  storage signing/verification, not for data access.

## Authorization

- Single rule table (`backend/src/authorization/permissions.ts`): viewer < editor < owner.
- `authorizeProject/Task/Column` resolve the resource's project from the database, then check the
  actor's role — client-supplied ownership is never trusted (IDOR prevention, covered by tests that
  move a task into another project's column).
- Private projects return 404 to non-members so ids cannot be probed.
- Community: only authors edit/delete posts; comment deletion by its author or the post's author.
- Posts may only reference media the author uploaded and verified; a linked private project is shown
  as nothing.

## Input & output

- All inputs validated by Zod schemas in `packages/shared/`. Links must be `http(s)`; `javascript:`/`data:`
  URLs are rejected. User text renders as text (React escaping), never as HTML.
- JSON-LD on the homepage escapes `<`.
- Security headers: CSP (`frame-ancestors 'none'`, `object-src 'none'`, Supabase-only media/connect),
  `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`.
- Post-auth redirects accept only same-origin relative paths (`safeNext`).
- Unexpected errors are logged server-side; clients get a generic message.

## Uploads

Type allow-lists per kind, size limits (audio 50 MB / images 5 MB / files 25 MB), 1 GB per-user
quota, 60 upload requests/hour, owner-namespaced storage paths, and post-upload verification of the
stored object's size and type (invalid objects are deleted). Private media is served only through
short-lived signed URLs.

## Abuse prevention

Postgres-backed rate limits: sign-up (10/h/IP), sign-in (30/10 min/IP), password reset (5/h/IP),
posts (20/h), comments (60/10 min), invites (30/h), reports (10/h). Supabase Auth applies its own
limits. Report actions exist on posts, comments and profiles; reports are stored in `Report` for the
operator to review (no moderation UI yet).

## Database

RLS enabled with no policies on every `public` table (PostgREST sees nothing). See `database.md`.

## Known limitations

- No moderation dashboard: reports must be reviewed in the database.
- Upload rows reserved but never completed count toward quota until cleaned up.
- CSP allows `'unsafe-inline'` scripts (required by Next.js without nonces).
- No account-deletion UI yet.

## Phase 1

- **Collaboration**: nobody joins a project without accepting an invitation; only the invitee can answer
  it, only the owner can revoke it. Email invitations go through Supabase Auth's invite email.
- **Moderation**: role-gated (MODERATOR/ADMIN) and invisible to others (404). Every decision is recorded in
  `ModerationAction`; owners are notified when their content is removed. Suspension sets `suspendedAt`
  (treated as signed out everywhere) and bans the Auth user so sessions cannot be refreshed.
- **Account deletion**: typed-username confirmation; stored files are deleted first, then all owned rows
  (cascades), then the Auth user.
- **Rate limiting**: Redis when `REDIS_URL` is set, Postgres otherwise; if Redis is unreachable the limiter
  falls back to Postgres (it never fails open).
