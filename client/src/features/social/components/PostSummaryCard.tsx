import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { FeedPost } from '../types';
import AuthorMeta from './AuthorMeta';
import {
  destructiveTextButtonSx,
  mutedTextSx,
  panelSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';

type PostSummaryCardProps = {
  post: FeedPost;
  likesCount: number;
  commentsCount: number;
  isSignedIn: boolean;
  likedByMe: boolean;
  likePending: boolean;
  canDelete: boolean;
  deletingPost: boolean;
  onLikeToggle: () => void;
  onDeletePost: () => void;
};

export default function PostSummaryCard({
  post,
  likesCount,
  commentsCount,
  isSignedIn,
  likedByMe,
  likePending,
  canDelete,
  deletingPost,
  onLikeToggle,
  onDeletePost,
}: PostSummaryCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 }, '&:last-child': { pb: { xs: 2.25, sm: 3 } } }}>
        <Stack spacing={1.25}>
          <AuthorMeta author={post.author} createdAt={post.createdAt} avatarSize={36} />

          <Typography sx={{ ...wrapAnywhereSx, whiteSpace: 'pre-wrap' }}>{post.content}</Typography>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography variant="body2" sx={mutedTextSx}>
              Likes: {likesCount}
            </Typography>
            <Typography variant="body2" sx={mutedTextSx}>
              Comments: {commentsCount}
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={onLikeToggle}
              disabled={!isSignedIn || likePending}
            >
              {likedByMe ? 'Unlike' : 'Like'}
            </Button>
            {canDelete && (
              <Button
                size="small"
                color="error"
                variant="text"
                sx={destructiveTextButtonSx}
                disabled={deletingPost}
                onClick={onDeletePost}
              >
                {deletingPost ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </Stack>

          {!isSignedIn && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Typography variant="body2" sx={mutedTextSx}>
                Sign in to like or comment.
              </Typography>
              <Button component={RouterLink} to="/auth" size="small" variant="text">
                Sign In
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
