import { afterAll, describe, expect, it } from 'vitest';
import { closeRateLimitRedis, rateLimit } from '../../src/lib/rate-limit';

// TEST_REDIS_URL comes from CI's redis service or the compose `redis` service locally.
const REDIS = process.env.TEST_REDIS_URL ?? process.env.REDIS_URL;
delete process.env.RATE_LIMIT_SCALE; // .env raises limits for e2e; test the real ones
const key = (k: string) => `test:${k}:${Date.now()}:${Math.random()}`;

afterAll(async () => {
  await closeRateLimitRedis();
  delete process.env.REDIS_URL;
});

describe('rate limiting', () => {
  it('Postgres limiter blocks past the limit when Redis is not configured', async () => {
    delete process.env.REDIS_URL;
    const k = key('pg');
    await rateLimit(k, 2, 60);
    await rateLimit(k, 2, 60);
    await expect(rateLimit(k, 2, 60)).rejects.toMatchObject({ status: 429 });
  });

  it.skipIf(!REDIS)('Redis limiter blocks past the limit and expires the window', async () => {
    process.env.REDIS_URL = REDIS!;
    const k = key('redis');
    await rateLimit(k, 1, 1);
    await expect(rateLimit(k, 1, 1)).rejects.toMatchObject({ status: 429 });
    await new Promise((r) => setTimeout(r, 1200));
    await expect(rateLimit(k, 1, 1)).resolves.toBeUndefined();
  });

  it('falls back to Postgres when Redis is unreachable instead of letting requests through', async () => {
    await closeRateLimitRedis();
    process.env.REDIS_URL = 'redis://127.0.0.1:1'; // nothing listens here
    const k = key('down');
    await rateLimit(k, 1, 60);
    await expect(rateLimit(k, 1, 60)).rejects.toMatchObject({ status: 429 });
    await closeRateLimitRedis();
  });
});
