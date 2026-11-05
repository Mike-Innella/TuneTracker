# syntax=docker/dockerfile:1.7
# TuneTracker 2.0 — one image definition for local dev (target: dev) and a portable
# production server (target: runner). Vercel does NOT use this image; it builds Next.js natively.

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ---- deps: workspace manifests + Prisma schema so `npm ci` can run prisma generate
FROM base AS deps
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
COPY data/package.json data/prisma.config.ts data/
COPY data/prisma data/prisma
COPY shared/package.json shared/
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- dev: hot reload; source is bind-mounted by compose.dev.yaml
FROM deps AS dev
COPY . .
# pre-create so the anonymous .next volume inherits node ownership
RUN mkdir -p /app/client/.next && chown -R node:node /app
USER node
EXPOSE 3000
WORKDIR /app/client
CMD ["npx", "next", "dev", "--hostname", "0.0.0.0"]

# ---- builder: production Next.js build (standalone output)
FROM deps AS builder
COPY . .
# Public values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build

# ---- runner: minimal, non-root
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/client/.next/standalone ./
COPY --from=builder --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=node:node /app/client/public ./client/public
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "client/server.js"]
