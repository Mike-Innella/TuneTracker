import { Box } from '@mui/material';
import InlineNotice from './InlineNotice';

export default function RouteLoadingState() {
  return (
    <Box
      className="page-wrap page-wrap-narrow"
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'grid',
        alignItems: 'start',
        pt: { xs: 2, sm: 3 },
      }}
    >
      <InlineNotice loading sx={{ width: '100%' }}>
        Loading workspace...
      </InlineNotice>
    </Box>
  );
}
