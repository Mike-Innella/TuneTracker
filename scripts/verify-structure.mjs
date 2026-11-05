#!/usr/bin/env node
// Asserts the repository layout and documentation the TuneTracker 2.0 directive requires.
import { existsSync, readFileSync } from 'node:fs';

const required = [
  'client/src/app/(marketing)/page.tsx',
  'client/src/app/(marketing)/about/page.tsx',
  'client/src/app/(auth)/login/page.tsx',
  'client/src/app/(auth)/signup/page.tsx',
  'client/src/app/(auth)/forgot-password/page.tsx',
  'client/src/app/(auth)/auth/confirm/route.ts',
  'client/src/app/(application)/dashboard/page.tsx',
  'client/src/app/(application)/projects/page.tsx',
  'client/src/app/(application)/projects/[projectId]/page.tsx',
  'client/src/app/(application)/projects/[projectId]/board/page.tsx',
  'client/src/app/(application)/community/page.tsx',
  'client/src/app/(application)/community/new/page.tsx',
  'client/src/app/(application)/community/[postId]/page.tsx',
  'client/src/app/(application)/profile/page.tsx',
  'client/src/app/(application)/artists/[username]/page.tsx',
  'client/src/app/(application)/settings/page.tsx',
  'client/src/app/api/health/route.ts',
  'client/src/app/layout.tsx',
  'client/src/app/globals.css',
  'client/public/branding/logo-mark.svg',
  'client/next.config.ts',
  'client/package.json',
  'client/tsconfig.json',
  'server/src/index.ts',
  'server/package.json',
  'server/tsconfig.json',
  'data/prisma/schema.prisma',
  'data/prisma/seed.ts',
  'data/supabase/config.toml',
  'data/src/db.ts',
  'data/package.json',
  'shared/src/index.ts',
  'shared/package.json',
  'docker/client.Dockerfile',
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
for (const w of ['client', 'server', 'data', 'shared']) if (!ws.includes(w)) missing.push(`workspace:${w}`);
const lockfiles = ['client', 'server', 'data', 'shared'].filter((w) => existsSync(`${w}/package-lock.json`));
if (lockfiles.length) missing.push(`nested lockfiles: ${lockfiles.join(', ')}`);
for (const f of ['server/src/index.ts', 'data/src/db.ts']) {
  if (!readFileSync(f, 'utf8').includes("import 'server-only'")) missing.push(`server-only guard in ${f}`);
}
if (missing.length) {
  console.error('MISSING:\n' + missing.join('\n'));
  process.exit(1);
}
console.log(`${required.length} paths present, 4 workspaces, single lockfile, server-only guards`);
console.log('STRUCTURE_OK');
