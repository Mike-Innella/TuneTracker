'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Play, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicTrack } from '@tunetracker/backend';
import { TrackList, toPlayerTrack } from '@/components/tracks/track-list';
import { Button } from '@/components/ui/button';
import { movePlaylistTrackAction, setPlaylistTrackAction } from '@/features/playlists/actions';
import { usePlayer } from '@/providers/player-provider';

/** The playlist's tracks; its owner gets Move up / Move down / Remove on each row. */
export function PlaylistView({ id, tracks, isMine }: { id: string; tracks: PublicTrack[]; isMine: boolean }) {
  const router = useRouter();
  const player = usePlayer();
  const [pending, start] = useTransition();
  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await p;
      if (!r.ok) toast.error(r.error ?? 'Something went wrong');
      router.refresh();
    });
  const queue = tracks.map(toPlayerTrack);
  const icon =
    'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30';
  return (
    <>
      <Button
        className="mb-6"
        disabled={!queue.some((q) => q.src)}
        onClick={() => {
          const first = queue.find((q) => q.src);
          if (first) player.play(first, queue);
        }}
      >
        <Play aria-hidden /> Play all
      </Button>
      <TrackList
        tracks={tracks}
        showArtist
        actions={
          isMine
            ? (t, i) => (
                <span className="flex">
                  <button
                    type="button"
                    className={icon}
                    aria-label={`Move ${t.title} up`}
                    disabled={pending || i === 0}
                    onClick={() => run(movePlaylistTrackAction(id, t.id, 'up'))}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={icon}
                    aria-label={`Move ${t.title} down`}
                    disabled={pending || i === tracks.length - 1}
                    onClick={() => run(movePlaylistTrackAction(id, t.id, 'down'))}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={icon}
                    aria-label={`Remove ${t.title} from playlist`}
                    disabled={pending}
                    onClick={() => run(setPlaylistTrackAction(id, t.id, false))}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              )
            : undefined
        }
      />
    </>
  );
}
