import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import type { PostComment } from '../types';
import AuthorMeta from './AuthorMeta';
import {
  destructiveTextButtonSx,
  mutedTextSx,
  panelSx,
  sectionTitleSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';

type PostCommentsCardProps = {
  comments: PostComment[];
  userId?: string;
  commentContent: string;
  commentPending: boolean;
  deletingCommentId: string | null;
  onCommentContentChange: (value: string) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string, authorId: string) => void;
};

export default function PostCommentsCard({
  comments,
  userId,
  commentContent,
  commentPending,
  deletingCommentId,
  onCommentContentChange,
  onAddComment,
  onDeleteComment,
}: PostCommentsCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Comments
        </Typography>

        <Stack spacing={1.5}>
          <TextField
            multiline
            minRows={2}
            value={commentContent}
            onChange={(e) => onCommentContentChange(e.target.value)}
            disabled={!userId || commentPending}
            placeholder={userId ? 'Write a comment...' : 'Sign in to comment'}
            fullWidth
          />

          <Button
            variant="outlined"
            onClick={onAddComment}
            disabled={!userId || commentPending || !commentContent.trim()}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {commentPending ? 'Posting...' : 'Add Comment'}
          </Button>

          {comments.length === 0 && <Typography sx={mutedTextSx}>No comments yet.</Typography>}

          <Stack spacing={1}>
            {comments.map((comment) => (
              <Box
                key={comment.id}
                sx={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  p: 1.5,
                }}
              >
                <AuthorMeta
                  author={comment.author}
                  createdAt={comment.createdAt}
                  avatarSize={28}
                  variant="caption"
                />
                <Typography sx={{ ...wrapAnywhereSx, whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {comment.content}
                </Typography>
                {userId === comment.author.id && (
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    disabled={deletingCommentId === comment.id}
                    onClick={() => onDeleteComment(comment.id, comment.author.id)}
                    sx={[destructiveTextButtonSx, { mt: 0.5, width: { xs: '100%', sm: 'fit-content' } }]}
                  >
                    {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
