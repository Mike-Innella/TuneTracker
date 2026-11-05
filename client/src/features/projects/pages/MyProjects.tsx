import { useEffect, useState } from 'react';
import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import ProjectCreateBar from '../components/ProjectCreateBar';
import ProjectsEmptyState from '../components/ProjectsEmptyState';
import { projectsApi } from '../api/projectsApi';
import type { Project } from '../types';
import { pageShellSx } from '../../../app/theme/uiStyles';
import { getErrorMessage } from '../../../shared/lib/feedback';
import InlineNotice from '../../../shared/ui/InlineNotice';
import PageIntro from '../../../shared/ui/PageIntro';

export default function MyProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [updatingVisibilityProjectId, setUpdatingVisibilityProjectId] = useState<string | null>(
    null
  );

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const nextProjects = await projectsApi.getMyProjects();
      setProjects(nextProjects);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load projects'));
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    setCreating(true);
    setError(null);

    try {
      await projectsApi.createProject(title);
      setTitle('');
      await loadProjects();
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to create project'));
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(projectId: string, projectTitle: string) {
    if (deletingProjectId) return;

    const confirmed = window.confirm(`Delete ${projectTitle || 'this project'}?`);
    if (!confirmed) return;

    setDeletingProjectId(projectId);
    setError(null);

    try {
      await projectsApi.deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to delete project'));
    } finally {
      setDeletingProjectId(null);
    }
  }

  async function updateProjectVisibility(projectId: string, visibility: 'PUBLIC' | 'PRIVATE') {
    if (updatingVisibilityProjectId || deletingProjectId) return;

    setUpdatingVisibilityProjectId(projectId);
    setError(null);

    try {
      const updatedProject = await projectsApi.updateVisibility(projectId, visibility);

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                visibility:
                  updatedProject.visibility && typeof updatedProject.visibility === 'string'
                    ? updatedProject.visibility
                    : visibility,
              }
            : project
        )
      );
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to update project visibility'));
    } finally {
      setUpdatingVisibilityProjectId(null);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  return (
    <Box sx={{ pb: 4 }}>
      <Box className="page-wrap" sx={pageShellSx}>
        <Stack spacing={3}>
          <PageIntro
            title="My Projects"
            description={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
          />

          <ProjectCreateBar
            title={title}
            creating={creating}
            onTitleChange={setTitle}
            onCreate={() => {
              void createProject();
            }}
          />

          {loading && <InlineNotice loading>Loading projects...</InlineNotice>}
          {error && <InlineNotice severity="error">{error}</InlineNotice>}

          {!loading && !error && projects.length === 0 && <ProjectsEmptyState />}

          {projects.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  deletingProjectId={deletingProjectId}
                  updatingVisibilityProjectId={updatingVisibilityProjectId}
                  onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
                  onOpenPublicView={(projectId) => navigate(`/public/${projectId}`)}
                  onToggleVisibility={(projectId, visibility) => {
                    void updateProjectVisibility(projectId, visibility);
                  }}
                  onDeleteProject={(projectId, projectTitle) => {
                    void deleteProject(projectId, projectTitle);
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
