import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { Box, Button, Slider, Stack, Typography } from '@mui/material';
import { mutedTextSx, wrapAnywhereSx } from '../../../app/theme/uiStyles';
import InlineNotice from '../../../shared/ui/InlineNotice';

let activeAudioElement: HTMLAudioElement | null = null;

type TrackAudioPlayerProps = {
  audioUrl?: string | null;
};

type TrackAudioPlayerInnerProps = {
  audioUrl?: string | null;
};

function formatTime(totalSeconds: number | null) {
  if (totalSeconds === null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '--:--';
  }

  const rounded = Math.floor(totalSeconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function TrackAudioPlayerInner({ audioUrl }: TrackAudioPlayerInnerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAudio = Boolean(audioUrl?.trim());
  const sliderMax = duration && duration > 0 ? duration : 0;

  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
    },
    []
  );

  async function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;

    if (isPlaying) {
      audio.pause();
      return;
    }

    if (activeAudioElement && activeAudioElement !== audio) {
      activeAudioElement.pause();
    }

    setError(null);
    setIsLoading(true);

    try {
      await audio.play();
      activeAudioElement = audio;
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Playback failed in this browser.');
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
    }
  }

  function handleSeekChange(_event: Event, value: number | number[]) {
    if (Array.isArray(value)) return;
    setIsSeeking(true);
    setCurrentTime(value);
  }

  function handleSeekCommit(_event: Event | SyntheticEvent, value: number | number[]) {
    if (Array.isArray(value)) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
    setIsSeeking(false);
  }

  function handleVolumeChange(_event: Event, value: number | number[]) {
    if (Array.isArray(value)) return;
    const audio = audioRef.current;
    const nextVolume = Math.min(1, Math.max(0, value / 100));
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
    if (audio) {
      audio.volume = nextVolume;
      audio.muted = nextVolume === 0;
    }
  }

  function toggleMuted() {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !muted;
    setMuted(nextMuted);
    audio.muted = nextMuted;

    if (!nextMuted && audio.volume === 0) {
      audio.volume = 0.5;
      setVolume(0.5);
    }
  }

  return (
    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.25}
      >
        <Button
          variant={isPlaying ? 'outlined' : 'contained'}
          size="small"
          onClick={() => {
            void handlePlayPause();
          }}
          disabled={!hasAudio || isLoading}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {!hasAudio ? 'No Audio' : isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
        </Button>

        <Typography variant="body2" sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Stack>

      {!hasAudio && (
        <Typography variant="body2" sx={mutedTextSx}>
          No audio available for this track.
        </Typography>
      )}

      {hasAudio && (
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Slider
            value={sliderMax > 0 ? Math.min(currentTime, sliderMax) : 0}
            min={0}
            max={sliderMax}
            step={0.1}
            onChange={handleSeekChange}
            onChangeCommitted={handleSeekCommit}
            disabled={!sliderMax || isLoading}
            sx={{
              py: 0.5,
              '& .MuiSlider-track': {
                border: 0,
              },
              '& .MuiSlider-rail': {
                opacity: 0.25,
              },
            }}
          />
        </Box>
      )}

      {hasAudio && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1.25}
          sx={{ width: '100%', maxWidth: 420 }}
        >
          <Button
            size="small"
            variant="text"
            onClick={toggleMuted}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {muted || volume === 0 ? 'Unmute' : 'Mute'}
          </Button>
          <Slider
            value={Math.round(volume * 100)}
            min={0}
            max={100}
            step={1}
            onChange={handleVolumeChange}
            sx={{
              width: '100%',
              maxWidth: { sm: 180 },
              '& .MuiSlider-track': {
                border: 0,
              },
              '& .MuiSlider-rail': {
                opacity: 0.25,
              },
            }}
          />
          <Typography variant="body2" sx={mutedTextSx}>
            Vol {Math.round(volume * 100)}%
          </Typography>
        </Stack>
      )}

      {error && <InlineNotice severity="error">{error}</InlineNotice>}

      <audio
        ref={audioRef}
        src={hasAudio ? audioUrl ?? undefined : undefined}
        preload="metadata"
        controls={false}
        controlsList="nodownload noplaybackrate"
        style={{ display: 'none' }}
        onVolumeChange={(event) => {
          const nextVolume = event.currentTarget.volume;
          const nextMuted = event.currentTarget.muted;
          setVolume(Number.isFinite(nextVolume) ? nextVolume : 1);
          setMuted(nextMuted);
        }}
        onLoadStart={() => {
          if (hasAudio) {
            setIsLoading(true);
          }
        }}
        onPlay={(event) => {
          if (activeAudioElement && activeAudioElement !== event.currentTarget) {
            activeAudioElement.pause();
          }
          activeAudioElement = event.currentTarget;
        }}
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) && nextDuration > 0 ? nextDuration : null);
          setIsLoading(false);
        }}
        onCanPlay={() => {
          setIsLoading(false);
        }}
        onWaiting={() => {
          setIsLoading(true);
        }}
        onTimeUpdate={(event) => {
          if (!isSeeking) {
            setCurrentTime(event.currentTarget.currentTime);
          }
        }}
        onPlaying={(event) => {
          setIsPlaying(true);
          setIsLoading(false);
          activeAudioElement = event.currentTarget;
        }}
        onPause={(event) => {
          setIsPlaying(false);
          setIsLoading(false);
          if (activeAudioElement === event.currentTarget) {
            activeAudioElement = null;
          }
        }}
        onEnded={(event) => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (activeAudioElement === event.currentTarget) {
            activeAudioElement = null;
          }
        }}
        onError={(event) => {
          setIsPlaying(false);
          setIsLoading(false);
          setError('Audio source is unavailable.');
          if (activeAudioElement === event.currentTarget) {
            activeAudioElement = null;
          }
        }}
      />
    </Stack>
  );
}

export default function TrackAudioPlayer({ audioUrl }: TrackAudioPlayerProps) {
  return <TrackAudioPlayerInner key={audioUrl ?? 'no-audio'} audioUrl={audioUrl} />;
}
