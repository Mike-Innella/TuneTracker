import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import pg from 'pg';

/** Creates an isolated `<db>_test` database and applies every Prisma migration to it. */
export default async function setup() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base)
    throw new Error('Integration tests need DATABASE_URL (Postgres). Run `docker compose up -d db`.');
  const url = new URL(base);
  const name = url.pathname.slice(1).replace(/_test$/, '') + '_test';
  const admin = new pg.Client({ connectionString: base });
  await admin.connect();
  const exists = await admin.query('select 1 from pg_database where datname = $1', [name]);
  if (exists.rowCount === 0) await admin.query(`create database "${name}"`);
  await admin.end();
  url.pathname = `/${name}`;
  process.env.TEST_DB_URL = url.toString();
  execSync('npx prisma migrate deploy', {
    cwd: 'data',
    env: { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString() },
    stdio: 'pipe',
  });
  return () => {};
}
