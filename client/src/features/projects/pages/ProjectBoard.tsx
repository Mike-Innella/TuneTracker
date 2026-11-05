import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useParams } from 'react-router-dom';
import { http } from '../../../shared/api/http';
import {
  destructiveButtonSx,
  pageShellSx,
  panelSx,
  glowTitleSx,
  mutedTextSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';
import { getErrorMessage, getStatusCode } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';
import DroppableColumn from '../components/board/DroppableColumn';
import DraggableTrackCard from '../components/board/DraggableTrackCard';
import {
  getColumnIdFromStatus,
  getColumnsFromTracks,
  getStatusFromColumnId,
} from '../components/board/boardUtils';
import type {
  ColumnId,
  Project,
  Track,
  TrackStatus,
} from '../components/board/boardTypes';
import { COLUMN_IDS } from '../components/board/boardTypes';

const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav'];
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
]);
const BOARD_COLUMN_MIN_WIDTH = 320;
const BOARD_COLUMN_GAP_PX = 24;
const BOARD_EDGE_FADE_COLOR = '#050505';
const MAX_AUDIO_UPLOAD_SIZE_BYTES = 80 * 1024 * 1024;

function getFileExtension(filename: string) {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

async function uploadTrackAudio(projectId: string, trackId: string, file: File) {
  await http.put(`/projects/${projectId}/tracks/${trackId}/audio`, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
  });
}

