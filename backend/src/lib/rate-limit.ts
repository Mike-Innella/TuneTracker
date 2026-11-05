import { db } from '@tunetracker/data';
import { AppError } from './errors';

/**
 * Fixed-window limiter stored in Postgres so it holds across serverless instances.
 * One upsert per call; the row resets when its window expires.
 */
/** Operators may raise limits (e.g. e2e on one IP); it can never disable them. */
const scale = () => Math.max(1, Number(process.env.RATE_LIMIT_SCALE) || 1);

export async function rateLimit(key: string, baseLimit: number, windowSec: number) {
  const limit = baseLimit * scale();
  const rows = await db().$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSec})
                     THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSec})
                     THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  if ((rows[0]?.count ?? 0) > limit) {
    throw new AppError(429, 'You are doing that too often. Please wait a moment.');
  }
}
