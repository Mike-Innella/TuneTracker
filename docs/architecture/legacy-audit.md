# Legacy Audit — TuneTracker 1.x capstone

Audited 2026-11-05. The original source is preserved at git tag `legacy-baseline`
and, for reference during migration, under `legacy/` (excluded from the workspace,
lint, build and Docker contexts).

## 1. Architecture (as found)

| Layer | Implementation |
|---|---|
| Frontend | Vite 7 + React 19 SPA, React Router 7, MUI 7 + Emotion, axios, react-hook-form, dnd-kit |
| Backend | Express 5 long-running server (`server/src/index.ts`), MVC: routes → controllers → services → Prisma |
| Database | MySQL 8 via Prisma 7 + `@prisma/adapter-mariadb` |
| Auth | Custom email/password: bcrypt hashes in `User.passwordHash`, JWT (7d) in `tt_session` httpOnly cookie |
| Media | Raw audio PUT through Express (150 MB body limit) to local disk (`uploads/tracks`) or S3; profile images stored as base64 data URLs in `User.profileImageData` (MEDIUMTEXT) |
| Hosting | Docker (nginx SPA + API) and AWS App Runner (`apprunner.yaml`) |
| Tests | Jest + supertest (server, 48 tests, 34 need a live DB), Vitest (client utils, 10 tests) |

Baseline measured before refactoring: server `npm test` → 14 passed, 34 skipped (DB);
client `vitest run` → 10 passed; client `npm run build` → success.

## 2. Routes and endpoints

Client routes: `/`, `/auth`, `/public/:projectId`, `/feed`, `/feed/:postId`,
`/dashboard`, `/projects`, `/projects/:projectId` (board),
`/projects/:projectId/tracks/:trackId`, `/profile`.

API (`/api`): `auth/{ping,register,login,logout,me,public/:userId}`;
`projects` CRUD + `projects/public[/:id]`; `projects/:id/tracks` CRUD, `PUT|DELETE …/audio`,
`…/session-logs`, `…/notes`, `…/comments`, `…/like`, `…/rating`, `…/engagement`;
`posts` feed CRUD, `…/comments`, `…/like`; `health`, `health/db`.

## 3. Data model (MySQL)

`User`, `UserSocialLink`, `Project` (PUBLIC/PRIVATE), `Track` (status IDEA/DRAFT/MIX/MASTER,
bpm, key, s3ObjectKey), `TrackLike`, `TrackRating`, `Comment`, `SessionLog`, `NoteForLater`,
`Post`, `PostComment`, `PostLike`. MySQL-specific: `@db.MediumText`, `@db.Text`,
mariadb adapter, case-insensitive `contains` relying on MySQL collation.

## 4. Kanban as found

The "board" is four **fixed** columns derived from `Track.status`. Dragging a card PATCHes
the status. There is no column customisation, no persisted in-column ordering, no
tasks distinct from tracks, no labels/checklists/assignees.

## 5. Security weaknesses

1. **PII leak** — public project, post and track endpoints `select` the owner's `email`
   and return it to anonymous callers.
2. Profile images as unbounded base64 in the DB row; `express.json` limit is 150 MB, so any
   JSON endpoint accepts 150 MB bodies.
3. Audio is proxied through the API process (memory/egress cost, no quota per user).
4. Custom JWT auth: no email verification, no password reset, no session revocation.
5. Authorization is repeated ad hoc (`project.ownerId !== viewerUserId`) in ~10 places; no
   collaborator concept.
6. Rate limiting is in-memory (`express-rate-limit`), which does not survive multiple instances.
7. Committed-adjacent secrets: `server/.env`, `.env.local`, `.env.production` exist in the
   working copy (never committed to the new repository; `.gitignore` excludes them).

## 6. Technical debt

Duplicate route trees for track engagement (mounted twice), `bcrypt` and `bcryptjs` both
installed, generated Prisma client and `dist/` checked into the working copy, MUI + Emotion
styling objects (`uiStyles.ts`) rather than a token system, no shared types between client
and server.

## 7. Feature-preservation matrix

| # | Legacy feature | State | 2.0 migration approach | Verification |
|---|---|---|---|---|
| 1 | Email/password register/login/logout | Works (custom JWT) | **Replaced** by Supabase Auth (adds verification + reset) | e2e `auth.spec.ts` |
| 2 | Protected routes | Works (client-side guard) | Replaced by server-side session check in `(application)` layout + per-action authorization | e2e `auth.spec.ts` + `profile.spec.ts` (404 for strangers) |
| 3 | Profile: display name, image, social links | Works | Preserved & extended: username, bio, specialties, location, links; avatar in Supabase Storage | e2e `profile.spec.ts` |
| 4 | Public user profile dialog | Works | Replaced by `/artists/[username]` page | e2e `profile.spec.ts` |
| 5 | Projects CRUD + visibility | Works | Preserved; adds archive, status, deadline, artwork, templates, collaborators | integration `board.test.ts`, e2e `board.spec.ts` |
| 6 | Kanban (4 status columns, drag to change status) | Works, fixed columns | **Replaced** by customisable columns + persistent ordered tasks (dnd-kit) | integration `board.test.ts`, e2e `board.spec.ts` (drag + reload) |
| 7 | Tracks (title, description, bpm, key, status) | Works | Tracks become **tasks**; bpm/key kept as optional task fields; status → column | integration board tests |
| 8 | Track audio upload + playback | Works (proxied) | Replaced by direct browser → Supabase Storage signed upload + signed playback URLs | e2e `community.spec.ts` (upload + playback) |
| 9 | Session logs / notes for later | Works | Folded into task comments (single discussion stream) | integration `board.test.ts` (task details) |
| 10 | Public project view | Works | Preserved as `/showcase/[projectId]`; only explicitly public data rendered | integration `board.test.ts` + `community.test.ts` (private project not leaked) |
| 11 | Track likes / ratings / comments | Works | Consolidated into post reactions + comments (community feed) | integration `community.test.ts` |
| 12 | Community feed: posts, comments, likes | Works (text + optional project) | Preserved & extended: titles, types, audio, images, links, feedback requests, reactions, pagination | integration `community.test.ts`, e2e `community.spec.ts` |
| 13 | Dashboard summary | Works (client-side computed) | Rebuilt server-side from real data | e2e `auth.spec.ts` (dashboard stats) |
| 14 | Health endpoints | Works | Preserved: `/api/health` | Docker healthcheck, `verify-docker-prod.mjs` |
| 15 | Docker + nginx + App Runner deploy | Works | **Replaced** by Next.js standalone image (portable) + Vercel | `docker` CI job, `verify-docker-prod.mjs` |

## 8. Migration risks

- **Existing data**: the legacy MySQL container holds 1 user, 1 project, 1 track. Passwords are
  bcrypt hashes that Supabase Auth cannot reuse without the admin import API. Data migration is
  documented as a manual procedure in `docs/deployment/supabase.md`; no ETL was built for one row.
- Track IDs were `cuid`; 2.0 profile IDs are Supabase `auth.users.id` UUIDs.
- Case-insensitive search: Postgres needs `mode: 'insensitive'`.
