import { Avatar, Box, Stack, Typography } from '@mui/material';
import type { PublicProject } from '../types';
import { glowTitleSx, mutedTextSx, wrapAnywhereSx } from '../../../app/theme/uiStyles';

type PublicProjectHeaderProps = {
  project: PublicProject | null;
};

function ownerLabel(project: PublicProject) {
  return project.owner?.displayName || project.owner?.email || 'Unknown';
}

export default function PublicProjectHeader({ project }: PublicProjectHeaderProps) {
  return (
    <Box>
      {project?.owner && (
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1, minWidth: 0 }}>
          <Avatar
            src={project.owner.profileImageData || undefined}
            alt={ownerLabel(project)}
            sx={{ width: 34, height: 34 }}
          >
            {ownerLabel(project).charAt(0).toUpperCase()}
          </Avatar>
          <Typography sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>{ownerLabel(project)}</Typography>
        </Stack>
      )}

      <Typography
        variant="h3"
        sx={{
          ...glowTitleSx,
          ...wrapAnywhereSx,
          fontSize: { xs: 32, sm: 42, md: 48 },
          lineHeight: 1,
          mb: 1,
        }}
      >
        {project?.title || 'Public Project'}
      </Typography>

      <Typography sx={{ ...mutedTextSx, ...wrapAnywhereSx }}>
        {project?.description || 'No description provided.'}
      </Typography>
    </Box>
  );
}
