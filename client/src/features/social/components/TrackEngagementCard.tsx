import { Avatar, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import type { PublicProject, TrackComment, TrackEngagement } from '../types';
import { formatDate } from '../utils';
import { mutedTextSx, panelSx, sectionTitleSx } from '../../../app/theme/uiStyles';
import InlineNotice from '../../../shared/ui/InlineNotice';

type TrackEngagementCardProps = {
  project: PublicProject;
  selectedTrackId: string | null;
  engagement: TrackEngagement | null;
  comments: TrackComment[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  commentBody: string;
  likePending: boolean;
  commentPending: boolean;
  onCommentBodyChange: (value: string) => void;
  onLikeToggle: () => void;
  onAddComment: () => void;
};

function selectedTrackTitle(project: PublicProject, selectedTrackId: string) {
  return project.tracks?.find((track) => track.id === selectedTrackId)?.title || 'Selected Track';
}

export default function TrackEngagementCard({
  project,
  selectedTrackId,
  engagement,
  comments,
  loading,
  error,
  isSignedIn,
  commentBody,
  likePending,
  commentPending,
  onCommentBodyChange,
  onLikeToggle,
  onAddComment,
}: TrackEngagementCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography variant="h5" sx={sectionTitleSx}>
          Track Discussion
        </Typography>

        {selectedTrackId ? (
          <Stack spacing={1.5}>
            <Typography sx={mutedTextSx}>Track: {selectedTrackTitle(project, selectedTrackId)}</Typography>

            {loading && <InlineNotice loading>Loading engagement...</InlineNotice>}
            {error && <InlineNotice severity="error">{error}</InlineNotice>}

            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={mutedTextSx}>Likes: {engagement?.likesCount ?? 0}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onLikeToggle}
                  disabled={!isSignedIn || likePending || !engagement}
                >
                  {engagement?.likedByMe ? 'Unlike' : 'Like'}
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
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
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {commentPending ? 'Posting...' : 'Comment'}
                </Button>

                {comments.length === 0 ? (
                  <InlineNotice>No comments yet.</InlineNotice>
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
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={comment.author.profileImageData || undefined}
                            alt={comment.author.displayName || comment.author.email || 'User'}
                            sx={{ width: 22, height: 22 }}
                          >
                            {(comment.author.displayName || comment.author.email || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" sx={mutedTextSx}>
                            {comment.author.displayName || comment.author.email || 'Unknown'} ·{' '}
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {comment.body}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        ) : (
          <InlineNotice>Open a track below to like, comment, and rate.</InlineNotice>
        )}
      </CardContent>
    </Card>
  );
}
