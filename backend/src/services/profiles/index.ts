import { db } from '@tunetracker/data';
import { BUCKETS, profileSchema, themeSchema, type ProfileInput } from '@tunetracker/shared';
import { AppError, notFound, parse } from '../../lib/errors';
import { publicUrl, removeObjects } from '../../storage';
import { getFeed } from '../community';
import { followStats } from '../follows';

export async function getMyProfile(actorId: string) {
  const profile = await db().profile.findUniqueOrThrow({
    where: { id: actorId },
    include: { socialLinks: { orderBy: { position: 'asc' } } },
  });
  return { ...profile, avatarUrl: publicUrl(profile.avatarPath) };
}

/** Private profiles are visible only to their owner. */
export async function getArtist(viewerId: string | null, username: string) {
  const profile = await db().profile.findUnique({
    where: { username: username.toLowerCase() },
    include: { socialLinks: { orderBy: { position: 'asc' } } },
  });
  if (!profile || (!profile.isPublic && profile.id !== viewerId)) throw notFound('Artist not found');
  const [feed, projects, stats] = await Promise.all([
    getFeed(viewerId, { authorId: profile.id, limit: 20 }),
    db().project.findMany({
      where: { ownerId: profile.id, visibility: 'PUBLIC', archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, description: true, artworkPath: true, status: true },
    }),
    followStats(profile.id, viewerId),
  ]);
  return {
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      specialties: profile.specialties,
      socialLinks: profile.socialLinks,
      isPublic: profile.isPublic,
      avatarUrl: publicUrl(profile.avatarPath),
      createdAt: profile.createdAt,
    },
    posts: feed.posts,
    projects: projects.map((p) => ({ ...p, artworkUrl: publicUrl(p.artworkPath) })),
    isMe: profile.id === viewerId,
    stats,
  };
}

export async function updateProfile(actorId: string, input: ProfileInput) {
  const { socialLinks, ...data } = parse(profileSchema, input);
  const clash = await db().profile.findFirst({ where: { username: data.username, NOT: { id: actorId } } });
  if (clash) throw new AppError(409, 'That username is taken');
  return db().profile.update({
    where: { id: actorId },
    data: {
      ...data,
      socialLinks: {
        deleteMany: {},
        create: socialLinks.map((l, position) => ({ ...l, position })),
      },
    },
  });
}

/** Swap avatar to a verified public image the actor uploaded; delete the old object. */
export async function setAvatar(actorId: string, assetId: string | null) {
  const profile = await db().profile.findUniqueOrThrow({ where: { id: actorId } });
  let path: string | null = null;
  if (assetId) {
    const asset = await db().mediaAsset.findUnique({ where: { id: assetId } });
    if (
      !asset ||
      asset.ownerId !== actorId ||
      asset.kind !== 'IMAGE' ||
      asset.bucket !== BUCKETS.public ||
      !asset.verifiedAt
    ) {
      throw notFound('Image upload not found');
    }
    path = asset.path;
  }
  if (profile.avatarPath && profile.avatarPath !== path) {
    await removeObjects(BUCKETS.public, [profile.avatarPath]);
    await db().mediaAsset.deleteMany({ where: { bucket: BUCKETS.public, path: profile.avatarPath } });
  }
  return db().profile.update({ where: { id: actorId }, data: { avatarPath: path } });
}

export async function setTheme(actorId: string, theme: string) {
  return db().profile.update({ where: { id: actorId }, data: { theme: parse(themeSchema, theme) } });
}

export async function isUsernameAvailable(username: string) {
  return !(await db().profile.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  }));
}

/** Header search: public artists by username or display name (suspended accounts excluded). */
export async function searchArtists(q: string, limit = 6) {
  const term = q.trim().slice(0, 80);
  if (!term) return [];
  const rows = await db().profile.findMany({
    where: {
      isPublic: true,
      suspendedAt: null,
      OR: [
        { username: { contains: term.toLowerCase().replace(/^@/, '') } },
        { displayName: { contains: term, mode: 'insensitive' } },
      ],
    },
    orderBy: { followers: { _count: 'desc' } },
    take: limit,
    select: { username: true, displayName: true, avatarPath: true, specialties: true },
  });
  return rows.map((r) => ({ ...r, avatarUrl: publicUrl(r.avatarPath) }));
}
