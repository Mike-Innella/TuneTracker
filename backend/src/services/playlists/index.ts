import { db } from '@tunetracker/data';
import { playlistSchema, type PlaylistInput } from '@tunetracker/shared';
import { AppError, notFound, parse } from '../../lib/errors';
import { rateLimit } from '../../lib/rate-limit';
import { publicUrl } from '../../storage';
import { isPlayable, present, trackInclude } from '../tracks';

const MAX_ITEMS = 500;

type Tx = Parameters<Parameters<ReturnType<typeof db>['$transaction']>[0]>[0];
/** Serializes order changes per playlist (same pattern as board ordering). */
const lock = (tx: Tx, playlistId: string) =>
  tx.$queryRaw`SELECT id FROM "Playlist" WHERE id = ${playlistId} FOR UPDATE`;

async function ownPlaylist(actorId: string, id: string) {
  const p = await db().playlist.findUnique({ where: { id } });
  if (!p || p.ownerId !== actorId) throw notFound('Playlist not found');
  return p;
}

export async function createPlaylist(actorId: string, input: PlaylistInput) {
  const data = parse(playlistSchema, input);
  await rateLimit(`playlist:${actorId}`, 30, 3600);
  return db().playlist.create({ data: { ...data, description: data.description ?? null, ownerId: actorId } });
}

export async function updatePlaylist(actorId: string, id: string, input: PlaylistInput) {
  const data = parse(playlistSchema, input);
  await ownPlaylist(actorId, id);
  return db().playlist.update({ where: { id }, data: { ...data, description: data.description ?? null } });
}

export async function deletePlaylist(actorId: string, id: string) {
  await ownPlaylist(actorId, id);
  await db().playlist.delete({ where: { id } });
}

/** Adds a track the actor can see (published and public, or their own) to the end. Idempotent. */
export async function addTrack(actorId: string, playlistId: string, trackId: string) {
  await ownPlaylist(actorId, playlistId);
  const t = await db().track.findUnique({
    where: { id: trackId },
    select: { ownerId: true, status: true, visibility: true },
  });
  if (!t || (!isPlayable(t) && t.ownerId !== actorId)) throw notFound('Track not found');
  return db().$transaction(async (tx) => {
    await lock(tx, playlistId);
    const existing = await tx.playlistItem.findUnique({
      where: { playlistId_trackId: { playlistId, trackId } },
    });
    if (existing) return existing;
    const count = await tx.playlistItem.count({ where: { playlistId } });
    if (count >= MAX_ITEMS) throw new AppError(400, `A playlist holds up to ${MAX_ITEMS} tracks`);
    const item = await tx.playlistItem.create({ data: { playlistId, trackId, position: count } });
    await tx.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } });
    return item;
  });
}

export async function removeTrack(actorId: string, playlistId: string, trackId: string) {
  await ownPlaylist(actorId, playlistId);
  await db().$transaction(async (tx) => {
    await lock(tx, playlistId);
    await tx.playlistItem.deleteMany({ where: { playlistId, trackId } });
    const rest = await tx.playlistItem.findMany({ where: { playlistId }, orderBy: { position: 'asc' } });
    // close the gap so positions stay 0..n-1
    await Promise.all(
      rest.map((it, i) =>
        it.position === i
          ? null
          : tx.playlistItem.update({
              where: { playlistId_trackId: { playlistId, trackId: it.trackId } },
              data: { position: i },
            }),
      ),
    );
  });
}

/** Moves one track up or down by one place (keyboard- and screen-reader-friendly reordering). */
export async function moveTrack(
  actorId: string,
  playlistId: string,
  trackId: string,
  direction: 'up' | 'down',
) {
  await ownPlaylist(actorId, playlistId);
  await db().$transaction(async (tx) => {
    await lock(tx, playlistId);
    const items = await tx.playlistItem.findMany({ where: { playlistId }, orderBy: { position: 'asc' } });
    const i = items.findIndex((it) => it.trackId === trackId);
    if (i < 0) throw notFound('Track not in this playlist');
    const j = direction === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= items.length) return;
    const key = (id: string) => ({ playlistId_trackId: { playlistId, trackId: id } });
    await tx.playlistItem.update({ where: key(items[i]!.trackId), data: { position: j } });
    await tx.playlistItem.update({ where: key(items[j]!.trackId), data: { position: i } });
  });
}

/**
 * Private playlists are 404 to everyone but the owner. Tracks that are no longer published or
 * public are hidden from other listeners (the owner still sees their own drafts).
 */
export async function getPlaylist(viewerId: string | null, id: string) {
  const p = await db().playlist.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarPath: true } },
      items: { orderBy: { position: 'asc' }, include: { track: { include: trackInclude } } },
    },
  });
  if (!p || (p.visibility !== 'PUBLIC' && p.ownerId !== viewerId)) throw notFound('Playlist not found');
  const visible = p.items.filter((it) => isPlayable(it.track) || it.track.ownerId === viewerId);
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    visibility: p.visibility,
    updatedAt: p.updatedAt,
    owner: { ...p.owner, avatarUrl: publicUrl(p.owner.avatarPath) },
    isMine: p.ownerId === viewerId,
    tracks: await present(
      visible.map((it) => it.track),
      viewerId,
    ),
  };
}

/** The viewer's playlists, with whether each already holds `trackId` (for "Add to playlist"). */
export async function myPlaylists(actorId: string, trackId?: string) {
  const rows = await db().playlist.findMany({
    where: { ownerId: actorId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      ...(trackId ? { items: { where: { trackId }, select: { trackId: true } } } : {}),
    },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    visibility: p.visibility,
    trackCount: p._count.items,
    hasTrack: trackId ? ((p as { items?: unknown[] }).items?.length ?? 0) > 0 : false,
  }));
}

/** Public playlists on an artist page. */
export async function artistPlaylists(ownerId: string) {
  const rows = await db().playlist.findMany({
    where: { ownerId, visibility: 'PUBLIC', items: { some: {} } },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { items: true } } },
    take: 20,
  });
  return rows.map((p) => ({ id: p.id, title: p.title, trackCount: p._count.items }));
}

/** Collections: the tracks you saved (liked), newest first — your library. */
export async function savedTracks(actorId: string) {
  const likes = await db().trackLike.findMany({
    where: {
      profileId: actorId,
      track: { OR: [{ status: 'PUBLISHED', visibility: 'PUBLIC' }, { ownerId: actorId }] },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { track: { include: trackInclude } },
  });
  return present(
    likes.map((l) => l.track),
    actorId,
  );
}
