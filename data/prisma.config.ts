import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Local dev reads the root .env; CI/Vercel/Docker provide real environment variables.
if (existsSync('../.env')) process.loadEnvFile('../.env');

// Migrations use the direct (non-pooled) connection; the app uses DATABASE_URL.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  ...(url ? { datasource: { url } } : {}),
});
