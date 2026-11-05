import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
// globalSetup runs in another process; re-derive the test DB URL the same way.
const base = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL!);
base.pathname = `/${base.pathname.slice(1).replace(/_test$/, '')}_test`;
process.env.DATABASE_URL = base.toString();
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service';
