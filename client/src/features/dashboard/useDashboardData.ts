import { useEffect, useMemo, useState } from 'react';
import { projectsApi } from '../projects/api/projectsApi';
import type { Project } from '../projects/types';
import type { AuthUser } from '../auth/state/auth-types';
import { getErrorMessage } from '../../shared/lib/feedback';
import { formatWelcomeName, getDashboardSummary, getRecentProjects } from './utils';

function getDashboardError(error: unknown) {
  return getErrorMessage(error, 'Failed to load dashboard');
}

export function useDashboardData(user: AuthUser | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      setLoading(true);
      setError(null);

      try {
        const nextProjects = await projectsApi.getMyProjects();
        if (!active) return;
        setProjects(nextProjects);
      } catch (fetchError: unknown) {
        if (!active) return;
        setError(getDashboardError(fetchError));
        setProjects([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => getDashboardSummary(projects), [projects]);
  const recentProjects = useMemo(() => getRecentProjects(projects), [projects]);
  const welcomeName = useMemo(() => formatWelcomeName(user), [user]);

  return {
    error,
    loading,
    projects,
    recentProjects,
    summary,
    welcomeName,
  };
}
