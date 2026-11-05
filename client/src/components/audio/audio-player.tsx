'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/format';

/**
 * Native <audio> with designed controls. One player at a time: starting one pauses the others.
 * Codec support is the browser's; an unsupported file shows a clear error instead of silence.
 */
export function AudioPlayer({
  src,
  title,
  durationSec,
  className,
}: {
  src: string | null;
  title: string;
  durationSec?: number | null;
  className?: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [error, setError] = useState<string | null>(src ? null : 'Audio unavailable');

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== ref.current) ref.current?.pause();
    };
    window.addEventListener('tt:play', onOther);
    return () => window.removeEventListener('tt:play', onOther);
  }, []);

  async function toggle() {
    const a = ref.current;
    if (!a || error) return;
    if (a.paused) {
      window.dispatchEvent(new CustomEvent('tt:play', { detail: a }));
      try {
        await a.play();
      } catch {
        setError('This browser can’t play this file');
      }
    } else a.pause();
  }

  const pct = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div
      className={cn('flex items-center gap-3 rounded-md border border-border bg-stock-2 p-2.5', className)}
      data-testid="audio-player"
    >
      <button
        type="button"
        onClick={toggle}
        disabled={!!error}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="action-gradient grid size-10 shrink-0 place-items-center rounded-full shadow-(--shadow-sheet) transition-transform active:scale-95 disabled:opacity-50"
      >
        {playing ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Play className="size-4 translate-x-px" aria-hidden />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <span className="type-figure w-10 text-xs text-muted-foreground" data-testid="audio-time">
              {formatDuration(time)}
            </span>
            <div className="relative h-5 flex-1 rounded-full has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring">
              <div
                className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted"
                aria-hidden
              />
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
                onChange={(e) => {
                  const t = Number(e.target.value);
                  if (ref.current) ref.current.currentTime = t;
                  setTime(t);
                }}
                aria-label={`Seek ${title}`}
                aria-valuetext={`${formatDuration(time)} of ${formatDuration(duration)}`}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="type-figure w-10 text-right text-xs text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </div>
        )}
      </div>
      {src && (
        <audio
          ref={ref}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) =>
            Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)
          }
          onError={() => setError('This browser can’t play this file')}
        />
      )}
    </div>
  );
}
