import { Box, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import DashboardQuickActionsCard from '../components/DashboardQuickActionsCard';
import DashboardRecentProjectsCard from '../components/DashboardRecentProjectsCard';
import DashboardSnapshotCard from '../components/DashboardSnapshotCard';
import { useDashboardData } from '../useDashboardData';
import type { DashboardAction } from '../types';
import { useAuth } from '../../auth/state/useAuth';
import { pageShellSx } from '../../../app/theme/uiStyles';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error, loading, recentProjects, summary, welcomeName } = useDashboardData(user);

  const quickActions: DashboardAction[] = [
    {
      label: 'Manage My Projects',
      variant: 'contained',
      onClick: () => navigate('/projects'),
    },
    {
      label: 'Browse Public Feed',
      variant: 'outlined',
      onClick: () => navigate('/feed'),
    },
    {
      label: 'Update Profile',
      variant: 'outlined',
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <Box className="page-wrap" sx={pageShellSx}>
      <Stack spacing={3}>
        <DashboardHeader
          welcomeName={welcomeName}
          onEditProfile={() => navigate('/profile')}
          onOpenProjects={() => navigate('/projects')}
        />

        <DashboardSnapshotCard summary={summary} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1.4fr 1fr' },
            gap: 3,
          }}
        >
          <DashboardRecentProjectsCard
            error={error}
            loading={loading}
            projects={recentProjects}
            onCreateProject={() => navigate('/projects')}
            onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
          />

          <DashboardQuickActionsCard actions={quickActions} publicProjects={summary.publicProjects} />
        </Box>
      </Stack>
    </Box>
  );
}