async function readAudioDurationInSeconds(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const audio = document.createElement('audio');

      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          reject(new Error('Invalid audio duration'));
          return;
        }

        resolve(Math.round(audio.duration));
      };
      audio.onerror = () => reject(new Error('Failed to read audio metadata'));
      audio.src = objectUrl;
    });

    return duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ProjectBoard() {
  const theme = useTheme();
  const isPhoneBoard = useMediaQuery(theme.breakpoints.down('sm'));
  const isTabletBoard = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackKey, setTrackKey] = useState('');
  const [trackBpm, setTrackBpm] = useState('');
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackLengthSec, setTrackLengthSec] = useState<number | null>(null);
  const [addTrackError, setAddTrackError] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activeTrackSize, setActiveTrackSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadBoard = useCallback(async () => {
    if (!projectId) {
      setError('Missing project id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectRes = await http.get(`/projects/${projectId}`);
      const nextProject = (projectRes.data?.data ?? projectRes.data) as Project;
      setProject(nextProject);

      const embeddedTracks = Array.isArray(nextProject?.tracks)
        ? nextProject.tracks
        : [];
      setTracks(embeddedTracks);

      try {
        const tracksRes = await http.get(`/projects/${projectId}/tracks`);
        const nextTracks = Array.isArray(tracksRes.data?.data)
          ? tracksRes.data.data
          : Array.isArray(tracksRes.data?.tracks)
            ? tracksRes.data.tracks
            : Array.isArray(tracksRes.data)
              ? tracksRes.data
              : embeddedTracks;

        setTracks(nextTracks);
      } catch (trackError: unknown) {
        const status = getStatusCode(trackError);
        if (status && status !== 404) {
          setError(getErrorMessage(trackError, 'Failed to load tracks'));
        }
      }
    } catch (error: unknown) {
      setProject(null);
      setTracks([]);

      const status = getStatusCode(error);
      if (status === 404) {
        setError('Project not found');
      } else if (status === 403) {
        setError('You do not have access to this project');
      } else {
        setError(getErrorMessage(error, 'Failed to load project'));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const columns = useMemo(() => getColumnsFromTracks(tracks), [tracks]);
  const activeTrack = useMemo(
    () => tracks.find((track) => track.id === activeTrackId) ?? null,
    [tracks, activeTrackId]
  );
  const isProjectPublic = project?.visibility?.toUpperCase() === 'PUBLIC';
  const boardColumnsPerRow = isPhoneBoard ? 1 : isTabletBoard ? Math.min(columns.length, 2) : columns.length;
  const boardGridTemplateColumns = `repeat(${Math.max(boardColumnsPerRow, 1)}, minmax(0, 1fr))`;
  const boardUsesHorizontalScroll = !isPhoneBoard && !isTabletBoard;

  function clearActiveDrag() {
    setActiveTrackId(null);
    setActiveTrackSize(null);
  }

  function closeAddTrackDialog(force = false) {
    if (creatingTrack && !force) return;
    setAddTrackOpen(false);
    setTrackTitle('');
    setTrackKey('');
    setTrackBpm('');
    setTrackFile(null);
    setTrackLengthSec(null);
    setAddTrackError(null);
  }

  async function handleTrackFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!nextFile) {
      setTrackFile(null);
      setTrackLengthSec(null);
      setAddTrackError(null);
      return;
    }

    const ext = getFileExtension(nextFile.name);
    const validType =
      ALLOWED_AUDIO_MIME_TYPES.has(nextFile.type) ||
      ALLOWED_AUDIO_EXTENSIONS.includes(ext);

    if (!validType) {
      setTrackFile(null);
      setTrackLengthSec(null);
      setAddTrackError('Only .wav or .mp3 files are allowed.');
      return;
    }

    if (nextFile.size > MAX_AUDIO_UPLOAD_SIZE_BYTES) {
      setTrackFile(null);
      setTrackLengthSec(null);
      setAddTrackError('Audio file is too large. Max upload size is 80MB.');
      return;
    }

    try {
      const duration = await readAudioDurationInSeconds(nextFile);
      setTrackFile(nextFile);
      setTrackLengthSec(duration);
      setAddTrackError(null);
    } catch {
      setTrackFile(null);
      setTrackLengthSec(null);
      setAddTrackError('Could not read the uploaded audio file.');
    }
  }

  async function handleAddTrack() {
    if (!projectId) return;

    const trimmedTitle = trackTitle.trim();
    if (!trimmedTitle) {
      setAddTrackError('Track title is required.');
      return;
    }

    const parsedBpm =
      trackBpm.trim() === '' ? undefined : Number.parseInt(trackBpm.trim(), 10);
    if (
      parsedBpm !== undefined &&
      (!Number.isFinite(parsedBpm) || parsedBpm < 1 || parsedBpm > 400)
    ) {
      setAddTrackError('BPM must be a number from 1 to 400.');
      return;
    }

    setCreatingTrack(true);
    setError(null);
    setAddTrackError(null);

    try {
      const createdRes = await http.post(`/projects/${projectId}/tracks`, {
        title: trimmedTitle,
        status: 'IDEA',
        ...(trackKey.trim() ? { key: trackKey.trim() } : {}),
        ...(parsedBpm !== undefined ? { bpm: parsedBpm } : {}),
      });

      const createdTrack = (createdRes.data?.data ?? createdRes.data) as
        | { id?: string }
        | undefined;

      if (trackFile && createdTrack?.id) {
        try {
          await uploadTrackAudio(projectId, createdTrack.id, trackFile);
        } catch (audioError: unknown) {
          const audioStatus = getStatusCode(audioError);
          const message =
            audioStatus === 413
              ? 'Track created, but audio upload is too large. Max upload size is 80MB.'
              : getErrorMessage(audioError, 'Track created, but audio upload failed.');
          setError(message);
          setAddTrackError(message);
          closeAddTrackDialog(true);
          await loadBoard();
          return;
        }
      }

      closeAddTrackDialog(true);
      await loadBoard();
    } catch (error: unknown) {
      const status = getStatusCode(error);
      const message =
        status === 413
          ? 'Audio file is too large. Max upload size is 80MB.'
          : getErrorMessage(error, 'Failed to add track');
      setError(message);
      setAddTrackError(message);
    } finally {
      setCreatingTrack(false);
    }
  }

  async function persistTrackStatus(trackId: string, status: TrackStatus) {
    if (!projectId) return;

    await http.patch(`/projects/${projectId}/tracks/${trackId}`, {
      status,
    });
  }

  async function handleDeleteTrack(trackId: string) {
    if (!projectId) return;

    const confirmed = window.confirm('Delete this track?');
    if (!confirmed) return;

    const previousTracks = tracks;
    setTracks(previousTracks.filter((track) => track.id !== trackId));
    setError(null);

    try {
      await http.delete(`/projects/${projectId}/tracks/${trackId}`);
    } catch (error: unknown) {
      setTracks(previousTracks);
      setError(getErrorMessage(error, 'Failed to delete track'));
    }
  }

  async function handleDeleteProject() {
    if (!projectId || deletingProject) return;

    const projectLabel = project?.title?.trim() || 'this project';
    const confirmed = window.confirm(`Delete ${projectLabel}?`);
    if (!confirmed) return;

    setDeletingProject(true);
    setError(null);

    try {
      await http.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete project'));
    } finally {
      setDeletingProject(false);
    }
  }

  async function handleVisibilityToggle() {
    if (!projectId || !project || deletingProject || updatingVisibility) return;

    const nextVisibility = isProjectPublic ? 'PRIVATE' : 'PUBLIC';

    setUpdatingVisibility(true);
    setError(null);

    try {
      const res = await http.patch(`/projects/${projectId}`, {
        visibility: nextVisibility,
      });
      const updatedProject = (res.data?.data ?? res.data) as Partial<Project>;

      setProject((prev) =>
        prev
          ? {
              ...prev,
              visibility:
                updatedProject.visibility && typeof updatedProject.visibility === 'string'
                  ? updatedProject.visibility
                  : nextVisibility,
            }
          : prev
      );
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update project visibility'));
    } finally {
      setUpdatingVisibility(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTrackId(String(event.active.id));
    const initialRect = event.active.rect.current.initial;
    if (!initialRect) {
      setActiveTrackSize(null);
      return;
    }

    setActiveTrackSize({
      width: initialRect.width,
      height: initialRect.height,
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    clearActiveDrag();

    if (!over) return;

    const activeTrackId = String(active.id);
    const targetColumnId = String(over.id) as ColumnId;

    if (!COLUMN_IDS.includes(targetColumnId)) return;

    const draggedTrack = tracks.find((track) => track.id === activeTrackId);
    if (!draggedTrack) return;

    const currentColumnId = getColumnIdFromStatus(draggedTrack.status);
    if (currentColumnId === targetColumnId) return;

    const nextStatus = getStatusFromColumnId(targetColumnId);

    const previousTracks = tracks;

    const optimisticTracks = tracks.map((track) =>
      track.id === activeTrackId
        ? {
            ...track,
            status: nextStatus,
          }
        : track
    );

    setTracks(optimisticTracks);
    setError(null);

    try {
      await persistTrackStatus(activeTrackId, nextStatus);
    } catch (error: unknown) {
      setTracks(previousTracks);
      setError(getErrorMessage(error, 'Failed to move track'));
    }
  }

  return (
    <Box sx={{ pb: 3 }}>
      <Box
        sx={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background:
            'linear-gradient(180deg, rgba(20, 20, 28, 0.96), rgba(15, 15, 22, 0.92))',
          backdropFilter: 'blur(14px)',
        }}
      >
        <Box className="page-wrap" sx={{ py: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{
              flexWrap: 'wrap',
              rowGap: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate('/projects')}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              ← Back
            </Button>

            <Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
              <Typography
                variant="h3"
                sx={{
                  ...glowTitleSx,
                  ...wrapAnywhereSx,
                  fontSize: { xs: 34, md: 48 },
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {project?.title || 'Project Board'}
              </Typography>

              <Typography sx={mutedTextSx}>
                {project?.description ||
                  `${tracks.length} track${tracks.length === 1 ? '' : 's'}`}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              <Typography variant="body2" sx={mutedTextSx}>
                {updatingVisibility ? 'Updating...' : isProjectPublic ? 'Public' : 'Private'}
              </Typography>
              <Switch
                size="small"
                checked={isProjectPublic}
                onChange={() => {
                  void handleVisibilityToggle();
                }}
                disabled={loading || deletingProject || updatingVisibility || !project}
                inputProps={{
                  'aria-label': `Toggle project visibility for ${project?.title || 'project'}`,
                }}
              />
            </Stack>

            <Button
              variant="contained"
              onClick={() => navigate(`/public/${projectId}`)}
              disabled={deletingProject || !isProjectPublic}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Public View
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box className="page-wrap" sx={[pageShellSx, { pt: 3 }]}>
        {loading && <InlineNotice loading>Loading project...</InlineNotice>}

        {error && <InlineNotice severity="error" sx={{ mb: 2 }}>{error}</InlineNotice>}

        {!loading && !project && !error && <InlineNotice>Project unavailable.</InlineNotice>}

        {project && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={clearActiveDrag}
          >
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: { xs: 36, md: 60 },
                  pointerEvents: 'none',
                  zIndex: 2,
                  display: boardUsesHorizontalScroll ? 'block' : 'none',
                },
                '&::before': {
                  left: 0,
                  background:
                    `linear-gradient(to right, ${alpha(BOARD_EDGE_FADE_COLOR, 0.88)} 0%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.78)} 10%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.62)} 24%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.42)} 40%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.25)} 58%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.13)} 74%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.05)} 88%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.015)} 96%, ${alpha(BOARD_EDGE_FADE_COLOR, 0)} 100%)`,
                },
                '&::after': {
                  right: 0,
                  background:
                    `linear-gradient(to left, ${alpha(BOARD_EDGE_FADE_COLOR, 0.88)} 0%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.78)} 10%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.62)} 24%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.42)} 40%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.25)} 58%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.13)} 74%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.05)} 88%, ${alpha(BOARD_EDGE_FADE_COLOR, 0.015)} 96%, ${alpha(BOARD_EDGE_FADE_COLOR, 0)} 100%)`,
                },
              }}
            >
              <Box
                sx={{
                  overflowX: boardUsesHorizontalScroll ? 'auto' : 'visible',
                  px: { xs: 0, sm: boardUsesHorizontalScroll ? 2.5 : 0, md: 4 },
                  pb: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: boardGridTemplateColumns,
                    minWidth: boardUsesHorizontalScroll
                      ? columns.length * BOARD_COLUMN_MIN_WIDTH +
                        (columns.length - 1) * BOARD_COLUMN_GAP_PX
                      : 0,
                    gap: { xs: 2, sm: 3 },
                    alignItems: 'start',
                  }}
                >
                {columns.map((col) => (
                  <DroppableColumn key={col.id} id={col.id}>
                    <Card
                      elevation={0}
                      sx={[
                        panelSx,
                        {
                          borderRadius: '24px',
                          minHeight: { xs: 0, sm: 420, lg: 520 },
                          overflow: 'visible',
                        },
                      ]}
                    >
                      <CardContent
                        sx={{
                          p: { xs: 2, sm: 2.5 },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:last-child': {
                            pb: { xs: 2, sm: 2.5 },
                          },
                        }}
                      >
                        <Stack spacing={1.25} sx={{ mb: 2 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="h5"
                              sx={{
                                ...wrapAnywhereSx,
                                fontSize: { xs: 24, md: 28 },
                                fontWeight: 700,
                                letterSpacing: '-0.03em',
                              }}
                            >
                              {col.title}
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 700,
                              }}
                            >
                              {col.items.length}
                            </Typography>
                          </Stack>

                          <Typography sx={mutedTextSx}>
                            {col.items.length}{' '}
                            {col.items.length === 1 ? 'track' : 'tracks'}
                          </Typography>
                        </Stack>

                        <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                          {col.items.map((item) => (
                            <DraggableTrackCard
                              key={item.id}
                              track={item}
                              onOpen={() =>
                                navigate(`/projects/${projectId}/tracks/${item.id}`)
                              }
                              onDelete={() => handleDeleteTrack(item.id)}
                            />
                          ))}

                          {!loading && col.items.length === 0 && (
                            <Box
                              sx={{
                                borderRadius: '18px',
                                border: '1px dashed rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.02)',
                                p: 2,
                              }}
                            >
                              <Typography variant="body2" sx={mutedTextSx}>
                                No tracks in this column
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </DroppableColumn>
                ))}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                alignItems: 'center',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, max-content)' },
                justifyContent: { xs: 'stretch', sm: 'space-between' },
              }}
            >
              <Button
                variant="outlined"
                sx={{ minHeight: 50, width: { xs: '100%', sm: 'auto' } }}
                onClick={() => setAddTrackOpen(true)}
                disabled={creatingTrack}
              >
                {creatingTrack ? 'Adding...' : '+ Add Track'}
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  void handleDeleteProject();
                }}
                disabled={loading || deletingProject || !project}
                sx={[destructiveButtonSx, { width: { xs: '100%', sm: 'auto' } }]}
              >
                {deletingProject ? 'Deleting...' : 'Delete Project'}
              </Button>
            </Box>

            <DragOverlay zIndex={4000} dropAnimation={null}>
              {activeTrack && (
                <Card
                  elevation={0}
                  sx={{
                    width: activeTrackSize?.width ?? 280,
                    minHeight: activeTrackSize?.height,
                    borderRadius: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background:
                      'linear-gradient(180deg, rgba(24, 24, 32, 0.98) 0%, rgba(18, 18, 24, 0.98) 100%)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.45)',
                    cursor: 'grabbing',
                    transition: 'none',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      '&:last-child': {
                        pb: 2,
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: 20, md: 24 },
                          lineHeight: 1.15,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {activeTrack.title}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.40)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {(activeTrack.status || 'DRAFT').toUpperCase()}
                      </Typography>

                      <Box sx={{ pt: 0.5, visibility: 'hidden' }}>
                        <Button size="small" variant="text" sx={{ px: 0, minWidth: 0 }}>
                          Delete
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </Box>

      <Dialog
        open={addTrackOpen}
        onClose={() => closeAddTrackDialog()}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Track</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              required
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Key"
                value={trackKey}
                onChange={(e) => setTrackKey(e.target.value)}
                fullWidth
              />

              <TextField
                label="BPM"
                value={trackBpm}
                onChange={(e) => setTrackBpm(e.target.value)}
                type="number"
                inputProps={{ min: 1, max: 400 }}
                fullWidth
              />
            </Stack>

            <Stack spacing={1}>
              <Button
                variant="outlined"
                component="label"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {trackFile ? 'Replace Audio File' : 'Upload Audio File'}
                <input
                  hidden
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={(event) => {
                    void handleTrackFileChange(event);
                  }}
                />
              </Button>

              <Typography variant="caption" sx={mutedTextSx}>
                Allowed file types: WAV or MP3
              </Typography>

              {trackFile && (
                <Typography variant="body2" sx={mutedTextSx}>
                  {trackFile.name}
                  {trackLengthSec ? ` (${formatDuration(trackLengthSec)})` : ''}
                </Typography>
              )}
            </Stack>

            {addTrackError && <InlineNotice severity="error">{addTrackError}</InlineNotice>}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => closeAddTrackDialog()} disabled={creatingTrack}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleAddTrack();
            }}
            variant="contained"
            disabled={creatingTrack}
          >
            {creatingTrack ? 'Adding...' : 'Add Track'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
