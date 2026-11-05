import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export * from './generated/prisma/client';

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  // Serverless: keep each instance's pool tiny; Supabase's pooler (port 6543) multiplexes.
  const adapter = new PrismaPg({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 3) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Lazily created so importing this module never needs a DB (e.g. during `next build`). */
export function db(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}
