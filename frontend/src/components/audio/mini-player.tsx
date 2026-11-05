'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Button as PressButton } from '@animate-ui/react/primitives/buttons/button';
import { motionTokens } from '@animate-ui/react/utils/motion';
import { SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { formatDuration } from '@/lib/format';
import { usePlayer } from '@/providers/player-provider';
import { PlayPauseIcon, SeekBar } from './audio-player';

/**
 * Docked player for whatever is playing; survives navigation because it lives in the root layout.
 * Sits above the mobile bottom nav (--bottom-nav-h) and announces track changes politely.
 */
export function MiniPlayer() {
  const p = usePlayer();
  const t = p.current;
  const pct = p.duration > 0 ? (p.time / p.duration) * 100 : 0;
  return (
    <AnimatePresence>
      {t && (
        <motion.section
          aria-label="Now playing"
          data-testid="mini-player"
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '110%', opacity: 0, transition: motionTokens.transition.dismiss }}
          transition={motionTokens.spring.toast}
          className="fixed inset-x-2 bottom-[calc(var(--bottom-nav-h,0px)+0.5rem)] z-40 mx-auto max-w-3xl rounded-lg border border-border bg-stock-2/95 p-2 shadow-(--shadow-sheet) backdrop-blur md:inset-x-4"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {t.artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- public bucket URL, already sized
              <img src={t.artworkUrl} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
            ) : (
              <div className="action-gradient size-10 shrink-0 rounded-sm" aria-hidden />
            )}
            <div className="min-w-0 flex-1" aria-live="polite">
              {t.trackId ? (
                <Link
                  href={`/tracks/${t.trackId}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {t.title}
                </Link>
              ) : (
                <p className="truncate text-sm font-medium">{t.title}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {p.error ?? (p.buffering ? 'Loading…' : (t.artist ?? ''))}
              </p>
            </div>
            <IconBtn label="Previous" onClick={p.previous} className="max-sm:hidden">
              <SkipBack className="size-4" aria-hidden />
            </IconBtn>
            <PressButton
              type="button"
              onClick={p.toggle}
              aria-label={p.playing ? `Pause ${t.title}` : `Play ${t.title}`}
              className="action-gradient grid size-10 shrink-0 place-items-center overflow-hidden rounded-full"
            >
              <PlayPauseIcon playing={p.playing} />
            </PressButton>
            <IconBtn label="Next" onClick={p.next} disabled={p.index >= p.queue.length - 1}>
              <SkipForward className="size-4" aria-hidden />
            </IconBtn>
            <IconBtn label={p.muted ? 'Unmute' : 'Mute'} onClick={p.toggleMute} className="max-sm:hidden">
              {p.muted ? (
                <VolumeX className="size-4" aria-hidden />
              ) : (
                <Volume2 className="size-4" aria-hidden />
              )}
            </IconBtn>
            <IconBtn label="Close player" onClick={p.clear}>
              <X className="size-4" aria-hidden />
            </IconBtn>
          </div>
          <div className="mt-1 flex items-center gap-2 px-1">
            <span className="type-figure w-10 text-[11px] text-muted-foreground" data-testid="mini-time">
              {formatDuration(p.time)}
            </span>
            <SeekBar title={t.title} time={p.time} duration={p.duration} pct={pct} onSeek={p.seek} />
            <span className="type-figure w-10 text-right text-[11px] text-muted-foreground">
              {formatDuration(p.duration)}
            </span>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function IconBtn({
  label,
  children,
  className,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactElement;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <PressButton
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 ${className ?? ''}`}
    >
      {children}
    </PressButton>
  );
}
