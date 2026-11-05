'use client';

import Link from 'next/link';
import type { PublicTrack } from '@tunetracker/backend';
import { Button as PressButton } from '@animate-ui/react/primitives/buttons/button';
import { PlayPauseIcon } from '@/components/audio/audio-player';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { usePlayer, type PlayerTrack } from '@/providers/player-provider';

export const toPlayerTrack = (t: PublicTrack): PlayerTrack => ({
  id: t.id,
  trackId: t.id,
  title: t.title,
  artist: t.owner.displayName,
  artworkUrl: t.artworkUrl,
  src: t.audioUrl,
  durationSec: t.durationSec,
});

/** Numbered track rows, like an album's back cover. Playing one queues the whole list. */
export function TrackList({ tracks, showArtist = false }: { tracks: PublicTrack[]; showArtist?: boolean }) {
  const player = usePlayer();
  const queue = tracks.map(toPlayerTrack);
  return (
    <ol
      className="divide-y divide-border rounded-md border border-border bg-stock-2"
      data-testid="track-list"
    >
      {tracks.map((t, i) => {
        const current = player.current?.id === t.id;
        const playing = current && player.playing;
        return (
          <li
            key={t.id}
            className={cn('flex items-center gap-3 p-2.5', current && 'bg-muted/60')}
            data-testid="track-row"
          >
            <PressButton
              type="button"
              disabled={!t.audioUrl}
              onClick={() => (current ? player.toggle() : player.play(queue[i]!, queue))}
              aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
              className={cn(
                'grid size-9 shrink-0 place-items-center overflow-hidden rounded-full disabled:opacity-40',
                current ? 'action-gradient' : 'bg-muted hover:bg-accent',
              )}
            >
              <PlayPauseIcon playing={playing} size="size-3.5" />
            </PressButton>
            <span className="type-figure w-5 text-right text-xs text-muted-foreground" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/tracks/${t.id}`} className="block truncate font-medium hover:underline">
                {t.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {showArtist && <>{t.owner.displayName} · </>}
                {t.status === 'DRAFT' && <span className="text-warning">Draft · </span>}
                {t.status === 'PUBLISHED' && t.visibility === 'PRIVATE' && <>Private · </>}
                {t.kind === 'SAMPLE' ? 'Sample' : (t.genre ?? 'Track')}
              </p>
            </div>
            <span className="type-figure hidden text-xs text-muted-foreground sm:inline" title="Plays">
              {t.playCount.toLocaleString()} plays
            </span>
            <span className="type-figure w-10 text-right text-xs text-muted-foreground">
              {formatDuration(t.durationSec ?? 0)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
