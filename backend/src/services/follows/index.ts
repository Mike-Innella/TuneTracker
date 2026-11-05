import { db } from '@tunetracker/data';
import { usernameSchema } from '@tunetracker/shared';
import { AppError, notFound, parse } from '../../lib/errors';
import { rateLimit } from '../../lib/rate-limit';
import { publicUrl } from '../../storage';
import { notify } from '../notifications';

async function target(username: string) {
  const profile = await db().profile.findUnique({ where: { username: parse(usernameSchema, username) } });
  if (!profile || profile.suspendedAt) throw notFound('Artist not found');
  return profile;
}

export async function follow(actorId: string, username: string) {
  const t = await target(username);
  if (t.id === actorId) throw new AppError(400, "You can't follow yourself");
  await rateLimit(`follow:${actorId}`, 120, 3600);
  const created = await db()
    .follow.create({ data: { followerId: actorId, followingId: t.id } })
    .then(() => true)
    .catch((e: { code?: string }) => {
      if (e.code === 'P2002') return false; // already following: idempotent
      throw e;
    });
  if (created) {
    const me = await db().profile.findUniqueOrThrow({
      where: { id: actorId },
      select: { username: true, displayName: true },
    });
    await notify(
      t.id,
      'follow',
      `${me.displayName} (@${me.username}) followed you`,
      `/artists/${me.username}`,
    );
  }
  return { following: true };
}

export async function unfollow(actorId: string, username: string) {
  const t = await target(username);
  await db().follow.deleteMany({ where: { followerId: actorId, followingId: t.id } });
  return { following: false };
}

export async function followStats(profileId: string, viewerId: string | null) {
  const [followers, following, mine] = await Promise.all([
    db().follow.count({ where: { followingId: profileId } }),
    db().follow.count({ where: { followerId: profileId } }),
    viewerId
      ? db().follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: profileId } },
        })
      : null,
  ]);
  return { followers, following, isFollowing: !!mine };
}

/** Followers or followed artists, public profiles only (private ones are hidden from lists). */
export async function listConnections(username: string, which: 'followers' | 'following', limit = 50) {
  const t = await target(username);
  const rows = await db().follow.findMany({
    where: which === 'followers' ? { followingId: t.id } : { followerId: t.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      follower: { select: { username: true, displayName: true, avatarPath: true, isPublic: true } },
      following: { select: { username: true, displayName: true, avatarPath: true, isPublic: true } },
    },
  });
  return rows
    .map((r) => (which === 'followers' ? r.follower : r.following))
    .filter((p) => p.isPublic)
    .map((p) => ({ username: p.username, displayName: p.displayName, avatarUrl: publicUrl(p.avatarPath) }));
}

/** Ids the actor follows (feeds and Home). */
export async function followingIds(actorId: string) {
  const rows = await db().follow.findMany({ where: { followerId: actorId }, select: { followingId: true } });
  return rows.map((r) => r.followingId);
}
