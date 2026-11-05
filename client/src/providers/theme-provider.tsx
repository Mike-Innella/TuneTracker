'use client';

import { ThemeProvider as NextThemes } from 'next-themes';
import { MotionConfig } from 'motion/react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {/* "user" honours prefers-reduced-motion for every Motion animation */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemes>
  );
}
