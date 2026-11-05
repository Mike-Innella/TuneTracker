'use server';

import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  getCurrentProfile,
  requireActor,
  runAction,
  tracks,
  type UpdateTrackInput,
} from '@tunetracker/backend';

const VISITOR_COOKIE = 'tt-visitor';

/** Anonymous listeners get a random, httpOnly visitor id so plays de-duplicate without tracking IPs. */
async function visitorId() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  const id = randomUUID();
  jar.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return id;
}

export async function recordPlayAction(trackId: string) {
  return runAction(async () => {
    const me = await getCurrentProfile();
    return tracks.recordPlay(trackId, me?.id ?? null, me ? null : await visitorId());
  });
}

export async function createTrackDraftAction(input: { audioId: string; kind?: 'TRACK' | 'SAMPLE' }) {
  return runAction(async () => {
    const me = await requireActor();
    const t = await tracks.createDraft(me.id, input);
    return { id: t.id };
  });
}

export async function updateTrackAction(trackId: string, input: UpdateTrackInput) {
  return runAction(async () => {
    const me = await requireActor();
    await tracks.updateTrack(me.id, trackId, input);
    revalidatePath(`/tracks/${trackId}`);
  });
}

export async function publishTrackAction(trackId: string) {
  return runAction(async () => {
    const me = await requireActor();
    await tracks.publishTrack(me.id, trackId);
    revalidatePath('/discover');
    revalidatePath('/studio');
    return { id: trackId };
  });
}

export async function deleteTrackAction(trackId: string) {
  return runAction(async () => {
    const me = await requireActor();
    await tracks.deleteTrack(me.id, trackId);
    revalidatePath('/studio');
  });
}

export async function setTrackLikeAction(trackId: string, like: boolean) {
  return runAction(async () => {
    const me = await requireActor();
    return tracks.setLike(me.id, trackId, like);
  });
}

export async function sampleDownloadAction(trackId: string) {
  return runAction(async () => {
    const me = await getCurrentProfile();
    return tracks.downloadUrl(me?.id ?? null, trackId);
  });
}
