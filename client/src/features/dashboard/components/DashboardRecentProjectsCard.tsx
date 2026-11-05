import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { panelSx, sectionTitleSx } from '../../../app/theme/uiStyles';
import InlineNotice from '../../../shared/ui/InlineNotice';
import type { DashboardProject } from '../types';
import { getTrackCountLabel, isPublicProject } from '../utils';

type DashboardRecentProjectsCardProps = {
  error: string | null;
  loading: boolean;
  projects: DashboardProject[];
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
};

const projectRowSx = {
  display: 'flex',
  alignItems: { xs: 'stretch', sm: 'center' },
  justifyContent: 'space-between',
  gap: 2,
  p: 2,
  flexDirection: { xs: 'column', sm: 'row' },
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.08)',
  backgroundColor: 'rgba(255,255,255,0.025)',
} as const;

export default function DashboardRecentProjectsCard({
  error,
  loading,
  projects,
  onCreateProject,
  onOpenProject,
}: DashboardRecentProjectsCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Recent Projects
        </Typography>

        {loading && <InlineNotice loading>Loading dashboard...</InlineNotice>}
        {error && <InlineNotice severity="error">{error}</InlineNotice>}

        {!loading && !error && projects.length === 0 && (
          <Stack spacing={1.25}>
            <InlineNotice>No projects yet.</InlineNotice>
            <Button variant="outlined" onClick={onCreateProject} sx={{ alignSelf: 'flex-start' }}>
              Create your first project
            </Button>
          </Stack>
        )}

        {!loading && !error && projects.length > 0 && (
          <Stack spacing={1.5}>
            {projects.map((project) => {
              const isPublic = isPublicProject(project);
              const trackCount = project.trackCount ?? 0;

              return (
                <Box key={project.id} sx={projectRowSx}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>{project.title}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.52)', fontSize: 13, mt: 0.5 }}>
                      {getTrackCountLabel(trackCount)}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    <Chip
                      label={isPublic ? 'Public' : 'Private'}
                      size="small"
                      sx={{
                        backgroundColor: isPublic
                          ? 'rgba(97, 232, 169, 0.14)'
                          : 'rgba(255,255,255,0.08)',
                        color: isPublic ? '#9ef0c4' : 'rgba(255,255,255,0.78)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <Button
                      variant="text"
                      onClick={() => onOpenProject(project.id)}
                      sx={{ minWidth: 0, px: 1, ml: { xs: 'auto', sm: 0 } }}
                    >
                      Open
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
