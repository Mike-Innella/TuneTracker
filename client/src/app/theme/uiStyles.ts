import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

export const pageShellSx: SystemStyleObject<Theme> = {
  minHeight: '100vh',
  px: 0,
  py: { xs: 2.5, sm: 3, md: 4 },
  position: 'relative',
};

export const pageHeaderSx: SystemStyleObject<Theme> = {
  mb: { xs: 3, md: 4 },
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: { xs: 1.5, md: 2 },
  flexWrap: 'wrap',
};

export const panelSx = (theme: Theme): SystemStyleObject<Theme> => ({
  p: { xs: 2, md: 3 },
  borderRadius: `${theme.shape.borderRadius}px`,
  background: 'linear-gradient(180deg, #151520 0%, #111118 100%)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 16px 40px rgba(0,0,0,0.34)',
  backdropFilter: 'blur(10px)',
});

export const glowTitleSx: SystemStyleObject<Theme> = {
  fontWeight: 700,
  letterSpacing: '-0.04em',
  color: '#7568ff',
};

export const mutedTextSx: SystemStyleObject<Theme> = {
  color: 'text.secondary',
};

export const sectionTitleSx: SystemStyleObject<Theme> = {
  fontWeight: 700,
  letterSpacing: '-0.03em',
  mb: 2,
};

export const fullWidthPrimaryButtonSx: SystemStyleObject<Theme> = {
  minHeight: 52,
  width: '100%',
};

export const responsiveActionButtonSx: SystemStyleObject<Theme> = {
  width: { xs: '100%', sm: 'auto' },
};

export const responsiveActionStackSx: SystemStyleObject<Theme> = {
  width: { xs: '100%', sm: 'auto' },
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: { xs: 'stretch', sm: 'center' },
  flexWrap: 'wrap',
};

export const wrapAnywhereSx: SystemStyleObject<Theme> = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

export const subtleOutlinedButtonSx: SystemStyleObject<Theme> = {
  minHeight: 44,
};

export const destructiveButtonSx: SystemStyleObject<Theme> = {
  borderColor: 'rgba(239, 83, 80, 0.55)',
  color: '#ffc3c2',
  '&:hover': {
    borderColor: '#ef5350',
    backgroundColor: 'rgba(239, 83, 80, 0.16)',
    color: '#ffd7d6',
  },
};

export const destructiveTextButtonSx: SystemStyleObject<Theme> = {
  ...destructiveButtonSx,
  minWidth: 0,
  px: 1.25,
  py: 0.3,
  borderRadius: 1,
  lineHeight: 1.2,
};
