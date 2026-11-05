import { http } from '../../../shared/api/http';
import type { Project } from '../types';

function normalizeProjectsResponse(data: unknown): Project[] {
  if (typeof data === 'object' && data !== null && Array.isArray((data as { projects?: unknown }).projects)) {
    return (data as { projects: Project[] }).projects;
  }
  if (Array.isArray(data)) return data as Project[];
  return [];
}

async function resolveTrackCount(project: Project) {
  try {
    const tracksRes = await http.get(`/projects/${project.id}/tracks`);
    const tracks = Array.isArray(tracksRes.data?.data)
      ? tracksRes.data.data
      : Array.isArray(tracksRes.data?.tracks)
        ? tracksRes.data.tracks
        : Array.isArray(tracksRes.data)
          ? tracksRes.data
          : [];
    return tracks.length;
  } catch {
    return project?._count?.tracks ?? 0;
  }
}

export const projectsApi = {
  async getMyProjects() {
    const res = await http.get('/projects');
    const projects = normalizeProjectsResponse(res.data);
    const withTrackCounts = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        trackCount: await resolveTrackCount(project),
      }))
    );
    return withTrackCounts;
  },

  async createProject(title: string) {
    await http.post('/projects', { title: title.trim() });
  },

  async deleteProject(projectId: string) {
    await http.delete(`/projects/${projectId}`);
  },

  async updateVisibility(projectId: string, visibility: 'PUBLIC' | 'PRIVATE') {
    const res = await http.patch(`/projects/${projectId}`, { visibility });
    return (res.data?.data ?? res.data) as Partial<Project>;
  },
};
