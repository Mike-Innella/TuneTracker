import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import TrackAudioPlayer from '../../projects/components/TrackAudioPlayer';
import type { PublicTrack, TrackComment, TrackEngagement } from '../types';
import { formatDate, toStars } from '../utils';
import { mutedTextSx, panelSx, sectionTitleSx, wrapAnywhereSx } from '../../../app/theme/uiStyles';

type PublicTrackListCardProps = {
  tracks?: PublicTrack[];
  selectedTrackId?: string | null;
  engagement: TrackEngagement | null;
  comments: TrackComment[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  commentBody: string;
  likePending: boolean;
  ratingPending: boolean;
  commentPending: boolean;
  onOpenTrack: (trackId: string) => void;
  onCommentBodyChange: (value: string) => void;
  onLikeToggle: () => void;
  onRate: (value: number) => void;
  onAddComment: () => void;
};

export default function PublicTrackListCard({
  tracks,
  selectedTrackId,
  engagement,
  comments,
  loading,
  error,
  isSignedIn,
  commentBody,
  likePending,
  ratingPending,
  commentPending,
  onOpenTrack,
  onCommentBodyChange,
  onLikeToggle,
  onRate,
  onAddComment,
}: PublicTrackListCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
        <Typography variant="h5" sx={sectionTitleSx}>
          Tracks
        </Typography>

        {!tracks?.length ? (
          <Box
            sx={{
              borderRadius: '18px',
              border: '1px dashed rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              p: 2.5,
            }}
          >
            <Typography sx={mutedTextSx}>No public tracks yet.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;

              return (
                <Box
                  key={track.id}
                  onClick={() => onOpenTrack(track.id)}
                  sx={{
                    p: 2,
                    borderRadius: '18px',
                    border: isSelected
                      ? '1px solid rgba(140, 154, 255, 0.35)'
                      : '1px solid rgba(255,255,255,0.06)',
                    background:
                      'linear-gradient(180deg, rgba(24, 24, 32, 0.98) 0%, rgba(18, 18, 24, 0.98) 100%)',
                    cursor: 'pointer',
                    transition:
                      'border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease',
                    boxShadow: isSelected
                      ? '0 18px 38px rgba(0, 0, 0, 0.22)'
                      : '0 0 0 rgba(0, 0, 0, 0)',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    gap={2}
                  >
                    <Typography
                      sx={{
                        ...wrapAnywhereSx,
                        fontWeight: 700,
                        fontSize: { xs: 18, sm: 20 },
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {track.title}
                    </Typography>

                    <Chip
                      size="small"
                      label={(track.status || 'DRAFT').toUpperCase()}
                      sx={{
                        backgroundColor: 'rgba(111, 99, 255, 0.14)',
                        color: '#d7d0ff',
                        border: '1px solid rgba(111, 99, 255, 0.18)',
                      }}
                    />
                  </Stack>

                  <Box sx={{ mt: 1.25 }}>
                    <TrackAudioPlayer audioUrl={track.audioUrl} />
                  </Box>

                  {track.description && (
                    <Typography
                      sx={[mutedTextSx, wrapAnywhereSx, { mt: 1.25, whiteSpace: 'pre-wrap' }]}
                    >
                      {track.description}
                    </Typography>
                  )}

                  <Collapse in={isSelected} timeout={320} unmountOnExit>
                    <Stack
                      spacing={1.25}
                      sx={{
                        mt: 1.5,
                        opacity: isSelected ? 1 : 0,
                        transform: isSelected ? 'translateY(0)' : 'translateY(-8px)',
                        transition: 'opacity 220ms ease, transform 260ms ease',
                      }}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: '14px',
                          border: '1px solid rgba(140, 154, 255, 0.18)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          gap={1}
                        >
                          <Typography sx={mutedTextSx}>Likes: {engagement?.likesCount ?? 0}</Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={onLikeToggle}
                            disabled={!isSignedIn || likePending || !engagement}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                          >
                            {engagement?.likedByMe ? 'Unlike' : 'Like'}
                          </Button>
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: '14px',
                          border: '1px solid rgba(140, 154, 255, 0.18)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          gap={1}
                        >
                          <Typography sx={mutedTextSx}>
                            Rating:{' '}
                            {loading
                              ? 'Loading...'
                              : engagement?.ratingAverage !== null &&
                                  engagement?.ratingAverage !== undefined
                                ? `${toStars(engagement.ratingAverage)} ${engagement.ratingAverage.toFixed(1)} (${engagement.ratingCount})`
                                : '☆☆☆☆☆ --'}
                          </Typography>
                          {!isSignedIn && (
                            <Typography variant="caption" sx={mutedTextSx}>
                              Sign in to rate this track
                            </Typography>
                          )}
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: 'wrap' }} useFlexGap>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Button
                              key={value}
                              size="small"
                              variant={engagement?.myRating === value ? 'contained' : 'outlined'}
                              onClick={() => onRate(value)}
                              disabled={!isSignedIn || ratingPending || loading}
                              sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 0 } }}
                            >
                              {toStars(value)}
                            </Button>
                          ))}
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: '14px',
                          border: '1px solid rgba(140, 154, 255, 0.18)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <Typography sx={[mutedTextSx, { mb: 1 }]}>
                          Comments: {engagement?.commentsCount ?? comments.length}
                        </Typography>

                        <Stack spacing={1}>
                          <TextField
                            size="small"
                            placeholder={isSignedIn ? 'Write a comment...' : 'Sign in to comment'}
                            value={commentBody}
                            onChange={(event) => onCommentBodyChange(event.target.value)}
                            disabled={!isSignedIn || commentPending}
                            fullWidth
                          />

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={onAddComment}
                            disabled={!isSignedIn || commentPending || !commentBody.trim()}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                          >
                            {commentPending ? 'Posting...' : 'Comment'}
                          </Button>

                          {error && (
                            <Typography variant="body2" sx={{ color: '#ff9db0' }}>
                              {error}
                            </Typography>
                          )}

                          {comments.length === 0 ? (
                            <Typography variant="body2" sx={mutedTextSx}>
                              No comments yet.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {comments.map((comment) => (
                                <Box
                                  key={comment.id}
                                  sx={{
                                    p: 1.2,
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                    <Avatar
                                      src={comment.author.profileImageData || undefined}
                                      alt={comment.author.displayName || comment.author.email || 'User'}
                                      sx={{ width: 22, height: 22 }}
                                    >
                                      {(comment.author.displayName || comment.author.email || 'U')
                                        .charAt(0)
                                        .toUpperCase()}
                                    </Avatar>
                                    <Typography variant="caption" sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
                                      {comment.author.displayName ||
                                        comment.author.email ||
                                        'Unknown'}{' '}
                                      · {formatDate(comment.createdAt)}
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    variant="body2"
                                    sx={{ ...wrapAnywhereSx, mt: 0.5, whiteSpace: 'pre-wrap' }}
                                  >
                                    {comment.body}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
