'use client';

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { recordPlayAction } from '@/features/tracks/actions';

export type PlayerTrack = {
  /** stable id: a Track id, or an attachment id for private files */
  id: string;
  title: string;
  artist?: string | null;
  artworkUrl?: string | null;
  src: string | null;
  durationSec?: number | null;
  /** set for published tracks so listens are counted; omitted for private attachments */
  trackId?: string;
};

type PlayerState = {
  current: PlayerTrack | null;
  queue: PlayerTrack[];
  index: number;
  playing: boolean;
  buffering: boolean;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  error: string | null;
};

type PlayerApi = PlayerState & {
  /** play a track now; pass the list it belongs to so next/previous work */
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  toggle: () => void;
  pause: () => void;
  seek: (sec: number) => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  clear: () => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);
const COUNT_AFTER_SEC = 10;

/**
 * The only audio element in the app. Lives in the root layout, so playback survives navigation;
 * every embedded player and the mini/expanded players drive this one controller.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const counted = useRef<string | null>(null);
  const [state, setState] = useState<PlayerState>({
    current: null,
    queue: [],
    index: -1,
    playing: false,
    buffering: false,
    time: 0,
    duration: 0,
    volume: 1,
    muted: false,
    error: null,
  });
  const patch = useCallback((p: Partial<PlayerState>) => setState((s) => ({ ...s, ...p })), []);

  const load = useCallback(
    (track: PlayerTrack, queue: PlayerTrack[], index: number) => {
      const a = audioRef.current;
      if (!a) return;
      counted.current = null;
      setState((s) => ({
        ...s,
        current: track,
        queue,
        index,
        time: 0,
        duration: track.durationSec ?? 0,
        error: track.src ? null : 'This track is unavailable',
        buffering: !!track.src,
      }));
      if (!track.src) return;
      a.src = track.src;
      a.play().catch(() =>
        patch({ playing: false, buffering: false, error: 'This browser can’t play this file' }),
      );
    },
    [patch],
  );

  const { current, queue: list, index } = state;
  const api = useMemo<Omit<PlayerApi, keyof PlayerState>>(
    () => ({
      play: (track, queue) => {
        const a = audioRef.current;
        if (!a) return;
        const q = queue && queue.some((t) => t.id === track.id) ? queue : [track];
        // same track: resume instead of restarting
        if (current?.id === track.id && current.src === track.src) {
          void a.play().catch(() => {});
          return;
        }
        load(
          track,
          q,
          q.findIndex((t) => t.id === track.id),
        );
      },
      toggle: () => {
        const a = audioRef.current;
        if (!a || !current?.src) return;
        if (a.paused) void a.play().catch(() => {});
        else a.pause();
      },
      pause: () => audioRef.current?.pause(),
      seek: (sec) => {
        const a = audioRef.current;
        if (a && Number.isFinite(sec)) a.currentTime = Math.max(0, Math.min(sec, a.duration || sec));
      },
      next: () => {
        const n = list[index + 1];
        if (n) load(n, list, index + 1);
      },
      previous: () => {
        const a = audioRef.current;
        // like every player: past 3 s, "previous" restarts the current track
        if (a && a.currentTime > 3) a.currentTime = 0;
        else {
          const p = list[index - 1];
          if (p) load(p, list, index - 1);
        }
      },
      setVolume: (v) => {
        const a = audioRef.current;
        if (!a) return;
        a.volume = Math.max(0, Math.min(1, v));
        a.muted = a.volume === 0;
      },
      toggleMute: () => {
        const a = audioRef.current;
        if (a) a.muted = !a.muted;
      },
      clear: () => {
        const a = audioRef.current;
        if (a) {
          a.pause();
          a.removeAttribute('src');
          a.load();
        }
        patch({ current: null, queue: [], index: -1, playing: false, time: 0, duration: 0, error: null });
      },
    }),
    [current, list, index, load, patch],
  );

  // Media Session: lock screen, headset and keyboard media keys
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist ?? 'TuneTracker',
      artwork: current.artworkUrl ? [{ src: current.artworkUrl, sizes: '512x512' }] : [],
    });
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {
        // unsupported action in this browser
      }
    };
    set('play', () => void audioRef.current?.play());
    set('pause', () => audioRef.current?.pause());
    set('nexttrack', index < list.length - 1 ? api.next : null);
    set('previoustrack', api.previous);
    set('seekto', (d) => d.seekTime != null && api.seek(d.seekTime));
    set('seekbackward', (d) => api.seek((audioRef.current?.currentTime ?? 0) - (d.seekOffset ?? 10)));
    set('seekforward', (d) => api.seek((audioRef.current?.currentTime ?? 0) + (d.seekOffset ?? 10)));
  }, [current, index, list.length, api]);

  // lock-screen scrubber + play/pause icon: synced on play/pause/seek/duration; the OS extrapolates time
  const { playing, duration } = state;
  const syncPosition = useCallback(() => {
    const a = audioRef.current;
    if (!('mediaSession' in navigator) || !a || !(a.duration > 0) || !Number.isFinite(a.duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: a.duration,
        position: Math.min(a.currentTime, a.duration),
        playbackRate: a.playbackRate,
      });
    } catch {
      // older Safari: setPositionState missing or strict about values
    }
  }, []);
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    syncPosition();
  }, [current, playing, duration, syncPosition]);

  const onTime = (a: HTMLAudioElement) => {
    patch({ time: a.currentTime });
    const t = state.current;
    if (
      t?.trackId &&
      counted.current !== t.trackId &&
      a.currentTime >= Math.min(COUNT_AFTER_SEC, (a.duration || 20) / 2)
    ) {
      counted.current = t.trackId;
      void recordPlayAction(t.trackId);
    }
  };

  return (
    <PlayerContext value={{ ...state, ...api }}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => patch({ playing: true, error: null })}
        onPause={() => patch({ playing: false })}
        onWaiting={() => patch({ buffering: true })}
        onPlaying={() => patch({ buffering: false })}
        onCanPlay={() => patch({ buffering: false })}
        onTimeUpdate={(e) => onTime(e.currentTarget)}
        onSeeked={syncPosition}
        onLoadedMetadata={(e) =>
          Number.isFinite(e.currentTarget.duration) && patch({ duration: e.currentTarget.duration })
        }
        onVolumeChange={(e) => patch({ volume: e.currentTarget.volume, muted: e.currentTarget.muted })}
        onEnded={() => {
          const n = state.queue[state.index + 1];
          if (n) load(n, state.queue, state.index + 1);
          else patch({ playing: false });
        }}
        onError={() =>
          state.current?.src &&
          patch({ playing: false, buffering: false, error: 'This track can’t be played right now' })
        }
      />
    </PlayerContext>
  );
}

export function usePlayer() {
  const ctx = use(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
