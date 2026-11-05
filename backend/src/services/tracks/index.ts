import { db, type Prisma } from '@tunetracker/data';
import {
  BUCKETS,
  createTrackDraftSchema,
  trackListSchema,
  updateTrackSchema,
  type TrackListInput,
  type UpdateTrackInput,
} from '@tunetracker/shared';
import { AppError, notFound, parse } from '../../lib/errors';
import { firstInWindow, rateLimit } from '../../lib/rate-limit';
import { publicUrl, removeObjects, signedDownloadUrl, signedReadUrls } from '../../storage';

const ownerSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarPath: true,
  isPublic: true,
} as const;
const trackInclude = {
  owner: { select: ownerSelect },
  audio: { select: { path: true, bucket: true, mimeType: true, verifiedAt: true } },
  artwork: { select: { path: true } },
  _count: { select: { likes: true, plays: true } },
} satisfies Prisma.TrackInclude;
type TrackRow = Prisma.TrackGetPayload<{ include: typeof trackInclude }>;

const isPlayable = (t: { status: string; visibility: string }) =>
  t.status === 'PUBLISHED' && t.visibility === 'PUBLIC';

/** Public shape. Signed playback URLs are minted per request and expire; drafts stay private. */
async function present(rows: TrackRow[], viewerId: string | null) {
  const urls = await signedReadUrls(rows.flatMap((t) => (t.audio?.verifiedAt ? [t.audio.path] : [])));
  const liked = viewerId
    ? new Set(
        (
          await db().trackLike.findMany({
            where: { profileId: viewerId, trackId: { in: rows.map((r) => r.id) } },
            select: { trackId: true },
          })
        ).map((l) => l.trackId),
      )
    : new Set<string>();
  return rows.map((t) => ({
    id: t.id,
    kind: t.kind,
    status: t.status,
    visibility: t.visibility,
    title: t.title,
    description: t.description,
    genre: t.genre,
    tags: t.tags,
    links: t.links,
    credits: (t.credits as { name: string; role: string }[]) ?? [],
    bpm: t.bpm,
    musicalKey: t.musicalKey,
    durationSec: t.durationSec,
    downloadable: t.kind === 'SAMPLE' && t.downloadable && !!t.usageRights,
    usageRights: t.usageRights,
    publishedAt: t.publishedAt,
    createdAt: t.createdAt,
    audioUrl: t.audio?.path ? (urls.get(t.audio.path) ?? null) : null,
    mimeType: t.audio?.mimeType ?? null,
    artworkUrl: publicUrl(t.artwork?.path),
    owner: {
      id: t.owner.id,
      username: t.owner.username,
      displayName: t.owner.displayName,
      avatarUrl: publicUrl(t.owner.avatarPath),
    },
    likeCount: t._count.likes,
    playCount: t._count.plays,
    likedByMe: liked.has(t.id),
    isMine: viewerId === t.ownerId,
  }));
}
export type PublicTrack = Awaited<ReturnType<typeof present>>[number];

async function ownTrack(actorId: string, trackId: string) {
  const t = await db().track.findUnique({ where: { id: trackId } });
  if (!t || t.ownerId !== actorId) throw notFound('Track not found');
  return t;
}

/** Step 1 of the wizard: an uploaded, verified audio file becomes a private draft. */
export async function createDraft(actorId: string, input: { audioId: string; kind?: string }) {
  const { audioId, kind } = parse(createTrackDraftSchema, input);
  const asset = await db().mediaAsset.findUnique({ where: { id: audioId } });
  if (!asset || asset.ownerId !== actorId || asset.kind !== 'AUDIO' || !asset.verifiedAt) {
    throw new AppError(400, 'Upload the audio file first');
  }
  await rateLimit(`track-draft:${actorId}`, 60, 3600);
  return db().track.create({
    data: {
      ownerId: actorId,
      kind,
      title: (asset.title ?? 'Untitled').slice(0, 160),
      durationSec: asset.durationSec,
      audioId: asset.id,
    },
  });
}

