# TuneTracker 2.0 — Platform Directive: Audit & Phased Plan

Written 2026-11-05 against `main` at the merge of PR #10 (+ PR #15, Animate UI, in review).
This answers §33 of the platform directive. Nothing below is built yet unless marked **exists**.

## 1. Repository audit (current state, verified)

| Area | State |
|---|---|
| Layout | npm workspaces: `client/` (Next.js 16.4 App Router, React 19.3, TS strict), `server/` (server-only services), `data/` (Prisma 7 + pg adapter, migrations, Supabase CLI config), `shared/` (Zod contracts) |
| Hosting | Vercel-ready (`vercel build` verified from a clean checkout); no long-running backend |
| Database | Postgres. Hosted Supabase project `ydbhyneppxhssjtekydg` (us-east-1) **migrated**: 18 tables, RLS on all; buckets `media` (private) + `public-media` |
| Auth | Supabase Auth: sign-up with email verification, login, logout, reset, session refresh in `proxy.ts`, server-side `getUser()` checks |
| Features (exist) | Dashboard; Projects (templates, artwork, status, visibility, archive/delete); Kanban board (dnd-kit, columns, tasks, labels, checklists, comments, attachments with playback, assignees); collaboration roles (owner/editor/viewer); community feed (posts with audio/image, comments, reactions, reports, pagination); profiles + `/artists/[username]`; `/showcase/[id]`; settings (theme, password) |
| Media | Direct browser → Storage signed uploads, server verification, quota, signed playback URLs |
| UI | Liner Notes design system (`client/DESIGN.md`), dark default + light, shadcn/ui on Radix swapped to Animate UI primitives, motion level "more" |
| Quality | 52 unit/integration tests (real Postgres), 15 Playwright e2e (Supabase local), CI + Security workflows green on GitHub |
| Docker | Dev (hot reload) + prod (non-root standalone) images, compose project `tunetracker2` |
| Git | `main` protected by review flow; feature branches + PRs; Conventional Commits |

**Concerns found:** everything app-side requires login (the directive needs public playback);
audio exists only as attachments/post media (no first-class Track/Sample); no global player
(each `AudioPlayer` owns an `<audio>`); no follows, playlists, collections, plays, blog,
moderation UI, account deletion or resumable uploads yet.

## 2. Feature preservation matrix

| Existing feature | Under the new directive | How it's preserved |
|---|---|---|
| Projects + Kanban board | Not mentioned in the new directive | **Decided (owner, 2026-11-05)**: kept as Studio → Projects, the collaboration workspace of §19 |
| Collaboration roles (owner/editor/viewer) | §19 collaboration requests | Extended: invitations become requests with accept/decline (pending → accepted/declined/removed) |
| Community feed, comments, reactions, reports | §11 Community board | Kept; add categories, threaded replies, mentions, embedded tracks, moderation |
| Post audio | §9/§10 tracks | Migrated: uploaded audio becomes a `Track`; posts embed tracks |
| Profiles, `/artists/[username]` | §13 | Kept; add follower counts, follow, banner, genres, playlists, articles |
| Dashboard | §8 Home | Replaced by music-first Home; project widgets move into Studio |
| Showcase | §13 public profiles/tracks | Kept as a public project page |
| Settings, theme | §5, §21 | Kept; add account deletion, notification preferences |
| Liner Notes design + Animate UI | §21 "preserve blue/indigo identity, elevate" | Kept and extended |
| Folder names | §3.2 layout | **Done (PR "adopt the directive's repository layout")**: renamed to `frontend/`, `backend/`, `data/`, `packages/shared/`, `infrastructure/docker` + `infrastructure/scripts` (first task of Phase 1) |

## 3. Target architecture

Same four workspaces (mapping: `client`=frontend, `server`=backend, `data`=data, `shared`=packages/shared).
New server services: `tracks`, `samples`, `discovery`, `follows`, `playlists`, `collections`,
`plays/analytics`, `blog`, `moderation`, `account`. Client: a root `PlayerProvider` (one
`<audio>` element, queue, Media Session API) mounted above route groups so playback survives
navigation; a public route group for landing, track, artist, blog and discover pages
(read-only, cached), with auth-gated actions that bounce through `/login?next=`.

