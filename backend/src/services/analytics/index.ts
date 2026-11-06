import { db } from '@tunetracker/data';

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];
const DAY = 86_400_000;

/** UTC calendar day key, e.g. 2026-11-05 */
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Creator analytics from real listens only (the Play table — de-duplicated per listener per 30
 * minutes, owners never counted). Days are UTC calendar days; days without plays are zero.
 */
export async function overview(ownerId: string, days: Range = 30) {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (days - 1) * DAY,
  );
  const prevStart = new Date(start.getTime() - days * DAY);

  const [perDay, totals, prev, top, likes, playlistAdds] = await Promise.all([
    db().$queryRaw<{ day: Date; plays: bigint }[]>`
      SELECT date_trunc('day', p."createdAt" AT TIME ZONE 'UTC') AS day, count(*) AS plays
      FROM "Play" p JOIN "Track" t ON t.id = p."trackId"
      WHERE t."ownerId" = ${ownerId}::uuid AND p."createdAt" >= ${start}
      GROUP BY 1`,
    db().$queryRaw<{ plays: bigint; listeners: bigint; anonymous: bigint }[]>`
      SELECT count(*) AS plays,
             count(DISTINCT p."listenerId") AS listeners,
             count(*) FILTER (WHERE p."listenerId" IS NULL) AS anonymous
      FROM "Play" p JOIN "Track" t ON t.id = p."trackId"
      WHERE t."ownerId" = ${ownerId}::uuid AND p."createdAt" >= ${start}`,
    db().$queryRaw<{ plays: bigint }[]>`
      SELECT count(*) AS plays
      FROM "Play" p JOIN "Track" t ON t.id = p."trackId"
      WHERE t."ownerId" = ${ownerId}::uuid AND p."createdAt" >= ${prevStart} AND p."createdAt" < ${start}`,
    db().$queryRaw<{ id: string; title: string; plays: bigint }[]>`
      SELECT t.id, t.title, count(*) AS plays
      FROM "Play" p JOIN "Track" t ON t.id = p."trackId"
      WHERE t."ownerId" = ${ownerId}::uuid AND p."createdAt" >= ${start}
      GROUP BY t.id, t.title ORDER BY plays DESC, t.title ASC LIMIT 5`,
    db().trackLike.count({ where: { track: { ownerId }, createdAt: { gte: start } } }),
    // adds to other people's playlists only
    db().playlistItem.count({
      where: { track: { ownerId }, addedAt: { gte: start }, playlist: { ownerId: { not: ownerId } } },
    }),
  ]);

  const byDay = new Map(perDay.map((r) => [dayKey(new Date(r.day)), Number(r.plays)]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY);
    return { day: dayKey(d), plays: byDay.get(dayKey(d)) ?? 0 };
  });
  const plays = Number(totals[0]?.plays ?? 0);
  const previous = Number(prev[0]?.plays ?? 0);
  return {
    days,
    series,
    plays,
    previousPlays: previous,
    /** null when there is nothing to compare against */
    change: previous > 0 ? (plays - previous) / previous : null,
    listeners: Number(totals[0]?.listeners ?? 0),
    anonymousPlays: Number(totals[0]?.anonymous ?? 0),
    likes,
    playlistAdds,
    topTracks: top.map((t) => ({ id: t.id, title: t.title, plays: Number(t.plays) })),
  };
}
