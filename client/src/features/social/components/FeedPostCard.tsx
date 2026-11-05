import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { FeedPost, SocialAuthor } from '../types';
import AuthorMeta from './AuthorMeta';
import {
  destructiveTextButtonSx,
  mutedTextSx,
  panelSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';

type FeedPostCardProps = {
  post: FeedPost;
  currentUserId?: string;
  deletingPostId: string | null;
  onDeletePost: (postId: string) => void;
  onAuthorAvatarClick?: (author: SocialAuthor) => void;
};

export default function FeedPostCard({
  post,
  currentUserId,
  deletingPostId,
  onDeletePost,
  onAuthorAvatarClick,
}: FeedPostCardProps) {
  const canOpenAuthorProfile = Boolean(onAuthorAvatarClick);

  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '20px' }]}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack spacing={1.2}>
          <AuthorMeta
            author={post.author}
            createdAt={post.createdAt}
            avatarSize={34}
            onAvatarClick={
              canOpenAuthorProfile && onAuthorAvatarClick
                ? () => onAuthorAvatarClick(post.author)
                : undefined
            }
          />

          <Typography sx={{ ...wrapAnywhereSx, whiteSpace: 'pre-wrap' }}>{post.content}</Typography>

          {post.project?.title && (
            <Typography variant="body2" sx={mutedTextSx}>
              Project: {post.project.title}
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography variant="body2" sx={mutedTextSx}>
              Likes: {post._count?.likes ?? 0}
            </Typography>
            <Typography variant="body2" sx={mutedTextSx}>
              Comments: {post._count?.comments ?? 0}
            </Typography>
            <Button
              component={RouterLink}
              to={`/feed/${post.id}`}
              size="small"
              variant="text"
            >
              Open
            </Button>
            {currentUserId === post.author.id && (
              <Button
                size="small"
                color="error"
                variant="text"
                sx={destructiveTextButtonSx}
                disabled={deletingPostId === post.id}
                onClick={() => onDeletePost(post.id)}
              >
                {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
