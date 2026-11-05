#!/usr/bin/env node
// Asserts the repository layout and documentation the TuneTracker 2.0 directive requires.
import { existsSync, readFileSync } from 'node:fs';

const required = [
  'frontend/src/app/(marketing)/page.tsx',
  'frontend/src/app/(marketing)/about/page.tsx',
  'frontend/src/app/(auth)/login/page.tsx',
  'frontend/src/app/(auth)/signup/page.tsx',
  'frontend/src/app/(auth)/forgot-password/page.tsx',
  'frontend/src/app/(auth)/auth/confirm/route.ts',
  'frontend/src/app/(application)/dashboard/page.tsx',
  'frontend/src/app/(application)/projects/page.tsx',
  'frontend/src/app/(application)/projects/[projectId]/page.tsx',
  'frontend/src/app/(application)/projects/[projectId]/board/page.tsx',
  'frontend/src/app/(application)/community/(feed)/page.tsx',
  'frontend/src/app/(application)/community/new/page.tsx',
  'frontend/src/app/(application)/community/[postId]/page.tsx',
  'frontend/src/app/(application)/profile/page.tsx',
  'frontend/src/app/(application)/artists/[username]/page.tsx',
  'frontend/src/app/(application)/settings/page.tsx',
  'frontend/src/app/api/health/route.ts',
  'frontend/src/app/layout.tsx',
  'frontend/src/app/globals.css',
  'frontend/public/branding/logo-mark.svg',
  'frontend/next.config.ts',
  'frontend/package.json',
  'frontend/tsconfig.json',
  'backend/src/index.ts',
  'backend/package.json',
  'backend/tsconfig.json',
  'data/prisma/schema.prisma',
  'data/prisma/seed.ts',
  'data/supabase/config.toml',
  'data/src/db.ts',
  'data/package.json',
  'packages/shared/src/index.ts',
  'packages/shared/package.json',
  'infrastructure/docker/frontend.Dockerfile',
  'tests/e2e',
  '.github/workflows/ci.yml',
  '.github/workflows/security.yml',
  '.github/workflows/release.yml',
  '.github/pull_request_template.md',
  'compose.yaml',
  'compose.dev.yaml',
  '.dockerignore',
  '.gitignore',
  '.env.example',
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE',
  'docs/architecture/legacy-audit.md',
  'docs/architecture/system-overview.md',
  'docs/architecture/database.md',
  'docs/api/endpoints.md',
  'docs/development/local-setup.md',
  'docs/development/docker.md',
  'docs/development/contributing.md',
  'docs/deployment/vercel.md',
  'docs/deployment/supabase.md',
  'docs/security/security-model.md',
];
const missing = required.filter((p) => !existsSync(p));
const ws = JSON.parse(readFileSync('package.json', 'utf8')).workspaces;
for (const w of ['frontend', 'backend', 'data', 'packages/shared'])
  if (!ws.includes(w)) missing.push(`workspace:${w}`);
const lockfiles = ['frontend', 'backend', 'data', 'packages/shared'].filter((w) =>
  existsSync(`${w}/package-lock.json`),
);
if (lockfiles.length) missing.push(`nested lockfiles: ${lockfiles.join(', ')}`);
for (const f of ['backend/src/index.ts', 'data/src/db.ts']) {
  if (!readFileSync(f, 'utf8').includes("import 'server-only'")) missing.push(`server-only guard in ${f}`);
}
if (missing.length) {
  console.error('MISSING:\n' + missing.join('\n'));
  process.exit(1);
}
console.log(`${required.length} paths present, 4 workspaces, single lockfile, server-only guards`);
console.log('STRUCTURE_OK');
