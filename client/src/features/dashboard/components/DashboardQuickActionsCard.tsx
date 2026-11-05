import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import {
  panelSx,
  responsiveActionButtonSx,
  sectionTitleSx,
} from '../../../app/theme/uiStyles';
import type { DashboardAction } from '../types';
import { getShareStatusMessage } from '../utils';

type DashboardQuickActionsCardProps = {
  actions: DashboardAction[];
  publicProjects: number;
};

export default function DashboardQuickActionsCard({
  actions,
  publicProjects,
}: DashboardQuickActionsCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px' }]}>
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Quick Actions
        </Typography>

        <Stack spacing={1.5}>
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
              sx={responsiveActionButtonSx}
            >
              {action.label}
            </Button>
          ))}
        </Stack>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: '18px',
            background:
              'linear-gradient(180deg, rgba(111,99,255,0.15) 0%, rgba(111,99,255,0.05) 100%)',
            border: '1px solid rgba(111,99,255,0.22)',
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Share status</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            {getShareStatusMessage(publicProjects)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