export async function updateTrack(actorId: string, trackId: string, input: UpdateTrackInput) {
  const data = parse(updateTrackSchema, input);
  const t = await ownTrack(actorId, trackId);
  if (data.artworkId) {
    const art = await db().mediaAsset.findUnique({ where: { id: data.artworkId } });
    if (
      !art ||
      art.ownerId !== actorId ||
      art.kind !== 'IMAGE' ||
      art.bucket !== BUCKETS.public ||
      !art.verifiedAt
    ) {
      throw new AppError(400, 'Artwork upload not found');
    }
  }
  const kind = data.kind ?? t.kind;
  const downloadable = kind === 'SAMPLE' ? (data.downloadable ?? t.downloadable) : false;
  const rights = data.usageRights === undefined ? t.usageRights : data.usageRights;
  if (downloadable && !rights) throw new AppError(400, 'Choose usage rights before allowing downloads');
  return db().track.update({
    where: { id: trackId },
    data: { ...data, credits: data.credits ?? undefined, downloadable },
  });
}

/** Publishing is idempotent and only succeeds once the audio is verified and details are valid. */
export async function publishTrack(actorId: string, trackId: string) {
  const t = await ownTrack(actorId, trackId);
  if (t.status === 'PUBLISHED') return t;
  const audio = t.audioId ? await db().mediaAsset.findUnique({ where: { id: t.audioId } }) : null;
  if (!audio?.verifiedAt) throw new AppError(400, 'The audio upload is not finished');
  if (!t.title.trim()) throw new AppError(400, 'Give the track a title');
  if (t.downloadable && !t.usageRights)
    throw new AppError(400, 'Choose usage rights before allowing downloads');
  // the status guard makes concurrent publishes (a double click) take effect once
  await db().track.updateMany({
    where: { id: trackId, status: 'DRAFT' },
    data: { status: 'PUBLISHED', publishedAt: t.publishedAt ?? new Date() },
  });
  return db().track.findUniqueOrThrow({ where: { id: trackId } });
}

export async function unpublishTrack(actorId: string, trackId: string) {
  await ownTrack(actorId, trackId);
  return db().track.update({ where: { id: trackId }, data: { status: 'DRAFT' } });
}

/** Deletes the track and its files unless another track or post still uses them. */
export async function deleteTrack(actorId: string, trackId: string) {
  const t = await ownTrack(actorId, trackId);
  await db().track.delete({ where: { id: trackId } });
  for (const assetId of [t.audioId, t.artworkId].filter(Boolean) as string[]) {
    const asset = await db().mediaAsset.findUnique({
      where: { id: assetId },
      include: { _count: { select: { audioOf: true, artworkOf: true, audioPosts: true, imagePosts: true } } },
    });
    if (!asset) continue;
    const used =
      asset._count.audioOf + asset._count.artworkOf + asset._count.audioPosts + asset._count.imagePosts;
    if (used === 0) {
      await removeObjects(asset.bucket, [asset.path]);
      await db().mediaAsset.delete({ where: { id: asset.id } });
    }
  }
}

/** Anyone may read a published public track; owners also see their drafts and private tracks. */
export async function getTrack(viewerId: string | null, trackId: string) {
  const t = await db().track.findUnique({ where: { id: trackId }, include: trackInclude });
  if (!t || (!isPlayable(t) && t.ownerId !== viewerId)) throw notFound('Track not found');
  return (await present([t], viewerId))[0]!;
}

