import { Box, Button, Stack, Typography } from '@mui/material';
import {
  glowTitleSx,
  mutedTextSx,
  pageHeaderSx,
  responsiveActionButtonSx,
  responsiveActionStackSx,
  wrapAnywhereSx,
} from '../../../app/theme/uiStyles';

type DashboardHeaderProps = {
  welcomeName: string;
  onEditProfile: () => void;
  onOpenProjects: () => void;
};

export default function DashboardHeader({
  welcomeName,
  onEditProfile,
  onOpenProjects,
}: DashboardHeaderProps) {
  return (
    <Box sx={pageHeaderSx}>
      <Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
        <Typography
          variant="h3"
          sx={{
            ...glowTitleSx,
            ...wrapAnywhereSx,
            fontSize: { xs: 34, sm: 42, md: 48 },
            mb: 0.75,
          }}
        >
          Dashboard
        </Typography>
        <Typography sx={{ ...mutedTextSx, ...wrapAnywhereSx, maxWidth: 720 }}>
          {`Welcome back, ${welcomeName}. Keep your sessions, shares, and next steps in one place.`}
        </Typography>
      </Box>

      <Stack spacing={1.25} useFlexGap sx={responsiveActionStackSx}>
        <Button variant="contained" onClick={onOpenProjects} sx={responsiveActionButtonSx}>
          Open Projects
        </Button>
        <Button variant="outlined" onClick={onEditProfile} sx={responsiveActionButtonSx}>
          Edit Profile
        </Button>
      </Stack>
    </Box>
  );
}
