# Server entrypoints

TuneTracker has no public REST API. The browser talks to Next.js through **Server Actions** (typed,
CSRF-protected by Next) and a few **Route Handlers**. Every entrypoint verifies the Supabase session
server-side and delegates to `@tunetracker/server`, which enforces authorization.

## Route handlers

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | none | Liveness probe (`{ ok: true }`) for Docker/CI; touches no external service |
| `GET /auth/confirm?token_hash&type&next` | none (token) | Verifies email-confirmation / recovery links, sets the session, redirects to a same-origin `next` |

## Server Actions (`client/src/features/*/actions.ts`)

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

All inputs are validated with the Zod schemas in `shared/src/schemas`. Results are
`{ ok: true, data } | { ok: false, error, fieldErrors? }`.

## Upload protocol

1. `requestUpload({ kind, fileName, mimeType, sizeBytes, visibility, projectId?, taskId? })` →
   `{ assetId, bucket, path, token }` after type/size/quota/permission checks.
2. Browser: `PUT {SUPABASE_URL}/storage/v1/object/upload/sign/{bucket}/{path}?token=…` (multipart).
3. `completeUpload({ assetId, durationSec? })` → server checks the stored object's size and type,
   deletes it if invalid, otherwise marks the asset verified and returns a URL.

Limits: audio 50 MB, images 5 MB, other files 25 MB, 1 GB per user, 60 upload requests/hour.
