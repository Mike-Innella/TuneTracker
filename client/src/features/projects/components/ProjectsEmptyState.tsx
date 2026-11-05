import { Box, Typography } from '@mui/material';
import { mutedTextSx, panelSx } from '../../../app/theme/uiStyles';

export default function ProjectsEmptyState() {
  return (
    <Box
      sx={[
        panelSx,
        {
          textAlign: 'center',
          py: { xs: 4.5, sm: 6 },
        },
      ]}
    >
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
        No projects yet
      </Typography>

      <Typography sx={mutedTextSx}>
        Create your first project above to start organizing ideas, drafts, and mixes.
      </Typography>
    </Box>
  );
}
