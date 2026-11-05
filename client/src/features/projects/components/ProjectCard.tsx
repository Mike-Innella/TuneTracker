import { Box, Button, Card, CardContent, Chip, Stack, Switch, Typography } from '@mui/material';
import type { Project } from '../types';
import {
  destructiveTextButtonSx,
  panelSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';

type ProjectCardProps = {
  project: Project;
  deletingProjectId: string | null;
  updatingVisibilityProjectId: string | null;
  onOpenProject: (projectId: string) => void;
  onOpenPublicView: (projectId: string) => void;
  onToggleVisibility: (projectId: string, visibility: 'PUBLIC' | 'PRIVATE') => void;
  onDeleteProject: (projectId: string, projectTitle: string) => void;
};

export default function ProjectCard({
  project,
  deletingProjectId,
  updatingVisibilityProjectId,
  onOpenProject,
  onOpenPublicView,
  onToggleVisibility,
  onDeleteProject,
}: ProjectCardProps) {
  const isPublic = project.visibility?.toUpperCase() === 'PUBLIC';
  const isUpdatingVisibility = updatingVisibilityProjectId === project.id;
  const shouldDisableCardActions = Boolean(deletingProjectId) || isUpdatingVisibility;

  return (
    <Card
      elevation={0}
      onClick={() => {
        if (deletingProjectId) return;
        onOpenProject(project.id);
      }}
      sx={[
        panelSx,
        {
          cursor: deletingProjectId ? 'default' : 'pointer',
          borderRadius: '24px',
          minHeight: { xs: 0, sm: 234 },
          transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
          '&:hover': {
            borderColor: 'rgba(140, 154, 255, 0.26)',
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 44px rgba(0,0,0,0.38)',
          },
        },
      ]}
    >
      <CardContent
        sx={{
          p: { xs: 2.25, sm: 3 },
          height: '100%',
          '&:last-child': {
            pb: { xs: 2.25, sm: 3 },
          },
        }}
      >
        <Stack sx={{ height: '100%' }} spacing={2}>
          <Typography
            variant="h5"
            sx={{
              ...wrapAnywhereSx,
              fontSize: { xs: 24, md: 28 },
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            {project.title}
          </Typography>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={isPublic ? 'Public' : 'Private'}
                sx={{
                  width: 'fit-content',
                  fontSize: 13,
                  backgroundColor: isPublic ? 'rgba(111, 99, 255, 0.18)' : 'rgba(255,255,255,0.05)',
                  color: isPublic ? '#cfc7ff' : '#d7dcff',
                  border: isPublic
                    ? '1px solid rgba(111, 99, 255, 0.24)'
                    : '1px solid rgba(255,255,255,0.08)',
                  '& .MuiChip-label': {
                    px: 1.2,
                    fontWeight: 600,
                  },
                }}
              />

              <Switch
                size="small"
                checked={isPublic}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onChange={() => {
                  onToggleVisibility(project.id, isPublic ? 'PRIVATE' : 'PUBLIC');
                }}
                disabled={shouldDisableCardActions}
                inputProps={{
                  'aria-label': `Toggle project visibility for ${project.title}`,
                }}
              />

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {isPublic ? 'Shared publicly' : 'Private only'}
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              useFlexGap
              sx={{ mt: 1.25, width: '100%' }}
            >

              <Button
                size="small"
                variant="text"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenPublicView(project.id);
                }}
                disabled={!isPublic || shouldDisableCardActions}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Public View
              </Button>

              <Button
                size="small"
                color="error"
                variant="text"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteProject(project.id, project.title);
                }}
                disabled={Boolean(deletingProjectId) || isUpdatingVisibility}
                sx={[destructiveTextButtonSx, { width: { xs: '100%', sm: 'fit-content' } }]}
              >
                {deletingProjectId === project.id ? 'Deleting...' : 'Delete'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              pt: 1.5,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tracks
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              {project.trackCount ?? project._count?.tracks ?? 0}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <span>Open Project</span>
            <span>→</span>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
