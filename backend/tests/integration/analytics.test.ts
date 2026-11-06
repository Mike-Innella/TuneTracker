import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

vi.mock('../../src/storage', () => ({
  removeObjects: vi.fn(async () => {}),
  publicUrl: (p: string | null | undefined) => (p ? `public://${p}` : null),
  signedReadUrls: vi.fn(async () => new Map()),
  signedDownloadUrl: vi.fn(),
}));

const analytics = await import('../../src/services/analytics');
const dashboard = await import('../../src/services/dashboard');
const tracks = await import('../../src/services/tracks');
const playlists = await import('../../src/services/playlists');
const { makeProfile } = await import('./helpers');

const DAY = 86_400_000;
const today = () => {
  const n = new Date();
  return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
};

async function published(ownerId: string, title: string) {
  const a = await db().mediaAsset.create({
    data: {
      ownerId,
      kind: 'AUDIO',
      bucket: 'media',
      path: `${ownerId}/${Math.random()}.wav`,
      mimeType: 'audio/wav',
      sizeBytes: 9,
      verifiedAt: new Date(),
    },
  });
  const t = await tracks.createDraft(ownerId, { audioId: a.id });
  await tracks.updateTrack(ownerId, t.id, { title });
  return tracks.publishTrack(ownerId, t.id);
}

describe('creator analytics', () => {
  it('buckets plays by UTC day, compares with the previous window and ranks tracks', async () => {
    const me = await makeProfile('analyst');
    const fan = await makeProfile('listener');
    const other = await makeProfile('elsewhere');
    const hit = await published(me.id, 'Hit');
    const deep = await published(me.id, 'Deep cut');
    const notMine = await published(other.id, 'Not mine');
    const at = (daysAgo: number, hour = 12) => new Date(today() - daysAgo * DAY + hour * 3_600_000);
    await db().play.createMany({
      data: [
        { trackId: hit.id, listenerId: fan.id, createdAt: at(0) },
        { trackId: hit.id, listenerId: null, createdAt: at(0, 1) },
        { trackId: hit.id, listenerId: fan.id, createdAt: at(2) },
        { trackId: deep.id, listenerId: fan.id, createdAt: at(6) },
        { trackId: deep.id, listenerId: null, createdAt: at(8) }, // previous 7-day window
        { trackId: notMine.id, listenerId: fan.id, createdAt: at(0) }, // someone else's track
      ],
    });
    await tracks.setLike(fan.id, hit.id, true);
    const list = await playlists.createPlaylist(fan.id, { title: 'Fan list' });
    await playlists.addTrack(fan.id, list.id, hit.id);
    const own = await playlists.createPlaylist(me.id, { title: 'My own' });
    await playlists.addTrack(me.id, own.id, hit.id); // own adds don't count

    const o = await analytics.overview(me.id, 7);
    expect(o.series).toHaveLength(7);
    expect(o.series.at(-1)).toEqual({ day: new Date(today()).toISOString().slice(0, 10), plays: 2 });
    expect(o.series.at(-3)!.plays).toBe(1);
    expect(o.series[0]!.plays).toBe(1); // 6 days ago is the window's first day
    expect(o.plays).toBe(4);
    expect(o.previousPlays).toBe(1);
    expect(o.change).toBe(3);
    expect(o.listeners).toBe(1);
    expect(o.anonymousPlays).toBe(1);
    expect(o.likes).toBe(1);
    expect(o.playlistAdds).toBe(1);
    expect(o.topTracks).toEqual([
      { id: hit.id, title: 'Hit', plays: 3 },
      { id: deep.id, title: 'Deep cut', plays: 1 },
    ]);

    const empty = await analytics.overview((await makeProfile('newbie')).id, 30);
    expect(empty.plays).toBe(0);
    expect(empty.change).toBeNull();
    expect(empty.series.every((d) => d.plays === 0)).toBe(true);
  });

  it('activation steps complete from real activity', async () => {
    const me = await makeProfile('starter');
    expect((await dashboard.activation(me.id)).completed).toBe(0);
    await published(me.id, 'First');
    await db().profile.update({ where: { id: me.id }, data: { bio: 'Producer from Leeds' } });
    const a = await dashboard.activation(me.id);
    expect(a.steps.filter((s) => s.done).map((s) => s.key)).toEqual(['profile', 'upload', 'publish']);
  });
});
