import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { http } from '../../../shared/api/http';
import TrackAudioPlayer from '../components/TrackAudioPlayer';
import {
  destructiveButtonSx,
  pageShellSx,
  panelSx,
  glowTitleSx,
  mutedTextSx,
  sectionTitleSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';
import { getErrorMessage, getStatusCode } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';

type Track = {
  id: string;
  title: string;
  description?: string | null;
  status?: 'IDEA' | 'DRAFT' | 'MIX' | 'MASTER' | null;
  bpm?: number | null;
  key?: string | null;
  audioUrl?: string | null;
};

type TrackEntry = {
  id: string;
  body: string;
  createdAt: string;
};

const TRACK_STATUSES = ['IDEA', 'DRAFT', 'MIX', 'MASTER'] as const;
const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav'];
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
]);
const MAX_AUDIO_UPLOAD_SIZE_BYTES = 80 * 1024 * 1024;

function getFileExtension(filename: string) {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function formatEntryDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

async function uploadTrackAudio(projectId: string, trackId: string, file: File) {
  return http.put(`/projects/${projectId}/tracks/${trackId}/audio`, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
  });
}

function readListPayload<T>(payload: unknown): T[] {
  if (typeof payload === 'object' && payload !== null && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

export default function TrackDetail() {
  const navigate = useNavigate();
  const { projectId, trackId } = useParams();

  const [track, setTrack] = useState<Track | null>(null);
  const [sessionLogs, setSessionLogs] = useState<TrackEntry[]>([]);
  const [notes, setNotes] = useState<TrackEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<(typeof TRACK_STATUSES)[number]>('DRAFT');
  const [editBpm, setEditBpm] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
  const [removeCurrentAudio, setRemoveCurrentAudio] = useState(false);

  const [addLogOpen, setAddLogOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [newLogBody, setNewLogBody] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [addingLog, setAddingLog] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  function syncEditState(nextTrack: Track) {
    setEditTitle(nextTrack.title || '');
    setEditDescription(nextTrack.description || '');
    setEditStatus(
      nextTrack.status && TRACK_STATUSES.includes(nextTrack.status)
        ? nextTrack.status
        : 'DRAFT'
    );
    setEditBpm(nextTrack.bpm ? String(nextTrack.bpm) : '');
    setEditKey(nextTrack.key || '');
    setEditAudioFile(null);
    setRemoveCurrentAudio(false);
  }

  const loadTrack = useCallback(async () => {
    if (!projectId || !trackId) {
      setError('Missing track route params');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [trackRes, logsRes, notesRes] = await Promise.all([
        http.get(`/projects/${projectId}/tracks/${trackId}`),
        http.get(`/projects/${projectId}/tracks/${trackId}/session-logs`),
        http.get(`/projects/${projectId}/tracks/${trackId}/notes`),
      ]);

      const nextTrack = (trackRes.data?.data ?? trackRes.data) as Track;
      setTrack(nextTrack);
      syncEditState(nextTrack);

      setSessionLogs(readListPayload<TrackEntry>(logsRes.data));
      setNotes(readListPayload<TrackEntry>(notesRes.data));
    } catch (error: unknown) {
      setTrack(null);
      setSessionLogs([]);
      setNotes([]);

      const status = getStatusCode(error);
      if (status === 404) {
        setError('Track not found');
      } else if (status === 403) {
        setError('You do not have access to this track');
      } else {
        setError(getErrorMessage(error, 'Failed to load track'));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, trackId]);

  useEffect(() => {
    void loadTrack();
  }, [loadTrack]);

  async function handleDeleteTrack() {
    if (!projectId || !trackId) return;

    const confirmed = window.confirm('Delete this track?');
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await http.delete(`/projects/${projectId}/tracks/${trackId}`);
      navigate(`/projects/${projectId}`);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete track'));
    } finally {
      setDeleting(false);
    }
  }

  function handleEditAudioFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!nextFile) {
      setEditAudioFile(null);
      return;
    }

    const ext = getFileExtension(nextFile.name);
    const validType =
      ALLOWED_AUDIO_MIME_TYPES.has(nextFile.type) ||
      ALLOWED_AUDIO_EXTENSIONS.includes(ext);

    if (!validType) {
      setEditAudioFile(null);
      setError('Only .wav or .mp3 files are allowed.');
      return;
    }

    if (nextFile.size > MAX_AUDIO_UPLOAD_SIZE_BYTES) {
      setEditAudioFile(null);
      setError('Audio file is too large. Max upload size is 80MB.');
      return;
    }

    setEditAudioFile(nextFile);
    setRemoveCurrentAudio(false);
    setError(null);
  }

  async function handleSaveTrackDetails() {
    if (!projectId || !trackId || !track || saving) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setError('Track title is required.');
      return;
    }

    const trimmedDescription = editDescription.trim();
    const trimmedKey = editKey.trim();
    const parsedBpm = editBpm.trim() ? Number.parseInt(editBpm.trim(), 10) : null;

    if (
      parsedBpm !== null &&
      (!Number.isFinite(parsedBpm) || parsedBpm < 1 || parsedBpm > 400)
    ) {
      setError('BPM must be a number from 1 to 400.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const patchRes = await http.patch(`/projects/${projectId}/tracks/${trackId}`, {
        title: trimmedTitle,
        description: trimmedDescription ? trimmedDescription : null,
        status: editStatus,
        bpm: parsedBpm,
        key: trimmedKey ? trimmedKey : null,
      });

      let updatedTrack = (patchRes.data?.data ?? patchRes.data) as Track;

      if (editAudioFile) {
        try {
          const uploadRes = await uploadTrackAudio(projectId, trackId, editAudioFile);
          updatedTrack = (uploadRes.data?.data ?? uploadRes.data) as Track;
        } catch (audioError: unknown) {
          const status = getStatusCode(audioError);
          setTrack(updatedTrack);
          syncEditState(updatedTrack);
          setError(
            status === 413
              ? 'Audio upload is too large. Max upload size is 80MB.'
              : getErrorMessage(audioError, 'Track details saved, but audio upload failed')
          );
          return;
        }
      } else if (removeCurrentAudio && track.audioUrl) {
        const deleteRes = await http.delete(`/projects/${projectId}/tracks/${trackId}/audio`);
        updatedTrack = (deleteRes.data?.data ?? deleteRes.data) as Track;
      }

      setTrack(updatedTrack);
      syncEditState(updatedTrack);
      setEditing(false);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update track'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!track || saving) return;
    syncEditState(track);
    setEditing(false);
  }

  async function handleAddLog() {
    if (!projectId || !trackId || !newLogBody.trim() || addingLog) return;

    setAddingLog(true);
    setError(null);

    try {
      const res = await http.post(`/projects/${projectId}/tracks/${trackId}/session-logs`, {
        body: newLogBody.trim(),
      });
      const created = (res.data?.data ?? res.data) as TrackEntry;
      setSessionLogs((prev) => [created, ...prev]);
      setNewLogBody('');
      setAddLogOpen(false);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to add session log'));
    } finally {
      setAddingLog(false);
    }
  }

  async function handleAddNote() {
    if (!projectId || !trackId || !newNoteBody.trim() || addingNote) return;

    setAddingNote(true);
    setError(null);

    try {
      const res = await http.post(`/projects/${projectId}/tracks/${trackId}/notes`, {
        body: newNoteBody.trim(),
      });
      const created = (res.data?.data ?? res.data) as TrackEntry;
      setNotes((prev) => [created, ...prev]);
      setNewNoteBody('');
      setAddNoteOpen(false);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to add note'));
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background:
            'linear-gradient(180deg, rgba(20, 20, 28, 0.96), rgba(15, 15, 22, 0.92))',
          backdropFilter: 'blur(14px)',
        }}
      >
        <Box className="page-wrap page-wrap-narrow" sx={{ py: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap>
              <Button
                variant="outlined"
                onClick={() =>
                  navigate(projectId ? `/projects/${projectId}` : '/projects')
                }
                sx={{ width: { xs: '100%', sm: 'fit-content' } }}
              >
                ← Back to Board
              </Button>

              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  void handleDeleteTrack();
                }}
                disabled={deleting || loading || !track}
                sx={[destructiveButtonSx, { width: { xs: '100%', sm: 'fit-content' } }]}
              >
                {deleting ? 'Deleting...' : 'Delete Track'}
              </Button>

              {!editing ? (
                <Button
                  variant="contained"
                  onClick={() => setEditing(true)}
                  disabled={deleting || loading || !track}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Edit Details
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      void handleSaveTrackDetails();
                    }}
                    disabled={saving}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </Stack>

            <Typography
              variant="h3"
            sx={{
              ...glowTitleSx,
              ...wrapAnywhereSx,
              fontSize: { xs: 34, md: 48 },
              lineHeight: 1,
            }}
            >
              {track?.title || trackId || 'Track'}
            </Typography>
          </Stack>
        </Box>
      </Box>

      <Box className="page-wrap page-wrap-narrow" sx={[pageShellSx, { pt: 3 }]}>
        {loading && <InlineNotice loading>Loading track...</InlineNotice>}

        {error && <InlineNotice severity="error">{error}</InlineNotice>}

        {!loading && !error && !track && <InlineNotice>Track data unavailable.</InlineNotice>}

        {track && (
          <Stack spacing={3}>
            <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
                <Typography variant="h4" sx={sectionTitleSx}>
                  Track Details
                </Typography>

                <Stack spacing={2}>
                  {!editing ? (
                    <Box
                      sx={{
                        width: { xs: '100%', sm: 240 },
                        p: 2.5,
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background:
                          'linear-gradient(180deg, rgba(26, 26, 34, 0.98) 0%, rgba(19, 19, 26, 0.98) 100%)',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.38)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Status
                      </Typography>

                      <Typography
                        sx={{
                          fontWeight: 700,
                          mt: 1,
                          fontSize: 24,
                          lineHeight: 1.1,
                        }}
                      >
                        {track.status || 'DRAFT'}
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.5} sx={{ maxWidth: 460 }}>
                      <TextField
                        label="Title"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        disabled={saving}
                        fullWidth
                      />
                      <TextField
                        label="Description"
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        disabled={saving}
                        multiline
                        minRows={4}
                        fullWidth
                      />
                      <TextField
                        select
                        label="Status"
                        value={editStatus}
                        onChange={(event) =>
                          setEditStatus(event.target.value as (typeof TRACK_STATUSES)[number])
                        }
                        disabled={saving}
                        fullWidth
                      >
                        {TRACK_STATUSES.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                          label="BPM"
                          value={editBpm}
                          onChange={(event) => setEditBpm(event.target.value)}
                          disabled={saving}
                          fullWidth
                        />
                        <TextField
                          label="Key"
                          value={editKey}
                          onChange={(event) => setEditKey(event.target.value)}
                          disabled={saving}
                          fullWidth
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                        <Button
                          component="label"
                          variant="outlined"
                          disabled={saving}
                          sx={{ width: { xs: '100%', sm: 'fit-content' } }}
                        >
                          {editAudioFile ? 'Replace Audio File' : 'Upload Audio File'}
                          <input
                            hidden
                            type="file"
                            accept=".mp3,.wav,audio/mpeg,audio/wav"
                            onChange={handleEditAudioFileChange}
                          />
                        </Button>

                        {track.audioUrl && (
                          <Button
                            variant={removeCurrentAudio ? 'contained' : 'text'}
                            color={removeCurrentAudio ? 'error' : 'inherit'}
                            disabled={saving || Boolean(editAudioFile)}
                            onClick={() => setRemoveCurrentAudio((prev) => !prev)}
                            sx={{ width: { xs: '100%', sm: 'fit-content' } }}
                          >
                            {removeCurrentAudio ? 'Audio Will Be Removed' : 'Remove Current Audio'}
                          </Button>
                        )}
                      </Stack>

                      <Typography variant="body2" sx={mutedTextSx}>
                        {editAudioFile
                          ? `Selected file: ${editAudioFile.name}`
                          : removeCurrentAudio
                            ? 'Current audio will be deleted when you save.'
                            : track.audioUrl
                              ? 'You can replace or remove the current audio.'
                              : 'No audio attached. Upload an MP3 or WAV file.'}
                      </Typography>
                    </Stack>
                  )}

                  <TrackAudioPlayer audioUrl={track.audioUrl} />

                  {!editing && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.38)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Description
                      </Typography>
                      <Typography
                        sx={{
                          ...wrapAnywhereSx,
                          mt: 1,
                          color: track.description ? 'inherit' : 'rgba(255,255,255,0.52)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {track.description || 'No description added yet.'}
                      </Typography>
                    </Box>
                  )}

                  {(track.bpm || track.key) && (
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {track.bpm && (
                        <Box
                          sx={{
                            px: 1.5,
                            py: 1,
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <Typography variant="body2" sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
                            BPM: {track.bpm}
                          </Typography>
                        </Box>
                      )}

                      {track.key && (
                        <Box
                          sx={{
                            px: 1.5,
                            py: 1,
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <Typography variant="body2" sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
                            Key: {track.key}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{ mb: 2.5, gap: 2, flexWrap: 'wrap' }}
                >
                  <Typography variant="h4" sx={sectionTitleSx}>
                    Session Logs
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={() => setAddLogOpen(true)}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    + Add Log
                  </Button>
                </Stack>

                <Box
                  sx={{
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px',
                    p: { xs: 2, sm: 3 },
                    minHeight: 220,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {sessionLogs.length === 0 ? (
                    <Stack
                      spacing={0.75}
                      sx={{ textAlign: 'center', maxWidth: 360, mx: 'auto', mt: 6 }}
                    >
                      <Typography sx={mutedTextSx}>No session logs yet</Typography>

                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.34)' }}>
                        Track your progress and document your workflow
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.2}>
                      {sessionLogs.map((log) => (
                        <Box
                          key={log.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.015)',
                          }}
                        >
                          <Typography variant="caption" sx={mutedTextSx}>
                            {formatEntryDate(log.createdAt)}
                          </Typography>
                          <Typography sx={{ ...wrapAnywhereSx, mt: 0.6, whiteSpace: 'pre-wrap' }}>
                            {log.body}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
              <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{ mb: 2.5, gap: 2, flexWrap: 'wrap' }}
                >
                  <Typography variant="h4" sx={sectionTitleSx}>
                    Notes For Later
                  </Typography>

                  <Button
                    variant="outlined"
                    onClick={() => setAddNoteOpen(true)}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    + Add Note
                  </Button>
                </Stack>

                <Box
                  sx={{
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '20px',
                    p: { xs: 2, sm: 3 },
                    minHeight: 180,
                    background: 'rgba(255,255,255,0.015)',
                  }}
                >
                  {notes.length === 0 ? (
                    <Stack
                      spacing={0.75}
                      sx={{ textAlign: 'center', maxWidth: 360, mx: 'auto', mt: 4 }}
                    >
                      <Typography sx={mutedTextSx}>No notes yet</Typography>

                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.34)' }}>
                        Capture ideas and reminders for this track
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.2}>
                      {notes.map((note) => (
                        <Box
                          key={note.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.015)',
                          }}
                        >
                          <Typography variant="caption" sx={mutedTextSx}>
                            {formatEntryDate(note.createdAt)}
                          </Typography>
                          <Typography sx={{ ...wrapAnywhereSx, mt: 0.6, whiteSpace: 'pre-wrap' }}>
                            {note.body}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      <Dialog open={addLogOpen} onClose={() => (addingLog ? null : setAddLogOpen(false))} fullWidth>
        <DialogTitle>Add Session Log</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={4}
            label="Log entry"
            value={newLogBody}
            onChange={(event) => setNewLogBody(event.target.value)}
            fullWidth
            disabled={addingLog}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddLogOpen(false)} disabled={addingLog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleAddLog();
            }}
            disabled={addingLog || !newLogBody.trim()}
          >
            {addingLog ? 'Adding...' : 'Add Log'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addNoteOpen} onClose={() => (addingNote ? null : setAddNoteOpen(false))} fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            minRows={4}
            label="Note"
            value={newNoteBody}
            onChange={(event) => setNewNoteBody(event.target.value)}
            fullWidth
            disabled={addingNote}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNoteOpen(false)} disabled={addingNote}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleAddNote();
            }}
            disabled={addingNote || !newNoteBody.trim()}
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
