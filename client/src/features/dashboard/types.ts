import type { Project } from '../projects/types';

export type DashboardStat = {
  label: string;
  value: string;
  helper: string;
};

export type DashboardSummary = {
  publicProjects: number;
  privateProjects: number;
  totalTracks: number;
  stats: DashboardStat[];
};

export type DashboardAction = {
  label: string;
  variant: 'contained' | 'outlined';
  onClick: () => void;
};

export type DashboardProject = Project;
