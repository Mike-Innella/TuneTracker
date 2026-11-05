import type { ReactNode } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import type { SxProps, Theme } from '@mui/material/styles';

type InlineNoticeProps = {
  children: ReactNode;
  severity?: AlertColor;
  loading?: boolean;
  sx?: SxProps<Theme>;
};

export default function InlineNotice({
  children,
  severity = 'info',
  loading = false,
  sx,
}: InlineNoticeProps) {
  const baseSx: SxProps<Theme> = {
    alignItems: 'flex-start',
    lineHeight: 1.45,
    py: { xs: 0.9, sm: 1.1 },
    '& .MuiAlert-message': {
      minWidth: 0,
    },
    '& .MuiAlert-icon': {
      pt: loading ? 0.15 : 0,
    },
  };
  const resolvedSx: SxProps<Theme> = Array.isArray(sx)
    ? [baseSx, ...sx]
    : sx
      ? [baseSx, sx]
      : baseSx;

  return (
    <Alert
      severity={severity}
      icon={loading ? <CircularProgress color="inherit" size={18} /> : undefined}
      sx={resolvedSx}
    >
      {children}
    </Alert>
  );
}
