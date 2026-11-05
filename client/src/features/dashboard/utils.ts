import type { AuthUser } from '../auth/state/auth-types';
import type { Project } from '../projects/types';
import type { DashboardSummary } from './types';

function getVisibility(project: Project) {
  return project.visibility?.toUpperCase() === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';
}

export function formatWelcomeName(user?: Pick<AuthUser, 'displayName' | 'email'> | null) {
  if (user?.displayName?.trim()) return user.displayName.trim();
  if (user?.email?.trim()) return user.email.split('@')[0];
  return 'Producer';
}

export function getDashboardSummary(projects: Project[]): DashboardSummary {
  const publicProjects = projects.filter((project) => getVisibility(project) === 'PUBLIC').length;
  const privateProjects = projects.length - publicProjects;
  const totalTracks = projects.reduce((sum, project) => sum + (project.trackCount ?? 0), 0);

  return {
    publicProjects,
    privateProjects,
    totalTracks,
    stats: [
      {
        label: 'Projects',
        value: String(projects.length),
        helper: projects.length === 1 ? '1 active workspace' : 'Active workspaces',
      },
      {
        label: 'Tracks',
        value: String(totalTracks),
        helper: totalTracks === 1 ? '1 track across all boards' : 'Tracks across all boards',
      },
      {
        label: 'Public',
        value: String(publicProjects),
        helper:
          publicProjects === 1 ? '1 project shared publicly' : 'Projects shared publicly',
      },
      {
        label: 'Private',
        value: String(privateProjects),
        helper:
          privateProjects === 1 ? '1 private workspace' : 'Private workspaces in progress',
      },
    ],
  };
}

export function getRecentProjects(projects: Project[], limit = 4) {
  return projects.slice(0, limit);
}

export function getSnapshotMessage(totalTracks: number) {
  if (totalTracks <= 0) {
    return 'Start by creating a project and adding your first track.';
  }

  return `You have ${totalTracks} tracked ${totalTracks === 1 ? 'item' : 'items'} ready to review.`;
}

export function getTrackCountLabel(trackCount: number) {
  return `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;
}

export function getShareStatusMessage(publicProjects: number) {
  if (publicProjects <= 0) {
    return 'All of your projects are private right now.';
  }

  return `You currently have ${publicProjects} public ${
    publicProjects === 1 ? 'project' : 'projects'
  } visible in the feed.`;
}

export function isPublicProject(project: Project) {
  return getVisibility(project) === 'PUBLIC';
}
