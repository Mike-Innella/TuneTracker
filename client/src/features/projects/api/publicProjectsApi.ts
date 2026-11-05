import { http } from '../../../shared/api/http';
import type { PublicProject } from '../../social/types';

type PublicProjectsResponse = {
  data: PublicProject[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const publicProjectsApi = {
  async getPublicProjects(params?: { page?: number; limit?: number; q?: string }) {
    const res = await http.get('/projects/public', { params });
    return (res.data?.data ? res.data : res.data) as PublicProjectsResponse;
  },
};
