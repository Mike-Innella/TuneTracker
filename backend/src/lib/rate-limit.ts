import { createClient } from 'redis';
import { db } from '@tunetracker/data';
import { AppError } from './errors';

/** Operators may raise limits (e.g. e2e on one IP); it can never disable them. */
const scale = () => Math.max(1, Number(process.env.RATE_LIMIT_SCALE) || 1);

// Fail fast when Redis is down: a few quick retries, then give up (callers fall back to Postgres);
// no offline queue, so commands error instead of waiting for a connection that may never come.
const connect = (url: string) =>
  createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 1500,
      reconnectStrategy: (retries) => (retries >= 3 ? new Error('redis unavailable') : 100 * (retries + 1)),
    },
  })
    .on('error', (e: Error) => console.error('[rate-limit] redis error', e.message))
    .connect();
type Redis = Awaited<ReturnType<typeof connect>>;
const globalForRedis = globalThis as unknown as { ttRedis?: Promise<Redis> | null };

/** One connection per server instance, reused across requests (serverless-friendly). */
function redis(): Promise<Redis> | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  globalForRedis.ttRedis ??= connect(url);
  return globalForRedis.ttRedis;
}

/** Fixed window in Redis: INCR, and set the expiry only when the window opens. */
async function countRedis(client: Redis, key: string, windowSec: number) {
  const replies = await client.multi().incr(`rl:${key}`).expire(`rl:${key}`, windowSec, 'NX').exec();
  return Number(replies[0]);
}

/** Same fixed window in Postgres: one upsert, the row resets when its window expires. */
async function countPostgres(key: string, windowSec: number) {
  const rows = await db().$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSec})
                     THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSec})
                     THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  return rows[0]?.count ?? 0;
}

/**
 * Shared across every serverless instance: Redis when REDIS_URL is set (Upstash on Vercel,
 * the compose `redis` service locally), otherwise Postgres. A Redis failure falls back to
 * Postgres rather than letting requests through unlimited.
 */
export async function rateLimit(key: string, baseLimit: number, windowSec: number) {
  const limit = baseLimit * scale();
  if ((await count(key, windowSec)) > limit) {
    throw new AppError(429, 'You are doing that too often. Please wait a moment.');
  }
}

/** True only for the first call with this key inside the window (play de-duplication). */
export async function firstInWindow(key: string, windowSec: number) {
  return (await count(`once:${key}`, windowSec)) === 1;
}

async function count(key: string, windowSec: number): Promise<number> {
  let count: number;
  const client = redis();
  try {
    count = client ? await countRedis(await client, key, windowSec) : await countPostgres(key, windowSec);
  } catch (e) {
    if (!client) throw e;
    console.error('[rate-limit] falling back to Postgres:', (e as Error).message);
    // drop the broken client; a later call reconnects
    (await globalForRedis.ttRedis?.catch(() => null))?.destroy();
    globalForRedis.ttRedis = undefined;
    count = await countPostgres(key, windowSec);
  }
  return count;
}

/** Test/shutdown helper. */
export async function closeRateLimitRedis() {
  const c = await globalForRedis.ttRedis?.catch(() => null);
  globalForRedis.ttRedis = undefined;
  c?.destroy();
}
