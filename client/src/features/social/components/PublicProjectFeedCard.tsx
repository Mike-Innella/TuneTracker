import { Avatar, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { PublicProject, SocialAuthor } from '../types';
import { mutedTextSx, panelSx, wrapAnywhereSx } from '../../../app/theme/uiStyles';

type PublicProjectFeedCardProps = {
  project: PublicProject;
  onOwnerAvatarClick?: (author: SocialAuthor) => void;
};

function ownerLabel(project: PublicProject) {
  return project.owner?.displayName || project.owner?.email || 'Unknown creator';
}

export default function PublicProjectFeedCard({
  project,
  onOwnerAvatarClick,
}: PublicProjectFeedCardProps) {
  const owner = project.owner;
  const canOpenOwnerProfile = Boolean(onOwnerAvatarClick && owner?.id);

  const openOwnerProfile = () => {
    if (!owner || !onOwnerAvatarClick) return;
    onOwnerAvatarClick(owner);
  };

  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '20px' }]}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={project.owner?.profileImageData || undefined}
              alt={ownerLabel(project)}
              onClick={
                canOpenOwnerProfile ? openOwnerProfile : undefined
              }
              onKeyDown={(event) => {
                if (!canOpenOwnerProfile) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openOwnerProfile();
                }
              }}
              role={canOpenOwnerProfile ? 'button' : undefined}
              tabIndex={canOpenOwnerProfile ? 0 : undefined}
              sx={{
                width: 34,
                height: 34,
                transition: 'transform 140ms ease, filter 140ms ease, opacity 140ms ease',
                ...(canOpenOwnerProfile
                  ? {
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.04)',
                        filter: 'brightness(1.06)',
                      },
                    }
                  : {}),
              }}
            >
              {ownerLabel(project).charAt(0).toUpperCase()}
            </Avatar>
            <Typography sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>{ownerLabel(project)}</Typography>
          </Stack>

          <Typography sx={{ ...wrapAnywhereSx, fontSize: { xs: 22, sm: 26 }, fontWeight: 700, letterSpacing: '-0.03em' }}>
            {project.title}
          </Typography>

          <Typography sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
            {project.description || 'No description provided.'}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" sx={mutedTextSx}>
              Tracks: {project.trackCount ?? project._count?.tracks ?? 0}
            </Typography>
            <Button
              component={RouterLink}
              to={`/public/${project.id}`}
              size="small"
              variant="text"
            >
              Open Project
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
