import type { AxiosResponse } from 'axios';
import { http } from '../../../shared/api/http';
import type { TrackComment, TrackEngagement } from '../types';
import { getStatusCode } from '../../../shared/lib/feedback';

type LikeResult = {
  liked: boolean;
  likesCount: number;
};

type RatingResult = {
  myRating: number;
  ratingAverage: number | null;
  ratingCount: number;
};

function parseData<T>(res: AxiosResponse) {
  return (res.data?.data ?? res.data) as T;
}

async function withTrackRouteFallback<T>(
  primaryRequest: () => Promise<AxiosResponse>,
  fallbackRequest: () => Promise<AxiosResponse>
) {
  try {
    return parseData<T>(await primaryRequest());
  } catch (error: unknown) {
    const status = getStatusCode(error);
    if (status === 404 || status === 405) {
      return parseData<T>(await fallbackRequest());
    }
    throw error;
  }
}

export const publicTrackEngagementApi = {
  async getEngagement(projectId: string, trackId: string) {
    return withTrackRouteFallback<TrackEngagement>(
      () => http.get(`/projects/public/${projectId}/tracks/${trackId}/engagement`),
      () => http.get(`/projects/${projectId}/tracks/${trackId}/engagement`)
    );
  },

  async getComments(projectId: string, trackId: string) {
    return withTrackRouteFallback<TrackComment[]>(
      () => http.get(`/projects/public/${projectId}/tracks/${trackId}/comments`),
      () => http.get(`/projects/${projectId}/tracks/${trackId}/comments`)
    );
  },

  async createComment(projectId: string, trackId: string, body: string) {
    return withTrackRouteFallback<TrackComment>(
      () =>
        http.post(`/projects/public/${projectId}/tracks/${trackId}/comments`, {
          body,
        }),
      () =>
        http.post(`/projects/${projectId}/tracks/${trackId}/comments`, {
          body,
        })
    );
  },

  async like(projectId: string, trackId: string) {
    return withTrackRouteFallback<LikeResult>(
      () => http.post(`/projects/public/${projectId}/tracks/${trackId}/like`),
      () => http.post(`/projects/${projectId}/tracks/${trackId}/like`)
    );
  },

  async unlike(projectId: string, trackId: string) {
    return withTrackRouteFallback<LikeResult>(
      () => http.delete(`/projects/public/${projectId}/tracks/${trackId}/like`),
      () => http.delete(`/projects/${projectId}/tracks/${trackId}/like`)
    );
  },

  async rate(projectId: string, trackId: string, value: number) {
    return withTrackRouteFallback<RatingResult>(
      () =>
        http.post(`/projects/public/${projectId}/tracks/${trackId}/rating`, {
          value,
        }),
      () =>
        http.post(`/projects/${projectId}/tracks/${trackId}/rating`, {
          value,
        })
    );
  },
};
