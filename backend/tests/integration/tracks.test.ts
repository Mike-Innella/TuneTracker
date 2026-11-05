import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

// Storage is exercised in e2e; here we test the publishing, visibility, play and download rules.
const removed: string[] = [];
vi.mock('../../src/storage', () => ({
  removeObjects: vi.fn(async (_b: string, paths: string[]) => void removed.push(...paths)),
  publicUrl: (p: string | null | undefined) => (p ? `public://${p}` : null),
  signedReadUrls: vi.fn(async (paths: string[]) => new Map(paths.map((p) => [p, `signed://${p}`]))),
  signedDownloadUrl: vi.fn(async (p: string, name: string) => `download://${p}?as=${name}`),
}));

const tracks = await import('../../src/services/tracks');
const profiles = await import('../../src/services/profiles');
const follows = await import('../../src/services/follows');
const { makeProfile } = await import('./helpers');

async function audio(ownerId: string, verified = true) {
  return db().mediaAsset.create({
    data: {
      ownerId,
      kind: 'AUDIO',
      bucket: 'media',
      path: `${ownerId}/${Math.random()}.wav`,
      mimeType: 'audio/wav',
      sizeBytes: 1000,
      durationSec: 90,
      title: 'Night drive',
      verifiedAt: verified ? new Date() : null,
    },
  });
}

describe('tracks', () => {
  it('drafts stay private until published; publishing is idempotent', async () => {
    const me = await makeProfile('maker');
    const stranger = await makeProfile('stranger');
    await expect(
      tracks.createDraft(me.id, { audioId: (await audio(me.id, false)).id }),
    ).rejects.toMatchObject({ status: 400 });
    const draft = await tracks.createDraft(me.id, { audioId: (await audio(me.id)).id });
    expect(draft).toMatchObject({ status: 'DRAFT', title: 'Night drive', durationSec: 90 });

    await expect(tracks.getTrack(stranger.id, draft.id)).rejects.toMatchObject({ status: 404 });
    await expect(tracks.getTrack(null, draft.id)).rejects.toMatchObject({ status: 404 });
    await expect(tracks.updateTrack(stranger.id, draft.id, { title: 'x' })).rejects.toMatchObject({
      status: 404,
    });
    expect((await tracks.listTracks(null, { q: me.username })).tracks).toHaveLength(0);

    const [a, b] = await Promise.all([
      tracks.publishTrack(me.id, draft.id),
      tracks.publishTrack(me.id, draft.id),
    ]);
    expect(a.publishedAt?.getTime()).toBe(b.publishedAt?.getTime());
    const pub = await tracks.getTrack(null, draft.id);
    expect(pub).toMatchObject({
      status: 'PUBLISHED',
      audioUrl: expect.stringMatching(/^signed:\/\//),
      isMine: false,
    });
    expect((await tracks.listTracks(null, { q: me.username })).tracks.map((t) => t.id)).toEqual([draft.id]);

    await tracks.updateTrack(me.id, draft.id, { visibility: 'PRIVATE' });
    await expect(tracks.getTrack(null, draft.id)).rejects.toMatchObject({ status: 404 });
    expect((await tracks.getTrack(me.id, draft.id)).isMine).toBe(true);
  });

  it('counts a listen once per listener per window and never counts the owner', async () => {
    const me = await makeProfile('artist');
    const fan = await makeProfile('fan');
    const t = await tracks.createDraft(me.id, { audioId: (await audio(me.id)).id });
    expect(await tracks.recordPlay(t.id, fan.id, null)).toEqual({ counted: false }); // drafts don't count
    await tracks.publishTrack(me.id, t.id);
    expect(await tracks.recordPlay(t.id, fan.id, null)).toEqual({ counted: true });
    expect(await tracks.recordPlay(t.id, fan.id, null)).toEqual({ counted: false });
    expect(await tracks.recordPlay(t.id, me.id, null)).toEqual({ counted: false });
    expect(await tracks.recordPlay(t.id, null, `visitor-${Math.random()}`)).toEqual({ counted: true });
    expect(await tracks.recordPlay(t.id, null, null)).toEqual({ counted: false });
    expect(await db().play.count({ where: { trackId: t.id } })).toBe(2);
  });

  it('samples download only when the creator chose usage rights and enabled downloads', async () => {
    const me = await makeProfile('sampler');
    const t = await tracks.createDraft(me.id, { audioId: (await audio(me.id)).id, kind: 'SAMPLE' });
    await expect(tracks.updateTrack(me.id, t.id, { downloadable: true })).rejects.toMatchObject({
      status: 400,
    });
    await tracks.publishTrack(me.id, t.id);
    await expect(tracks.downloadUrl(null, t.id)).rejects.toMatchObject({ status: 403 });
    await tracks.updateTrack(me.id, t.id, { downloadable: true, usageRights: 'CC_BY', title: 'Kick / 808' });
    expect((await tracks.downloadUrl(null, t.id)).url).toMatch(/as=Kick_808\.wav$/);
    // a track (not a sample) is never downloadable, whatever the flag says
    await tracks.updateTrack(me.id, t.id, { kind: 'TRACK' });
    await expect(tracks.downloadUrl(null, t.id)).rejects.toMatchObject({ status: 403 });
  });

  it('deleting a track removes its file unless something else still uses it', async () => {
    const me = await makeProfile('cleaner');
    const t = await tracks.createDraft(me.id, { audioId: (await audio(me.id)).id });
    const asset = await db().mediaAsset.findUniqueOrThrow({ where: { id: t.audioId! } });
    await tracks.deleteTrack(me.id, t.id);
    expect(removed).toContain(asset.path);
    expect(await db().mediaAsset.findUnique({ where: { id: asset.id } })).toBeNull();
  });

  it('home shows tracks from followed artists only, and artist search skips private profiles', async () => {
    const fan = await makeProfile('listener');
    const followed = await makeProfile('followed');
    const other = await makeProfile('other');
    for (const owner of [followed, other]) {
      const t = await tracks.createDraft(owner.id, { audioId: (await audio(owner.id)).id });
      await tracks.publishTrack(owner.id, t.id);
    }
    await follows.follow(fan.id, followed.username);
    const feed = await tracks.listTracks(fan.id, { limit: 48 }, { followedBy: fan.id });
    expect(new Set(feed.tracks.map((t) => t.owner.username))).toEqual(new Set([followed.username]));

    await db().profile.update({ where: { id: other.id }, data: { isPublic: false } });
    expect((await profiles.searchArtists(followed.username)).map((a) => a.username)).toEqual([
      followed.username,
    ]);
    expect(await profiles.searchArtists(other.username)).toEqual([]);
  });

  it('discover paginates with a cursor: no overlap, no gaps, then the end', async () => {
    const me = await makeProfile('pager');
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const t = await tracks.createDraft(me.id, { audioId: (await audio(me.id)).id });
      await tracks.publishTrack(me.id, t.id);
      ids.push(t.id);
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await tracks.listTracks(null, { q: me.username, limit: 2, cursor });
      seen.push(...page.tracks.map((t) => t.id));
      cursor = page.nextCursor;
      pages++;
    } while (cursor && pages < 10);
    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(5);
    expect(new Set(seen)).toEqual(new Set(ids));
  });
});
