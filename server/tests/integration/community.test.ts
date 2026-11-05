import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

// Storage is exercised for real in e2e; here we test DB rules around it.
vi.mock('../../src/storage', () => ({
  createUploadTicket: vi.fn(async (_b: string, path: string) => ({ path, token: 'tok' })),
  objectInfo: vi.fn(async () => ({ size: 2048, contentType: 'audio/mpeg' })),
  removeObjects: vi.fn(async () => {}),
  signedReadUrl: vi.fn(async (p: string) => `signed://${p}`),
  signedReadUrls: vi.fn(async (ps: string[]) => new Map(ps.map((p) => [p, `signed://${p}`]))),
  publicUrl: (p: string | null) => (p ? `public://${p}` : null),
}));

const community = await import('../../src/services/community');
const media = await import('../../src/services/media');
const projects = await import('../../src/services/projects');
const profiles = await import('../../src/services/profiles');
const { makeProfile } = await import('./helpers');

describe('media metadata', () => {
  it('reserves, verifies and namespaces uploads by owner', async () => {
    const me = await makeProfile('me');
    const t = await media.requestUpload(me.id, {
      kind: 'AUDIO',
      fileName: 'mix v2.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 2048,
    });
    expect(t.path.startsWith(`${me.id}/`)).toBe(true);
    expect(t.bucket).toBe('media');
    const done = await media.completeUpload(me.id, { assetId: t.assetId, durationSec: 12.5 });
    expect(done.verifiedAt).toBeTruthy();
    expect(done.url).toBe(`signed://${t.path}`);
    const other = await makeProfile('other');
    await expect(media.completeUpload(other.id, { assetId: t.assetId })).rejects.toMatchObject({
      status: 404,
    });
    await expect(media.deleteMedia(other.id, t.assetId)).rejects.toMatchObject({ status: 404 });
  });

  it('enforces the per-user quota', async () => {
    const me = await makeProfile('me');
    await db().mediaAsset.create({
      data: {
        ownerId: me.id,
        kind: 'FILE',
        bucket: 'media',
        path: `${me.id}/big`,
        mimeType: 'application/zip',
        sizeBytes: 1024 * 1024 * 1024,
      },
    });
    await expect(
      media.requestUpload(me.id, { kind: 'AUDIO', fileName: 'x.mp3', mimeType: 'audio/mpeg', sizeBytes: 10 }),
    ).rejects.toMatchObject({ status: 413 });
  });
});

describe('community', () => {
  it('posts with audio, paginates, reacts and comments', async () => {
    const me = await makeProfile('poster');
    const fan = await makeProfile('fan');
    const up = await media.requestUpload(me.id, {
      kind: 'AUDIO',
      fileName: 'demo.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 2048,
    });
    await media.completeUpload(me.id, { assetId: up.assetId });
    for (let i = 0; i < 3; i++) await community.createPost(me.id, { title: `Post ${i}`, body: 'body' });
    const withAudio = await community.createPost(me.id, {
      title: 'With audio',
      body: 'listen',
      audioId: up.assetId,
      feedbackRequested: true,
    });

    const page1 = await community.getFeed(fan.id, { authorId: me.id, limit: 2 });
    expect(page1.posts.map((p) => p.title)).toEqual(['With audio', 'Post 2']);
    expect(page1.posts[0]!.audio?.url).toBe(`signed://${up.path}`);
    const page2 = await community.getFeed(fan.id, { authorId: me.id, limit: 2, cursor: page1.nextCursor });
    expect(page2.posts.map((p) => p.title)).toEqual(['Post 1', 'Post 0']);
    expect(page2.nextCursor).toBeNull();

    expect(await community.toggleReaction(fan.id, withAudio.id, 'FIRE')).toEqual({ active: true });
    await community.addComment(fan.id, withAudio.id, 'The low end is great');
    const { post, comments } = await community.getPost(fan.id, withAudio.id);
    expect(post.reactionCounts).toEqual({ FIRE: 1 });
    expect(post.myReactions).toEqual(['FIRE']);
    expect(comments).toHaveLength(1);
    expect(await db().notification.count({ where: { recipientId: me.id, type: 'post.comment' } })).toBe(1);
    expect(await community.toggleReaction(fan.id, withAudio.id, 'FIRE')).toEqual({ active: false });
  });

  it('only authors edit/delete; others cannot attach someone else’s audio', async () => {
    const me = await makeProfile('author');
    const thief = await makeProfile('thief');
    const up = await media.requestUpload(me.id, {
      kind: 'AUDIO',
      fileName: 'a.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 10,
    });
    await media.completeUpload(me.id, { assetId: up.assetId });
    const post = await community.createPost(me.id, { title: 'Mine', body: 'b' });
    await expect(community.updatePost(thief.id, post.id, { title: 'x', body: 'y' })).rejects.toMatchObject({
      status: 403,
    });
    await expect(community.deletePost(thief.id, post.id)).rejects.toMatchObject({ status: 403 });
    await expect(
      community.createPost(thief.id, { title: 't', body: 'b', audioId: up.assetId }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('a post linked to a private project does not leak the project', async () => {
    const me = await makeProfile('owner');
    const p = await projects.createProject(me.id, { title: 'Unreleased album' });
    const post = await community.createPost(me.id, { title: 'Teaser', body: 'soon', projectId: p.id });
    const stranger = await makeProfile('stranger');
    const { post: seen } = await community.getPost(stranger.id, post.id);
    expect(seen.project).toBeNull();
    await projects.updateProject(me.id, p.id, { visibility: 'PUBLIC' });
    expect((await community.getPost(stranger.id, post.id)).post.project?.title).toBe('Unreleased album');
  });

  it('records content reports once per reporter', async () => {
    const me = await makeProfile('reporter');
    const author = await makeProfile('author');
    const post = await community.createPost(author.id, { title: 'x', body: 'y' });
    await community.report(me.id, {
      targetType: 'POST',
      targetId: post.id,
      reason: 'Copyright infringement',
    });
    await community.report(me.id, {
      targetType: 'POST',
      targetId: post.id,
      reason: 'Copyright infringement again',
    });
    expect(await db().report.count({ where: { reporterId: me.id } })).toBe(1);
  });
});

describe('profiles', () => {
  it('updates profile fields and links, rejects taken usernames, respects privacy', async () => {
    const me = await makeProfile('me');
    const other = await makeProfile('other');
    await profiles.updateProfile(me.id, {
      displayName: 'Mike',
      username: me.username,
      bio: 'Synthwave producer',
      specialties: ['Producer'],
      socialLinks: [{ label: 'SoundCloud', url: 'https://soundcloud.com/mike' }],
      isPublic: false,
    });
    await expect(
      profiles.updateProfile(me.id, { displayName: 'Mike', username: other.username }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(profiles.getArtist(other.id, me.username)).rejects.toMatchObject({ status: 404 });
    const mine = await profiles.getArtist(me.id, me.username);
    expect(mine.profile.socialLinks.map((l) => l.url)).toEqual(['https://soundcloud.com/mike']);
  });
});
