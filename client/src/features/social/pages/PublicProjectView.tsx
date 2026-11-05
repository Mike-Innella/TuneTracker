import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
import { http } from '../../../shared/api/http';
import { publicTrackEngagementApi } from '../api/publicTrackEngagementApi';
import PublicProjectHeader from '../components/PublicProjectHeader';
import PublicTrackListCard from '../components/PublicTrackListCard';
import type {
  PublicProject,
  TrackComment,
  TrackEngagement,
} from '../types';
import { useAuth } from '../../auth/state/useAuth';
import { pageShellSx } from '../../../app/theme/uiStyles';
import { getErrorMessage, getStatusCode } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';

export default function PublicProjectView() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTrackId = searchParams.get('trackId');
  const { user } = useAuth();

  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [engagement, setEngagement] = useState<TrackEngagement | null>(null);
  const [comments, setComments] = useState<TrackComment[]>([]);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [engagementError, setEngagementError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [likePending, setLikePending] = useState(false);
  const [ratingPending, setRatingPending] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const selectedTrackIdRef = useRef<string | null>(null);
  const engagementRef = useRef<TrackEngagement | null>(null);
  const engagementErrorRef = useRef<string | null>(null);

  useEffect(() => {
    selectedTrackIdRef.current = selectedTrackId;
  }, [selectedTrackId]);

  useEffect(() => {
    engagementRef.current = engagement;
  }, [engagement]);

  useEffect(() => {
    engagementErrorRef.current = engagementError;
  }, [engagementError]);

  const loadTrackEngagement = useCallback(async (trackId: string) => {
    if (!projectId) return;
    if (
      selectedTrackIdRef.current === trackId &&
      engagementRef.current &&
      !engagementErrorRef.current
    ) {
      return;
    }

    setSelectedTrackId(trackId);
    setEngagementLoading(true);
    setEngagementError(null);

    try {
      const [nextEngagement, nextComments] = await Promise.all([
        publicTrackEngagementApi.getEngagement(projectId, trackId),
        publicTrackEngagementApi.getComments(projectId, trackId),
      ]);
      setEngagement(nextEngagement);
      setComments(nextComments);
    } catch (error: unknown) {
      setEngagement(null);
      setComments([]);
      setEngagementError(getErrorMessage(error, 'Failed to load track engagement'));
    } finally {
      setEngagementLoading(false);
    }
  }, [projectId]);

  const loadPublicProject = useCallback(async () => {
    if (!projectId) {
      setError('Missing project id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await http.get(`/projects/public/${projectId}`);
      const nextProject = (res.data?.data ?? res.data) as PublicProject;
      setProject(nextProject);

      if (nextProject.tracks?.length) {
        const preferredTrackId =
          requestedTrackId && nextProject.tracks.some((track) => track.id === requestedTrackId)
            ? requestedTrackId
            : selectedTrackIdRef.current &&
                nextProject.tracks.some((track) => track.id === selectedTrackIdRef.current)
              ? selectedTrackIdRef.current
              : nextProject.tracks[0].id;

        await loadTrackEngagement(preferredTrackId);
      } else {
        setSelectedTrackId(null);
        setEngagement(null);
        setComments([]);
      }
    } catch (error: unknown) {
      setProject(null);
      if (getStatusCode(error) === 404) {
        setError('Public project not found');
      } else {
        setError(getErrorMessage(error, 'Failed to load public project'));
      }
    } finally {
      setLoading(false);
    }
  }, [loadTrackEngagement, projectId, requestedTrackId]);

  async function handleLikeToggle() {
    if (!user || !projectId || !selectedTrackId || !engagement || likePending) return;

    setLikePending(true);
    setEngagementError(null);
    try {
      const result = engagement.likedByMe
        ? await publicTrackEngagementApi.unlike(projectId, selectedTrackId)
        : await publicTrackEngagementApi.like(projectId, selectedTrackId);

      setEngagement((prev) =>
        prev ? { ...prev, likedByMe: result.liked, likesCount: result.likesCount } : prev
      );
    } catch (error: unknown) {
      setEngagementError(getErrorMessage(error, 'Failed to update like'));
    } finally {
      setLikePending(false);
    }
  }

  async function handleRate(value: number) {
    if (!user || !projectId || !selectedTrackId || ratingPending) return;

    setRatingPending(true);
    setEngagementError(null);
    try {
      await publicTrackEngagementApi.rate(projectId, selectedTrackId, value);
      await loadTrackEngagement(selectedTrackId);
    } catch (error: unknown) {
      setEngagementError(getErrorMessage(error, 'Failed to rate track'));
    } finally {
      setRatingPending(false);
    }
  }

  async function handleAddComment() {
    if (!user || !projectId || !selectedTrackId || !commentBody.trim() || commentPending) {
      return;
    }

    setCommentPending(true);
    setEngagementError(null);
    try {
      const created = await publicTrackEngagementApi.createComment(
        projectId,
        selectedTrackId,
        commentBody.trim()
      );
      setComments((prev) => [...prev, created]);
      setCommentBody('');
      setEngagement((prev) => (prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev));
    } catch (error: unknown) {
      setEngagementError(getErrorMessage(error, 'Failed to add comment'));
    } finally {
      setCommentPending(false);
    }
  }

  useEffect(() => {
    void loadPublicProject();
  }, [loadPublicProject]);

  return (
    <Box className="page-wrap page-wrap-narrow" sx={pageShellSx}>
      <Stack spacing={3}>
        <PublicProjectHeader project={project} />

        {loading && <InlineNotice loading>Loading public project...</InlineNotice>}
        {error && <InlineNotice severity="error">{error}</InlineNotice>}
        {!loading && !error && !project && <InlineNotice>Public project unavailable.</InlineNotice>}

        {project && (
          <>
            <PublicTrackListCard
              tracks={project.tracks}
              selectedTrackId={selectedTrackId}
              engagement={engagement}
              comments={comments}
              loading={engagementLoading}
              error={engagementError}
              isSignedIn={Boolean(user)}
              commentBody={commentBody}
              likePending={likePending}
              ratingPending={ratingPending}
              commentPending={commentPending}
              onOpenTrack={(trackId) => {
                void loadTrackEngagement(trackId);
              }}
              onCommentBodyChange={setCommentBody}
              onLikeToggle={() => {
                void handleLikeToggle();
              }}
              onRate={(value) => {
                void handleRate(value);
              }}
              onAddComment={() => {
                void handleAddComment();
              }}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}
