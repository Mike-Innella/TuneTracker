import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { authApi } from '../../auth/api/authApi';
import { publicProjectsApi } from '../../projects/api/publicProjectsApi';
import { postsApi } from '../api/postsApi';
import type {
  FeedPost,
  PublicProject,
  PublicUserProfile,
  SocialAuthor,
} from '../types';
import FeedComposerCard from '../components/FeedComposerCard';
import FeedPostCard from '../components/FeedPostCard';
import PublicProjectFeedCard from '../components/PublicProjectFeedCard';
import PublicUserProfileDialog from '../components/PublicUserProfileDialog';
import { useAuth } from '../../auth/state/useAuth';
import { pageShellSx } from '../../../app/theme/uiStyles';
import { getErrorMessage } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';
import PageIntro from '../../../shared/ui/PageIntro';

export default function FeedPage() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicProjectsLoading, setPublicProjectsLoading] = useState(true);
  const [publicProjectsError, setPublicProjectsError] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [publicProfileOpen, setPublicProfileOpen] = useState(false);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicUserProfile | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<SocialAuthor | null>(null);

  async function loadFeed() {
    setLoading(true);
    setError(null);

    try {
      const data = await postsApi.getFeed();
      setPosts(data);
    } catch (error: unknown) {
      setPosts([]);
      setError(getErrorMessage(error, 'Failed to load feed'));
    } finally {
      setLoading(false);
    }
  }

  async function loadPublicProjects() {
    setPublicProjectsLoading(true);
    setPublicProjectsError(null);

    try {
      const result = await publicProjectsApi.getPublicProjects({ page: 1, limit: 12 });
      setPublicProjects(
        (result.data ?? []).map((project) => ({
          ...project,
          trackCount: project.trackCount ?? project._count?.tracks ?? 0,
        }))
      );
    } catch (error: unknown) {
      setPublicProjects([]);
      setPublicProjectsError(getErrorMessage(error, 'Failed to load public projects'));
    } finally {
      setPublicProjectsLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!user || !content.trim() || creating) return;

    setCreating(true);
    setError(null);

    try {
      const created = await postsApi.createPost({ content: content.trim() });
      setPosts((prev) => [created, ...prev]);
      setContent('');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create post'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!user || deletingPostId) return;

    const confirmed = window.confirm('Delete this post?');
    if (!confirmed) return;

    setDeletingPostId(postId);
    setError(null);

    try {
      await postsApi.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete post'));
    } finally {
      setDeletingPostId(null);
    }
  }

  async function handleOpenPublicProfile(author: SocialAuthor) {
    if (!author.id) return;

    setPublicProfileOpen(true);
    setPublicProfileLoading(true);
    setPublicProfileError(null);
    setPublicProfile(null);
    setSelectedAuthor(author);

    try {
      const profile = await authApi.getPublicProfile(author.id);
      setPublicProfile(profile);
    } catch (error: unknown) {
      setPublicProfileError(getErrorMessage(error, 'Failed to load profile'));
    } finally {
      setPublicProfileLoading(false);
    }
  }

  useEffect(() => {
    void loadFeed();
    void loadPublicProjects();
  }, []);

  return (
    <Box className="page-wrap page-wrap-narrow" sx={pageShellSx}>
      <Stack spacing={3}>
        <PageIntro
          title="Public Feed"
          description="Share quick updates and discover what others are building."
        />

        <FeedComposerCard
          isSignedIn={Boolean(user)}
          content={content}
          creating={creating}
          onContentChange={setContent}
          onSubmit={() => {
            void handleCreatePost();
          }}
        />

        {loading && <InlineNotice loading>Loading feed...</InlineNotice>}
        {error && <InlineNotice severity="error">{error}</InlineNotice>}

        <Box>
          <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700 }}>
            Public Projects
          </Typography>

          {publicProjectsLoading && <InlineNotice loading>Loading public projects...</InlineNotice>}
          {publicProjectsError && (
            <InlineNotice severity="error">{publicProjectsError}</InlineNotice>
          )}
          {!publicProjectsLoading && !publicProjectsError && publicProjects.length === 0 && (
            <InlineNotice>No public projects yet.</InlineNotice>
          )}

          {!!publicProjects.length && (
            <Stack spacing={2}>
              {publicProjects.map((project) => (
                <PublicProjectFeedCard
                  key={project.id}
                  project={project}
                  onOwnerAvatarClick={(author) => {
                    void handleOpenPublicProfile(author);
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700 }}>
            Posts
          </Typography>

        {!loading && !error && posts.length === 0 && <InlineNotice>No posts yet.</InlineNotice>}

        <Stack spacing={2}>
          {posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              deletingPostId={deletingPostId}
              onDeletePost={(id) => {
                void handleDeletePost(id);
              }}
              onAuthorAvatarClick={(author) => {
                void handleOpenPublicProfile(author);
              }}
            />
          ))}
        </Stack>
        </Box>

        <PublicUserProfileDialog
          open={publicProfileOpen}
          loading={publicProfileLoading}
          error={publicProfileError}
          profile={publicProfile}
          fallbackDisplayName={selectedAuthor?.displayName}
          fallbackProfileImageData={selectedAuthor?.profileImageData}
          onClose={() => {
            setPublicProfileOpen(false);
          }}
        />
      </Stack>
    </Box>
  );
}
