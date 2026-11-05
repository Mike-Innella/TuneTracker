'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Button as PressButton } from '@animate-ui/react/primitives/buttons/button';
import { motionTokens } from '@animate-ui/react/utils/motion';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';
import { usePlayer, type PlayerTrack } from '@/providers/player-provider';

const HIDDEN = { opacity: 0, scale: motionTokens.scale.icon, filter: motionTokens.blur.icon };
const SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' };

/**
 * An embedded remote for the app-wide player (PlayerProvider): one audio element, so starting
 * one track pauses any other and playback continues across navigation in the mini player.
 */
export function AudioPlayer({
  id,
  src,
  title,
  durationSec,
  artist,
  artworkUrl,
  trackId,
  queue,
  className,
}: {
  /** stable identity; defaults to the src path */
  id?: string;
  src: string | null;
  title: string;
  durationSec?: number | null;
  artist?: string | null;
  artworkUrl?: string | null;
  /** published track id: listens are counted */
  trackId?: string;
  /** the list this track sits in, so next/previous work */
  queue?: PlayerTrack[];
  className?: string;
}) {
  const player = usePlayer();
  const key = id ?? trackId ?? src?.split('?')[0] ?? title;
  const isCurrent = player.current?.id === key;
  const playing = isCurrent && player.playing;
  const time = isCurrent ? player.time : 0;
  const duration = (isCurrent && player.duration) || durationSec || 0;
  const error = !src ? 'Audio unavailable' : isCurrent ? player.error : null;

  function toggle() {
    if (!src) return;
    if (isCurrent) player.toggle();
    else player.play({ id: key, src, title, durationSec, artist, artworkUrl, trackId }, queue);
  }

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div
      className={cn('flex items-center gap-3 rounded-md border border-border bg-stock-2 p-2.5', className)}
      data-testid="audio-player"
      data-current={isCurrent || undefined}
    >
      <PressButton
        type="button"
        onClick={toggle}
        disabled={!src}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="action-gradient grid size-10 shrink-0 place-items-center overflow-hidden rounded-full shadow-(--shadow-sheet) disabled:opacity-50"
      >
        <PlayPauseIcon playing={playing} />
      </PressButton>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <span className="type-figure w-10 text-xs text-muted-foreground" data-testid="audio-time">
              {formatDuration(time)}
            </span>
            <SeekBar
              title={title}
              time={time}
              duration={duration}
              pct={pct}
              disabled={!isCurrent}
              onSeek={player.seek}
            />
            <span className="type-figure w-10 text-right text-xs text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Play and pause trade places through a light blur (Animate UI swap tokens). */
export function PlayPauseIcon({ playing, size = 'size-4' }: { playing: boolean; size?: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={playing ? 'pause' : 'play'}
        className="grid place-items-center"
        initial={HIDDEN}
        animate={SHOWN}
        exit={{ ...HIDDEN, transition: motionTokens.transition.swap }}
        transition={motionTokens.transition.swap}
      >
        {playing ? (
          <Pause className={size} aria-hidden />
        ) : (
          <Play className={cn(size, 'translate-x-px')} aria-hidden />
        )}
      </motion.span>
    </AnimatePresence>
  );
}

export function SeekBar({
  title,
  time,
  duration,
  pct,
  disabled,
  onSeek,
}: {
  title: string;
  time: number;
  duration: number;
  pct: number;
  disabled?: boolean;
  onSeek: (sec: number) => void;
}) {
  return (
    <div className="relative h-5 flex-1 rounded-full has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" aria-hidden />
      <div
        className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full"
        style={{ width: `${pct}%`, backgroundImage: 'var(--gradient-light)' }}
        aria-hidden
      />
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={time}
        disabled={disabled}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label={`Seek ${title}`}
        aria-valuetext={`${formatDuration(time)} of ${formatDuration(duration)}`}
        className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-default"
      />
    </div>
  );
}
