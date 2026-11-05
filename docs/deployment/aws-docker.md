# TuneTracker AWS + Docker deployment

This deployment path runs TuneTracker as two containers (`tunetracker-api` and `tunetracker-web`) on an EC2 host, with:

- MySQL on AWS RDS
- audio uploads in S3 (`STORAGE_DRIVER=s3`)
- Docker images pulled from Docker Hub

## 1. Prepare GitHub and Docker Hub

Add these repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

The workflow at `.github/workflows/tunetracker-docker.yml` will:

- verify server and client builds on PR/push
- publish both images on push to configured branches

## 2. Prepare AWS resources

Create or confirm:

- an EC2 instance for containers
- an RDS MySQL database
- an S3 bucket for track audio
- an IAM role attached to EC2 with S3 permissions on the bucket:
  - `s3:GetObject`
  - `s3:PutObject`
  - `s3:DeleteObject`

If you do not use an instance role, provide AWS credentials as environment variables by your host secret manager.

## 3. Configure deploy env

On the EC2 host, copy files from `tunetracker/`:

- `docker-compose.deploy.yml`
- `deploy.env.example` as `.env`

Set required values in `.env`:

- Docker: `DOCKERHUB_USERNAME`, `APP_IMAGE_TAG`
- API security/origin: `JWT_SECRET`, `CLIENT_ORIGIN`, `SESSION_COOKIE_SECURE=true`
- DB: `DATABASE_URL`, `MIGRATE_DATABASE_URL`
- Storage: `STORAGE_DRIVER=s3`, `AWS_REGION`, `AWS_S3_BUCKET`

Optional S3 settings:

- `AWS_S3_PUBLIC_BASE_URL` for direct public URLs (for example CloudFront)
- `AWS_S3_ENDPOINT` for S3-compatible storage providers
- `AWS_S3_KEY_PREFIX` to namespace uploaded objects
- `AWS_S3_SIGNED_URL_TTL_SECONDS` for `/api/uploads/*` redirect lifetime
- `AWS_S3_FORCE_PATH_STYLE=true` for MinIO/LocalStack-style path addressing

## 4. Deploy

From `tunetracker/` on the EC2 host:

```bash
cp deploy.env.example .env
# edit .env first
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
```

The API container runs Prisma deploy migrations at startup:

```bash
npx prisma migrate deploy
```

## 5. Verify

Run these checks on-host:

```bash
docker compose -f docker-compose.deploy.yml ps
curl http://127.0.0.1/api/health
curl http://127.0.0.1/api/health/db
```

Application checks:

- register/login succeeds
- create/update/delete track audio works
- audio URLs under `/api/uploads/...` resolve correctly:
  - local driver: served by API static files
  - s3 driver: 302 redirect to signed S3 URL, or public base URL if configured

## 6. Production hardening checklist

1. Put the web container behind HTTPS (ALB, CloudFront, or reverse proxy).
2. Set `CLIENT_ORIGIN` to the exact production frontend origin.
3. Use immutable image tags for `APP_IMAGE_TAG` instead of `latest`.
4. Limit SG/network access for EC2, RDS, and S3.
5. Rotate `JWT_SECRET` and use managed secret storage.
