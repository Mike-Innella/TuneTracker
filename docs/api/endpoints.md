# Server entrypoints

TuneTracker has no public REST API. The browser talks to Next.js through **Server Actions** (typed,
CSRF-protected by Next) and a few **Route Handlers**. Every entrypoint verifies the Supabase session
server-side and delegates to `@tunetracker/backend`, which enforces authorization.

## Route handlers

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | none | Liveness probe (`{ ok: true }`) for Docker/CI; touches no external service |
| `GET /auth/confirm?token_hash&type&next` | none (token) | Verifies email-confirmation / recovery links, sets the session, redirects to a same-origin `next` |

## Server Actions (`frontend/src/features/*/actions.ts`)

| Module | Actions | Required role |
|---|---|---|
| auth | signUp, signIn, signOut, forgotPassword, resetPassword | — (rate limited per IP) |
| projects | createProject, updateProject, archiveProject, deleteProject | owner (visibility/artwork/archive/delete), editor (details) |
| projects (team) | inviteMember, changeRole, removeMember | owner; members may remove themselves |
| board | add/rename/move/deleteColumn, create/update/move/archive/deleteTask, getTask, checklist add/toggle/delete, createLabel, deleteAttachment | editor (viewer: read + comment) |
| board (discussion) | addTaskComment, deleteTaskComment | viewer+; delete: author or owner |
| media | requestUpload, completeUpload, deleteMedia | owner of the asset (task attachments: project editor) |
| community | createPost, updatePost, deletePost, addComment, deleteComment, toggleReaction, report | signed in; edit/delete: author |
| profile | updateProfile, setAvatar, setTheme, changePassword | self |
| notifications | markNotificationsRead | self |

All inputs are validated with the Zod schemas in `packages/shared/src/schemas`. Results are
`{ ok: true, data } | { ok: false, error, fieldErrors? }`.

## Upload protocol

1. `requestUpload({ kind, fileName, mimeType, sizeBytes, visibility, projectId?, taskId? })` →
   `{ assetId, bucket, path, token }` after type/size/quota/permission checks.
2. Browser: `PUT {SUPABASE_URL}/storage/v1/object/upload/sign/{bucket}/{path}?token=…` (multipart).
3. `completeUpload({ assetId, durationSec? })` → server checks the stored object's size and type,
   deletes it if invalid, otherwise marks the asset verified and returns a URL.

Limits: audio 50 MB, images 5 MB, other files 25 MB, 1 GB per user, 60 upload requests/hour.

## Phase 1 additions

| Module | Actions | Who |
|---|---|---|
| follows | setFollowAction(username, follow) | signed in; cannot follow yourself; idempotent |
| projects (team) | inviteMemberAction(target = @username or email), revokeInviteAction, respondToInviteAction(accept) | owner invites/revokes; only the invitee answers |
| account | deleteAccountAction(confirmUsername) | self; typed username required |
| moderation | resolveReportAction(DISMISSED \| CONTENT_REMOVED \| USER_SUSPENDED), unsuspendAction | profiles with role MODERATOR or ADMIN (others get 404) |

Route handler: `GET /auth/signout?reason=suspended` ends the session and explains why.

Moderators are appointed from the CLI only: `npm run set-role -w @tunetracker/data -- <username> MODERATOR`.

### Resumable uploads

Files over 6 MB use TUS against `POST {SUPABASE_URL}/storage/v1/upload/resumable/sign` with the same
single-use signed upload token (`x-signature` header) in 6 MB chunks; dropped chunks retry and the upload
resumes from the server offset. Smaller files use one signed PUT. Resume is within the page session.

## Phase 2 — music core

| Action | Who |
|---|---|
| createTrackDraftAction(audioId, kind) | signed in; verified own audio upload → private draft |
| updateTrackAction(id, details/release) | owner; downloads require usage rights (samples only) |
| publishTrackAction(id) | owner; idempotent; needs verified audio |
| deleteTrackAction(id) | owner; deletes files no other track or post uses |
| setTrackLikeAction(id, like) | signed in; track must be visible to them |
| recordPlayAction(id) | anyone; sent by the global player after 10 s (or half a short track); counted once per listener / anonymous visitor (`tt-visitor` httpOnly cookie) per 30 min; owners and drafts never count; no IP stored |
| sampleDownloadAction(id) | anyone; published, downloadable sample with rights; 5-minute signed URL; 20/h per listener |

Public pages (no account): `/tracks/[id]`, `/artists/[username]`. Studio (signed in): `/studio`,
`/studio/upload` (3-step wizard: upload → details → release), `/studio/tracks/[id]`.
One app-wide `<audio>` (PlayerProvider in the root layout) drives every embedded player and the docked
mini player, so playback and the queue survive navigation; Media Session gives lock-screen controls.

## Phase 3 — navigation, Home and Discover

- Rail: **Listen** (Home `/home`, Discover `/discover`, Community) and **Make** (Studio, Projects,
  Profile); mobile tab bar: Home, Discover, Community, Studio, Profile. Blog joins in Phase 4.
- `/home` (public): new releases, trending (most played, published in the last 30 days), fresh samples;
  signed in, also tracks from artists you follow and recent community posts. Signed-in visits to `/`
  go to `/home`; login and email confirmation land there.
- `/discover` (public, GET form): `q` (title or artist), `type` (tracks | samples), `genre`,
  `sort` (recent | trending), `cursor` (forward pagination, 24 per page). Matching public artists show
  above the results. Header search submits here.
- `/studio` is the former dashboard plus your tracks; `/dashboard` redirects to it.

