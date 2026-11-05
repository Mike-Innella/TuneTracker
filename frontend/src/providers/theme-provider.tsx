'use client';

import { ThemeProvider as NextThemes } from 'next-themes';
import { ReducedMotionConfig } from '@animate-ui/react/utils/motion';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {/* Animate UI's config: under reduced motion movement goes, fades and blurs stay */}
      <ReducedMotionConfig>{children}</ReducedMotionConfig>
    </NextThemes>
  );
}
