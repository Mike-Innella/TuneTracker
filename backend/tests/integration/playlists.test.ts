import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

vi.mock('../../src/storage', () => ({
  removeObjects: vi.fn(async () => {}),
  publicUrl: (p: string | null | undefined) => (p ? `public://${p}` : null),
  signedReadUrls: vi.fn(async (paths: string[]) => new Map(paths.map((p) => [p, `signed://${p}`]))),
  signedDownloadUrl: vi.fn(),
}));

const playlists = await import('../../src/services/playlists');
const tracks = await import('../../src/services/tracks');
const { makeProfile } = await import('./helpers');

async function track(ownerId: string, title: string, publish = true) {
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
  if (publish) await tracks.publishTrack(ownerId, t.id);
  return t;
}
const titles = async (viewer: string | null, id: string) =>
  (await playlists.getPlaylist(viewer, id)).tracks.map((t) => t.title);

describe('playlists and collections', () => {
  it('adds, orders, moves and removes tracks; positions stay dense', async () => {
    const me = await makeProfile('curator');
    const artist = await makeProfile('band');
    const [a, b, c] = [await track(artist.id, 'A'), await track(artist.id, 'B'), await track(artist.id, 'C')];
    const p = await playlists.createPlaylist(me.id, { title: 'Late night' });
    for (const t of [a, b, c]) await playlists.addTrack(me.id, p.id, t.id);
    await playlists.addTrack(me.id, p.id, a.id); // idempotent
    expect(await titles(null, p.id)).toEqual(['A', 'B', 'C']);

    await playlists.moveTrack(me.id, p.id, c.id, 'up');
    expect(await titles(null, p.id)).toEqual(['A', 'C', 'B']);
    await playlists.moveTrack(me.id, p.id, a.id, 'up'); // already first: no-op
    expect(await titles(null, p.id)).toEqual(['A', 'C', 'B']);

    await playlists.removeTrack(me.id, p.id, a.id);
    const positions = (
      await db().playlistItem.findMany({ where: { playlistId: p.id }, orderBy: { position: 'asc' } })
    ).map((i) => i.position);
    expect(positions).toEqual([0, 1]);
  });

  it('concurrent adds get distinct positions', async () => {
    const me = await makeProfile('racer');
    const ts = await Promise.all(['1', '2', '3', '4', '5'].map((n) => track(me.id, n)));
    const p = await playlists.createPlaylist(me.id, { title: 'Race' });
    await Promise.all(ts.map((t) => playlists.addTrack(me.id, p.id, t.id)));
    const positions = (await db().playlistItem.findMany({ where: { playlistId: p.id } }))
      .map((i) => i.position)
      .sort();
    expect(positions).toEqual([0, 1, 2, 3, 4]);
  });

  it('private playlists and unpublished tracks stay private; only the owner edits', async () => {
    const me = await makeProfile('owner');
    const other = await makeProfile('visitor');
    const pub = await track(me.id, 'Public');
    const draft = await track(me.id, 'Draft', false);
    const p = await playlists.createPlaylist(me.id, { title: 'Mine', visibility: 'PRIVATE' });
    await playlists.addTrack(me.id, p.id, pub.id);
    await playlists.addTrack(me.id, p.id, draft.id); // owners may add their own drafts

    await expect(playlists.getPlaylist(other.id, p.id)).rejects.toMatchObject({ status: 404 });
    await expect(playlists.addTrack(other.id, p.id, pub.id)).rejects.toMatchObject({ status: 404 });
    await playlists.updatePlaylist(me.id, p.id, { title: 'Mine', visibility: 'PUBLIC' });
    expect(await titles(other.id, p.id)).toEqual(['Public']); // the draft is hidden from others
    expect(await titles(me.id, p.id)).toEqual(['Public', 'Draft']);

    // someone else's draft can't be added
    const theirs = await playlists.createPlaylist(other.id, { title: 'Theirs' });
    await expect(playlists.addTrack(other.id, theirs.id, draft.id)).rejects.toMatchObject({ status: 404 });
  });

  it('saved tracks are your liked tracks that are still visible', async () => {
    const me = await makeProfile('fan');
    const artist = await makeProfile('act');
    const t = await track(artist.id, 'Keeper');
    await tracks.setLike(me.id, t.id, true);
    expect((await playlists.savedTracks(me.id)).map((x) => x.title)).toEqual(['Keeper']);
    await tracks.unpublishTrack(artist.id, t.id);
    expect(await playlists.savedTracks(me.id)).toEqual([]);
  });
});
