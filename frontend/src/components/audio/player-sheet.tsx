'use client';

import Link from 'next/link';
import { Button as PressButton } from '@animate-ui/react/primitives/buttons/button';
import { SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { usePlayer } from '@/providers/player-provider';
import { PlayPauseIcon, SeekBar } from './audio-player';

/**
 * Expanded player: full controls and the queue. Reads the same PlayerProvider as the mini-player,
 * so both always show one state; opening or closing it never touches playback.
 */
export function PlayerSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const p = usePlayer();
  const t = p.current;
  if (!t) return null;
  const pct = p.duration > 0 ? (p.time / p.duration) * 100 : 0;
  const upNext = p.queue.slice(p.index + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-testid="player-sheet"
        className="max-h-[100dvh] overflow-y-auto overscroll-contain rounded-t-xl bg-stock-2 px-5 pt-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-8"
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-[minmax(0,1fr)] gap-5">
          <ProjectArtwork
            title={t.title}
            url={t.artworkUrl}
            className="mx-auto aspect-square w-full max-w-[min(20rem,42dvh)] rounded-lg text-3xl"
          />
          <div className="min-w-0 text-center">
            <SheetTitle className="truncate text-lg">
              {t.trackId ? (
                <Link
                  href={`/tracks/${t.trackId}`}
                  onClick={() => onOpenChange(false)}
                  className="hover:underline"
                >
                  {t.title}
                </Link>
              ) : (
                t.title
              )}
            </SheetTitle>
            <SheetDescription className="truncate" aria-live="polite">
              {p.error ?? (p.buffering ? 'Loading…' : (t.artist ?? ''))}
            </SheetDescription>
          </div>

          <div>
            <SeekBar title={t.title} time={p.time} duration={p.duration} pct={pct} onSeek={p.seek} />
            <div className="type-figure flex justify-between text-xs text-muted-foreground">
              <span data-testid="sheet-time">{formatDuration(p.time)}</span>
              <span>{formatDuration(p.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <Round label="Previous" onClick={p.previous}>
              <SkipBack className="size-5" aria-hidden />
            </Round>
            <PressButton
              type="button"
              onClick={p.toggle}
              aria-label={p.playing ? `Pause ${t.title}` : `Play ${t.title}`}
              className="action-gradient grid size-16 place-items-center overflow-hidden rounded-full"
            >
              <PlayPauseIcon playing={p.playing} />
            </PressButton>
            <Round label="Next" onClick={p.next} disabled={p.index >= p.queue.length - 1}>
              <SkipForward className="size-5" aria-hidden />
            </Round>
          </div>

          <div className="flex items-center gap-3">
            <Round label={p.muted ? 'Unmute' : 'Mute'} onClick={p.toggleMute}>
              {p.muted ? (
                <VolumeX className="size-5" aria-hidden />
              ) : (
                <Volume2 className="size-5" aria-hidden />
              )}
            </Round>
            {/* touch devices: iOS ignores audio.volume, and phones have hardware volume keys */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={p.muted ? 0 : p.volume}
              onChange={(e) => p.setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="flex-1 accent-(--color-electric) pointer-coarse:hidden"
            />
          </div>

          {upNext.length > 0 && (
            <section aria-labelledby="up-next">
              <h2 id="up-next" className="type-role mb-2 text-muted-foreground">
                Up next
              </h2>
              <ol className="grid gap-1">
                {upNext.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => p.play(q, p.queue)}
                      className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    >
                      <ProjectArtwork
                        title={q.title}
                        url={q.artworkUrl}
                        className="size-9 rounded-sm text-[10px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{q.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{q.artist ?? ''}</span>
                      </span>
                      <span className="type-figure text-xs text-muted-foreground">
                        {q.durationSec ? formatDuration(q.durationSec) : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Round({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactElement;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <PressButton
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
    >
      {children}
    </PressButton>
  );
}
