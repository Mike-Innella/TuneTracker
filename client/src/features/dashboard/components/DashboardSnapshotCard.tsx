import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { mutedTextSx, panelSx } from '../../../app/theme/uiStyles';
import type { DashboardSummary } from '../types';
import { getSnapshotMessage } from '../utils';

type DashboardSnapshotCardProps = {
  summary: DashboardSummary;
};

const statCardSx = {
  p: { xs: 1.75, sm: 2 },
  borderRadius: '18px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

export default function DashboardSnapshotCard({ summary }: DashboardSnapshotCardProps) {
  return (
    <Card elevation={0} sx={[panelSx, { borderRadius: '24px', overflow: 'hidden' }]}>
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.14em' }}>
              Session Snapshot
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, mb: 1 }}>
              Your workspace at a glance
            </Typography>
            <Typography sx={mutedTextSx}>{getSnapshotMessage(summary.totalTracks)}</Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {summary.stats.map((stat) => (
              <Box key={stat.label} sx={statCardSx}>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ mb: 0.25 }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.48)', fontSize: 13 }}>
                  {stat.helper}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
