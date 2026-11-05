import { describe, expect, it, vi } from 'vitest';
import { db } from '@tunetracker/data';

// Supabase Auth admin and Storage are exercised in e2e; here we test the database rules.
const admin = {
  inviteUserByEmail: vi.fn(async () => ({ error: null })),
  deleteUser: vi.fn(async () => ({ error: null })),
  updateUserById: vi.fn(async () => ({ error: null })),
};
vi.mock('../../src/auth/supabase', () => ({
  supabaseAdmin: () => ({ auth: { admin } }),
  supabaseServer: vi.fn(),
}));
const removed: string[] = [];
vi.mock('../../src/storage', () => ({
  removeObjects: vi.fn(async (_b: string, paths: string[]) => void removed.push(...paths)),
  publicUrl: (p: string | null) => (p ? `public://${p}` : null),
  signedReadUrls: vi.fn(async () => new Map()),
  signedReadUrl: vi.fn(async () => null),
  createUploadTicket: vi.fn(),
  objectInfo: vi.fn(),
}));

const follows = await import('../../src/services/follows');
const collaboration = await import('../../src/services/collaboration');
const account = await import('../../src/services/account');
const moderation = await import('../../src/services/moderation');
const community = await import('../../src/services/community');
const projects = await import('../../src/services/projects');
const profiles = await import('../../src/services/profiles');
const { ensureProfile } = await import('../../src/auth/session');
const { makeProfile } = await import('./helpers');

describe('follows', () => {
  it('follows idempotently, counts, notifies once, and filters the feed', async () => {
    const fan = await makeProfile('fan');
    const artist = await makeProfile('artist');
    await follows.follow(fan.id, artist.username);
    await follows.follow(fan.id, artist.username);
    expect(await follows.followStats(artist.id, fan.id)).toEqual({
      followers: 1,
      following: 0,
      isFollowing: true,
    });
    expect(await db().notification.count({ where: { recipientId: artist.id, type: 'follow' } })).toBe(1);
    await expect(follows.follow(fan.id, fan.username)).rejects.toMatchObject({ status: 400 });

    const other = await makeProfile('other');
    await community.createPost(artist.id, { title: 'From followed', body: 'b' });
    await community.createPost(other.id, { title: 'From stranger', body: 'b' });
    const feed = await community.getFeed(fan.id, { followedBy: fan.id });
    expect(feed.posts.map((p) => p.title)).toEqual(['From followed']);

    expect((await profiles.getArtist(fan.id, artist.username)).stats.isFollowing).toBe(true);
    await follows.unfollow(fan.id, artist.username);
    expect((await follows.followStats(artist.id, fan.id)).followers).toBe(0);
  });
});

