import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { postsApi } from '../api/postsApi';
import type { FeedPost, PostComment } from '../types';
import PostCommentsCard from '../components/PostCommentsCard';
import PostSummaryCard from '../components/PostSummaryCard';
import { useAuth } from '../../auth/state/useAuth';
import { pageShellSx } from '../../../app/theme/uiStyles';
import { getErrorMessage } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [likedByMe, setLikedByMe] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likePending, setLikePending] = useState(false);

  const [commentContent, setCommentContent] = useState('');
  const [commentPending, setCommentPending] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const loadPage = useCallback(async () => {
    if (!postId) {
      setError('Missing post id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [postData, commentsData] = await Promise.all([
        postsApi.getPostDetail(postId),
        postsApi.getComments(postId),
      ]);

      setPost(postData);
      setComments(commentsData);
      setLikedByMe(Boolean(postData.likedByMe));
      setLikesCount(postData._count?.likes ?? 0);
    } catch (error: unknown) {
      setPost(null);
      setComments([]);
      setError(getErrorMessage(error, 'Failed to load post'));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  async function handleLikeToggle() {
    if (!user || !postId || likePending) return;

    setLikePending(true);
    setError(null);

    try {
      if (likedByMe) {
        const result = await postsApi.unlikePost(postId);
        setLikedByMe(false);
        setLikesCount(result.likesCount);
      } else {
        const result = await postsApi.likePost(postId);
        setLikedByMe(true);
        setLikesCount(result.likesCount);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update like'));
    } finally {
      setLikePending(false);
    }
  }

  async function handleAddComment() {
    if (!user || !postId || !commentContent.trim() || commentPending) return;

    setCommentPending(true);
    setError(null);

    try {
      const created = await postsApi.createComment(postId, {
        content: commentContent.trim(),
      });
      setComments((prev) => [...prev, created]);
      setCommentContent('');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to add comment'));
    } finally {
      setCommentPending(false);
    }
  }

  async function handleDeletePost() {
    if (!user || !postId || !post || user.id !== post.author.id || deletingPost) return;

    const confirmed = window.confirm('Delete this post?');
    if (!confirmed) return;

    setDeletingPost(true);
    setError(null);

    try {
      await postsApi.deletePost(postId);
      navigate('/feed');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete post'));
    } finally {
      setDeletingPost(false);
    }
  }

  async function handleDeleteComment(commentId: string, authorId: string) {
    if (!user || !postId || user.id !== authorId || deletingCommentId) return;

    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    setDeletingCommentId(commentId);
    setError(null);

    try {
      await postsApi.deleteComment(postId, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete comment'));
    } finally {
      setDeletingCommentId(null);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  return (
    <Box className="page-wrap page-wrap-narrow" sx={pageShellSx}>
      <Stack spacing={3}>
        <Button
          component={RouterLink}
          to="/feed"
          variant="text"
          sx={{ alignSelf: 'flex-start', width: { xs: '100%', sm: 'auto' } }}
        >
          Back to Feed
        </Button>

        {loading && <InlineNotice loading>Loading post...</InlineNotice>}
        {error && <InlineNotice severity="error">{error}</InlineNotice>}

        {!loading && !error && !post && <InlineNotice>Post not found.</InlineNotice>}

        {post && (
          <>
            <PostSummaryCard
              post={post}
              likesCount={likesCount}
              commentsCount={comments.length}
              isSignedIn={Boolean(user)}
              likedByMe={likedByMe}
              likePending={likePending}
              canDelete={user?.id === post.author.id}
              deletingPost={deletingPost}
              onLikeToggle={() => {
                void handleLikeToggle();
              }}
              onDeletePost={() => {
                void handleDeletePost();
              }}
            />

            <PostCommentsCard
              comments={comments}
              userId={user?.id}
              commentContent={commentContent}
              commentPending={commentPending}
              deletingCommentId={deletingCommentId}
              onCommentContentChange={setCommentContent}
              onAddComment={() => {
                void handleAddComment();
              }}
              onDeleteComment={(commentId, authorId) => {
                void handleDeleteComment(commentId, authorId);
              }}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}
