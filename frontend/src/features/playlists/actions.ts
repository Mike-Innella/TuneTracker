'use server';

import { revalidatePath } from 'next/cache';
import { playlists, requireActor, runAction, type PlaylistInput } from '@tunetracker/backend';

export async function createPlaylistAction(input: PlaylistInput, addTrackId?: string) {
  return runAction(async () => {
    const me = await requireActor();
    const p = await playlists.createPlaylist(me.id, input);
    if (addTrackId) await playlists.addTrack(me.id, p.id, addTrackId);
    revalidatePath('/studio');
    return { id: p.id };
  });
}

export async function updatePlaylistAction(id: string, input: PlaylistInput) {
  return runAction(async () => {
    await playlists.updatePlaylist((await requireActor()).id, id, input);
    revalidatePath(`/playlists/${id}`);
  });
}

export async function deletePlaylistAction(id: string) {
  return runAction(async () => {
    await playlists.deletePlaylist((await requireActor()).id, id);
    revalidatePath('/studio');
  });
}

export async function setPlaylistTrackAction(id: string, trackId: string, add: boolean) {
  return runAction(async () => {
    const me = await requireActor();
    if (add) await playlists.addTrack(me.id, id, trackId);
    else await playlists.removeTrack(me.id, id, trackId);
    revalidatePath(`/playlists/${id}`);
  });
}

export async function movePlaylistTrackAction(id: string, trackId: string, direction: 'up' | 'down') {
  return runAction(async () => {
    await playlists.moveTrack((await requireActor()).id, id, trackId, direction);
    revalidatePath(`/playlists/${id}`);
  });
}