Navigation per §7: desktop rail (Home, Discover, Community, Blog; secondary Studio, Profile,
Notifications, Settings) + header search; mobile bottom nav of the four primaries.

## 4. Database migration strategy

Prisma keeps owning `public` (additive migrations only). New models: `CreatorProfile`, `Track`,
`Sample` (+ `usageRights`, `downloadable`), `Genre`, `Tag`, `Follow`, `TrackLike`, `Play`,
`Playlist`, `PlaylistItem`, `Collection`, `CollectionItem`, `Article`, `Category`,
`CollabRequest`, `ModerationAction`, `NotificationPreference`, daily `TrackStatsDaily`.
Every new table ships with RLS enabled in the same migration (an integration test enforces it).
Data: existing post audio → `Track` rows by a reversible data migration (old columns kept until
verified). Before each hosted migration: `pg_dump` backup; rollback = restore + revert commit.
The hosted database currently holds no user data, so the first migrations carry no data risk.

## 5. Dependencies & infrastructure

- **Rich text (blog)**: Tiptap (ProseMirror) storing JSON, rendered server-side to sanitized HTML
  (`sanitize-html` allow-list). No raw HTML from users.
- **Resumable uploads**: `tus-js-client` against Supabase Storage's TUS endpoint with signed
  upload tokens; used for files > 6 MB.
- **Redis** (requested earlier): Upstash Redis for rate limiting and play-event de-duplication
  (e.g. one play per listener per track per 30 min), with the existing Postgres limiter as
  fallback when `REDIS_URL` is unset; `redis` service in compose for local dev.
- **Charts (analytics)**: one small charting library or hand-built SVG following the dataviz
  rules; decided at Phase 6.
- No AI recommendations: explainable rules (genres followed, recency, engagement).
- Waveforms/transcoding: out of Vercel's request budget; documented as an async boundary
  (Supabase Edge Function or queue) and deferred.

## 6. Security & deployment risks

- Public playback means public signed URLs for public tracks: short TTL, per-request signing,
  no listing; private drafts stay in the private bucket.
- Blog XSS: sanitize on write and render; CSP already blocks inline object/frame.
- Download abuse for samples: downloads only via a server endpoint checking `downloadable` and
  rights, rate limited.
- Analytics: plays de-duplicated and rate limited; no per-user listening history exposed.
- Hosted Supabase Auth settings (site URL, redirect URLs, token-hash email templates, SMTP) must
  be set in the dashboard — the CLI cannot change them without an access token.
- The `sb_secret_…` key was pasted in chat: rotate after deployment.
- Vercel project not connected yet (needs the owner's account).

## 7. Phased plan (each phase = branches → PR → CI green → merge)

0. **This audit** + decisions (made: Kanban → Studio Projects; rename folders).
1. **Platform foundations** (done): folder rename to the directive's layout; hosted Supabase wired to Vercel envs; Redis limiter; account
   deletion; moderation dashboard + roles; follows; collaboration requests (accept/decline,
   email invites for non-users).
2. **Music core** (done): Track/Sample models + migration of post audio; resumable uploads; guided
   upload wizard; persistent global player + queue; public track and artist pages.
3. **Navigation & Home/Discover** (done): rail + bottom nav per §7, header search, music-first Home,
   Discover with filters and pagination.
4. **Community & Blog** (done): categories, threaded replies, mentions, embeds; Tiptap blog with drafts,
   publishing, categories/tags, search, related articles, reporting.
5. **Studio** (done): onboarding/activation, track & sample management, playlists (ordered, reorder),
   collections (references), analytics from real plays, projects/Kanban as Studio → Projects.
6. **Hardening** (done): accessibility (axe in e2e), responsive and performance passes, the 14 journeys
   of §26 in Playwright, docs.
7. **Deployment** (runbook ready — needs the owner's Vercel login and go-ahead for hosted migrations): Vercel preview + production, migration runbook, rollback, verification.

## 8. First safe tasks (Phase 1)

Account deletion, moderation dashboard, follows, collaboration requests and the Redis limiter —
all additive, all requested already, none block the larger decisions.
