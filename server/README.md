# TuneTracker Server

Express 5 + TypeScript API backed by Prisma and MySQL. This service handles auth/session cookies, project and track workflows, social feed endpoints, and audio storage routing for local disk or S3.

## Backend scope

- Cookie auth: register, login, logout, current-user, profile update/delete, public profile lookup
- Project APIs: private CRUD + public project listing/detail
- Track APIs: CRUD, audio upload/remove, session logs, notes
- Public track engagement: likes, ratings, and comments
- Feed APIs: posts, comments, and likes
- Health checks: API and DB

## Stack

- Node.js 20+
- Express 5
- TypeScript
- Prisma ORM
- MySQL 8+
- Zod validation
- AWS SDK v3 (S3 client + signed URL presigner)
- Jest + Supertest

## Environment variables

For local development, copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma runtime connection string |
| `MIGRATE_DATABASE_URL` | No | Optional migration connection override |
| `JWT_SECRET` | Yes | JWT signing secret for `tt_session` |
| `CLIENT_ORIGIN` | No | Comma-separated CORS allowlist (`http://localhost:5173` default) |
| `PORT` | No | API port (`4000` default) |
| `SESSION_COOKIE_SECURE` | No | Secure-cookie flag (defaults by `NODE_ENV`) |
| `STORAGE_DRIVER` | No | `local` or `s3` (`local` default) |
| `UPLOADS_DIR` | No | Local upload root when using `local` storage |
| `AWS_REGION` | Yes when `STORAGE_DRIVER=s3` | S3 region |
| `AWS_S3_BUCKET` | Yes when `STORAGE_DRIVER=s3` | S3 bucket name |
| `AWS_S3_ENDPOINT` | No | Custom S3-compatible endpoint |
| `AWS_S3_PUBLIC_BASE_URL` | No | Public base URL for object resolution |
| `AWS_S3_KEY_PREFIX` | No | Prefix for uploaded object keys |
| `AWS_S3_SIGNED_URL_TTL_SECONDS` | No | Signed URL TTL for `/api/uploads/*` redirects (`300` default) |
| `AWS_S3_FORCE_PATH_STYLE` | No | Path-style addressing toggle (`false` default) |
| `RUN_DB_TESTS` | No | Enables DB-backed test suite when set to `1` |

## Production env (App Runner + RDS + S3)

- Use local `./.env.production` for production-style configuration and keep it untracked.
- Source sensitive values from AWS Secrets Manager (do not commit them):
  - `DATABASE_URL`
  - `MIGRATE_DATABASE_URL`
  - `JWT_SECRET`
- Set:
  - `STORAGE_DRIVER=s3`
  - `AWS_REGION=us-east-1`
  - `AWS_S3_BUCKET=tunetracker-audio`
- Do not set `PORT` manually in App Runner.
- Apply production migrations with:
  - `npx prisma migrate deploy`
- Prisma/MySQL connection URL format:
  - `mysql://USER:PASSWORD@HOST:3306/DBNAME`
- App Runner instance role should allow:
  - AWS Secrets Manager read access for app secrets
  - S3 access to the audio bucket (`GetObject`, `PutObject`, `DeleteObject`)

## Local setup

From `tunetracker/server`:

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npm run dev
```

Health checks:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/db
```

## Scripts

- `npm run dev` run Prisma generate + no-JS guard + API watcher
- `npm run build` run no-JS guard + typecheck + TS build to `dist/`
- `npm run start` start compiled server
- `npm test` run standard Jest suite
- `npm run test:db` run DB-backed tests
- `npm run test:watch` run Jest watch mode
- `npm run test:ci` run tests with coverage
- `npm run prisma:generate` regenerate Prisma client
- `npm run prisma:migrate:dev` create/apply local migrations
- `npm run prisma:migrate:deploy` apply committed migrations

## API summary

Base path: `/api`

- Health
  - `GET /health`
  - `GET /health/db`
  - `GET /ping`
- Auth
  - `GET /auth/ping`
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET|PATCH|POST|DELETE /auth/me` (`POST /auth/me` is legacy alias of patch behavior)
  - `GET /auth/public/:userId`
- Projects
  - `GET /projects/public`
  - `GET /projects/public/:projectId`
  - `GET|POST /projects`
  - `GET|PATCH|DELETE /projects/:projectId`
- Tracks
  - `GET|POST /projects/:projectId/tracks`
  - `GET|PATCH|DELETE /projects/:projectId/tracks/:trackId`
  - `PUT|DELETE /projects/:projectId/tracks/:trackId/audio`
  - `GET|POST /projects/:projectId/tracks/:trackId/session-logs`
  - `GET|POST /projects/:projectId/tracks/:trackId/notes`
- Public track engagement
  - Preferred: `/projects/public/:projectId/tracks/:trackId/{engagement|comments|like|rating}`
  - Compatibility aliases: `/projects/:projectId/tracks/:trackId/{engagement|comments|like|rating}`
- Posts
  - `GET|POST /posts`
  - `GET|DELETE /posts/:postId`
  - `GET|POST /posts/:postId/comments`
  - `DELETE /posts/:postId/comments/:commentId`
  - `POST|DELETE /posts/:postId/like`

Canonical API contract: [`../docs/openapi.yaml`](../docs/openapi.yaml)

## Storage behavior

- `STORAGE_DRIVER=local`
  - audio files are written under `UPLOADS_DIR`
  - `/api/uploads/*` serves static files from disk
- `STORAGE_DRIVER=s3`
  - audio files are written to `AWS_S3_BUCKET`
  - `/api/uploads/*` resolves object access via signed redirect (`AWS_S3_SIGNED_URL_TTL_SECONDS`)
  - when `AWS_S3_PUBLIC_BASE_URL` is set, `audioUrl` resolves against that public base

## Repository layout

```text
server/
├── prisma/
├── src/
│   ├── __tests__/
│   ├── auth/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── index.ts
└── README.md
```

## Testing

From `tunetracker/server`:

```bash
npm test
```

For DB-backed suites:

```bash
npm run test:db
```
