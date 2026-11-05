import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import {
  glowTitleSx,
  mutedTextSx,
  pageHeaderSx,
  wrapAnywhereSx,
} from '../../app/theme/uiStyles';

type PageIntroProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  centered?: boolean;
};

export default function PageIntro({
  title,
  description,
  actions,
  centered = false,
}: PageIntroProps) {
  return (
    <Box
      sx={{
        ...pageHeaderSx,
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: centered ? 'center' : 'space-between',
        textAlign: centered ? 'center' : 'left',
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 280px' }}>
        <Typography
          variant="h3"
          sx={{
            ...glowTitleSx,
            ...wrapAnywhereSx,
            fontSize: { xs: 30, sm: 40, md: 46 },
            mb: 0.75,
          }}
        >
          {title}
        </Typography>

        {description ? (
          <Typography
            sx={{
              ...mutedTextSx,
              ...wrapAnywhereSx,
              maxWidth: centered ? 720 : 680,
              fontSize: { xs: '0.95rem', sm: '1rem' },
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>

      {actions ? (
        <Box
          sx={{
            width: { xs: '100%', sm: 'auto' },
            maxWidth: '100%',
            '& > *': {
              width: { xs: '100%', sm: 'auto' },
              maxWidth: '100%',
            },
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