describe('collaboration requests', () => {
  it('invite → accept adds a member; decline and revoke do not; only the invitee answers', async () => {
    const owner = await makeProfile('owner');
    const a = await makeProfile('accepter');
    const d = await makeProfile('decliner');
    const p = await projects.createProject(owner.id, { title: 'Requests' });

    await collaboration.inviteMember(owner.id, p.id, { target: `@${a.username}`, role: 'EDITOR' });
    await collaboration.inviteMember(owner.id, p.id, { target: d.username, role: 'VIEWER' });
    // pending invite grants nothing yet
    await expect(projects.getProject(a.id, p.id)).rejects.toMatchObject({ status: 404 });

    const [inviteA] = await collaboration.myInvites(a.id);
    await expect(collaboration.respondToInvite(d.id, inviteA!.id, true)).rejects.toMatchObject({
      status: 404,
    });
    await collaboration.respondToInvite(a.id, inviteA!.id, true);
    expect((await projects.getProject(a.id, p.id)).role).toBe('EDITOR');
    await expect(collaboration.respondToInvite(a.id, inviteA!.id, true)).rejects.toMatchObject({
      status: 409,
    });

    const [inviteD] = await collaboration.myInvites(d.id);
    await collaboration.respondToInvite(d.id, inviteD!.id, false);
    await expect(projects.getProject(d.id, p.id)).rejects.toMatchObject({ status: 404 });
    expect(
      await db().notification.count({
        where: { recipientId: owner.id, type: { startsWith: 'project.invite.' } },
      }),
    ).toBe(2);

    // members are not re-invited; revoked invites cannot be accepted
    await expect(
      collaboration.inviteMember(owner.id, p.id, { target: a.username, role: 'VIEWER' }),
    ).rejects.toMatchObject({ status: 409 });
    const x = await makeProfile('revoked');
    await collaboration.inviteMember(owner.id, p.id, { target: x.username, role: 'VIEWER' });
    const [inviteX] = await collaboration.myInvites(x.id);
    await collaboration.revokeInvite(owner.id, inviteX!.id);
    await expect(collaboration.respondToInvite(x.id, inviteX!.id, true)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('email invites reach people without an account and attach on first sign-in', async () => {
    const owner = await makeProfile('owner');
    const p = await projects.createProject(owner.id, { title: 'By email' });
    const email = `new_${Date.now()}@example.test`;
    expect(await collaboration.inviteMember(owner.id, p.id, { target: email, role: 'EDITOR' })).toEqual({
      status: 'emailed',
    });
    expect(admin.inviteUserByEmail).toHaveBeenCalledWith(email, expect.anything());

    const id = crypto.randomUUID();
    await ensureProfile({ id, email, user_metadata: { username: `invitee${Date.now() % 100000}` } } as never);
    const [inv] = await collaboration.myInvites(id);
    expect(inv?.project.title).toBe('By email');
    await collaboration.respondToInvite(id, inv!.id, true);
    expect((await projects.getProject(id, p.id)).role).toBe('EDITOR');
  });
});

describe('account deletion', () => {
  it('requires the username, removes files, rows and the auth user', async () => {
    const me = await makeProfile('leaver');
    const p = await projects.createProject(me.id, { title: 'Mine' });
    await db().mediaAsset.create({
      data: {
        ownerId: me.id,
        projectId: p.id,
        kind: 'AUDIO',
        bucket: 'media',
        path: `${me.id}/a.mp3`,
        mimeType: 'audio/mpeg',
        sizeBytes: 1,
      },
    });
    await community.createPost(me.id, { title: 'bye', body: 'b' });
    await expect(account.deleteAccount(me.id, { confirmUsername: 'wrong_name' })).rejects.toMatchObject({
      status: 400,
    });
    await account.deleteAccount(me.id, { confirmUsername: me.username });
    expect(removed).toContain(`${me.id}/a.mp3`);
    expect(await db().profile.findUnique({ where: { id: me.id } })).toBeNull();
    expect(await db().project.count({ where: { id: p.id } })).toBe(0);
    expect(await db().post.count({ where: { authorId: me.id } })).toBe(0);
    expect(admin.deleteUser).toHaveBeenCalledWith(me.id);
  });
});

describe('moderation', () => {
  it('is hidden from regular users and records every decision', async () => {
    const mod = await makeProfile('mod');
    await db().profile.update({ where: { id: mod.id }, data: { role: 'MODERATOR' } });
    const author = await makeProfile('author');
    const reporter = await makeProfile('reporter');
    const post = await community.createPost(author.id, { title: 'Spam', body: 'buy now' });
    await community.report(reporter.id, { targetType: 'POST', targetId: post.id, reason: 'This is spam' });

    await expect(moderation.listReports(reporter.id)).rejects.toMatchObject({ status: 404 });
    const open = await moderation.listReports(mod.id);
    const r = open.find((x) => x.targetId === post.id)!;
    expect(r.target?.owner).toBe(author.username);

    await moderation.resolveReport(mod.id, { reportId: r.id, outcome: 'CONTENT_REMOVED', note: 'spam' });
    expect(await db().post.count({ where: { id: post.id } })).toBe(0);
    expect(
      await db().moderationAction.count({ where: { targetId: post.id, outcome: 'CONTENT_REMOVED' } }),
    ).toBe(1);
    expect(
      await db().notification.count({ where: { recipientId: author.id, type: 'moderation.removed' } }),
    ).toBe(1);
    await expect(
      moderation.resolveReport(mod.id, { reportId: r.id, outcome: 'DISMISSED' }),
    ).rejects.toMatchObject({ status: 409 });

    await community.report(reporter.id, {
      targetType: 'PROFILE',
      targetId: author.id,
      reason: 'Repeat spammer',
    });
    const pr = (await moderation.listReports(mod.id)).find((x) => x.targetId === author.id)!;
    await moderation.resolveReport(mod.id, { reportId: pr.id, outcome: 'USER_SUSPENDED' });
    expect((await db().profile.findUniqueOrThrow({ where: { id: author.id } })).suspendedAt).not.toBeNull();
    expect(admin.updateUserById).toHaveBeenCalledWith(author.id, { ban_duration: '876000h' });
    await expect(follows.follow(reporter.id, author.username)).rejects.toMatchObject({ status: 404 });
  });
});
