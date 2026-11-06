'use client';

import Link from 'next/link';
import type { PublicTrack } from '@tunetracker/backend';
import { Button as PressButton } from '@animate-ui/react/primitives/buttons/button';
import { PlayPauseIcon } from '@/components/audio/audio-player';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { usePlayer } from '@/providers/player-provider';
import { toPlayerTrack } from './track-list';

/** Sleeve-style cards; playing one queues the whole grid. Entrances stagger once (CSS, see .card-enter). */
export function TrackGrid({ tracks, className }: { tracks: PublicTrack[]; className?: string }) {
  const player = usePlayer();
  const queue = tracks.map(toPlayerTrack);
  return (
    <ul
      className={cn('grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4', className)}
      data-testid="track-grid"
    >
      {tracks.map((t, i) => {
        const current = player.current?.id === t.id;
        const playing = current && player.playing;
        return (
          <li
            key={t.id}
            className="card-enter group min-w-0"
            style={{ '--i': i } as React.CSSProperties}
            data-testid="track-card"
          >
            <div className="relative aspect-square overflow-hidden rounded-md border border-rule">
              <ProjectArtwork
                title={t.title}
                url={t.artworkUrl}
                className="size-full rounded-none border-0 text-4xl"
              />
              <PressButton
                type="button"
                disabled={!t.audioUrl}
                onClick={() => (current ? player.toggle() : player.play(queue[i]!, queue))}
                aria-label={playing ? `Pause ${t.title}` : `Play ${t.title}`}
                className={cn(
                  'action-gradient absolute right-2 bottom-2 grid size-11 place-items-center overflow-hidden rounded-full shadow-(--shadow-sheet) transition-opacity disabled:opacity-40',
                  !current &&
                    '[@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100',
                )}
              >
                <PlayPauseIcon playing={playing} />
              </PressButton>
              {t.kind === 'SAMPLE' && (
                <span className="type-role absolute top-2 left-2 rounded-sm bg-background/85 px-1.5 py-0.5 text-[0.65rem]">
                  Sample
                </span>
              )}
            </div>
            <Link href={`/tracks/${t.id}`} className="mt-2 block truncate font-medium hover:underline">
              {t.title}
            </Link>
            <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
              <Link
                href={`/artists/${t.owner.username}`}
                className="inline-flex min-h-6 min-w-0 items-center truncate hover:text-foreground"
              >
                {t.owner.displayName}
              </Link>
              <span className="credit-leader" aria-hidden />
              <span className="type-figure">{formatDuration(t.durationSec ?? 0)}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