/** Discovery: published public tracks and samples, newest or trending (most played, published in the last 30 days). */
export async function listTracks(
  viewerId: string | null,
  input: TrackListInput = {},
  opts: { followedBy?: string } = {},
) {
  const f = parse(trackListSchema, input);
  const where: Prisma.TrackWhereInput = {
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    owner: {
      suspendedAt: null,
      ...(opts.followedBy ? { followers: { some: { followerId: opts.followedBy } } } : {}),
    },
    ...(f.kind ? { kind: f.kind } : {}),
    ...(f.genre ? { genre: f.genre } : {}),
    ...(f.tag ? { tags: { has: f.tag } } : {}),
    ...(f.q
      ? {
          OR: [
            { title: { contains: f.q, mode: 'insensitive' } },
            { owner: { displayName: { contains: f.q, mode: 'insensitive' } } },
            { owner: { username: { contains: f.q.toLowerCase() } } },
          ],
        }
      : {}),
  };
  if (f.sort === 'trending') {
    // "Trending" = most played among tracks published in the last 30 days (explainable, no ML).
    // shortcut: counts all-time plays of recent tracks; move to a daily aggregate table at scale
    const rows = await db().track.findMany({
      where: { ...where, publishedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
      include: trackInclude,
      orderBy: [{ plays: { _count: 'desc' } }, { publishedAt: 'desc' }],
      take: f.limit,
    });
    return { tracks: await present(rows, viewerId), nextCursor: null };
  }
  const rows = await db().track.findMany({
    where,
    include: trackInclude,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: f.limit + 1,
    ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, f.limit);
  return {
    tracks: await present(page, viewerId),
    nextCursor: rows.length > f.limit ? (page[page.length - 1]?.id ?? null) : null,
  };
}

/** An artist's published public catalogue (artist page). */
export async function artistTracks(viewerId: string | null, ownerId: string) {
  const rows = await db().track.findMany({
    where: { ownerId, status: 'PUBLISHED', visibility: 'PUBLIC' },
    include: trackInclude,
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });
  return present(rows, viewerId);
}

/** The owner's catalogue, drafts included (Studio). */
export async function myTracks(actorId: string) {
  const rows = await db().track.findMany({
    where: { ownerId: actorId },
    include: trackInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return present(rows, actorId);
}

export async function setLike(actorId: string, trackId: string, like: boolean) {
  await getTrack(actorId, trackId); // visible to the actor, or 404
  if (like) {
    await db().trackLike.upsert({
      where: { trackId_profileId: { trackId, profileId: actorId } },
      update: {},
      create: { trackId, profileId: actorId },
    });
  } else {
    await db().trackLike.deleteMany({ where: { trackId, profileId: actorId } });
  }
  return { liked: like, likeCount: await db().trackLike.count({ where: { trackId } }) };
}

/**
 * Counts a listen once per listener (or anonymous visitor id) per track per 30 minutes.
 * Owners listening to their own track are not counted. No IP or user agent is stored.
 */
export async function recordPlay(trackId: string, listenerId: string | null, visitorId: string | null) {
  const t = await db().track.findUnique({
    where: { id: trackId },
    select: { ownerId: true, status: true, visibility: true },
  });
  if (!t || !isPlayable(t) || t.ownerId === listenerId) return { counted: false };
  const who = listenerId ?? visitorId;
  if (!who) return { counted: false };
  if (!(await firstInWindow(`play:${trackId}:${who}`, 30 * 60))) return { counted: false };
  await db().play.create({ data: { trackId, listenerId } });
  return { counted: true };
}

/** Sample downloads only through this check: published, downloadable, rights chosen. */
export async function downloadUrl(viewerId: string | null, trackId: string) {
  const t = await db().track.findUnique({ where: { id: trackId }, include: { audio: true } });
  if (!t || !isPlayable(t)) throw notFound('Track not found');
  if (t.kind !== 'SAMPLE' || !t.downloadable || !t.usageRights || !t.audio) {
    throw new AppError(403, 'The creator has not enabled downloads for this sample');
  }
  await rateLimit(`download:${viewerId ?? 'anon'}:${trackId}`, 20, 3600);
  const ext = t.audio.path.split('.').pop() ?? 'wav';
  const url = await signedDownloadUrl(
    t.audio.path,
    `${t.title.replace(/[^\w.-]+/g, '_').slice(0, 80)}.${ext}`,
  );
  if (!url) throw new AppError(400, 'Download unavailable right now');
  return { url };
}
