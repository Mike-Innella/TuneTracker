'use client';

import { useTheme } from 'next-themes';
import { MoonIcon } from '@/components/animate-ui/icons/moon';
import { SunIcon } from '@/components/animate-ui/icons/sun';
import { ThemeTogglerButton, ThemeTogglerButtonIcon } from '@/components/animate-ui/buttons/theme-toggler';

/** Animate UI theme toggler: the icon turns into the next theme's with a blur-bridged swap. */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <ThemeTogglerButton
      variant="ghost"
      size="lg"
      modes={['dark', 'light']}
      theme={(theme ?? 'dark') as 'dark' | 'light' | 'system'}
      resolvedTheme={resolvedTheme === 'light' ? 'light' : 'dark'}
      setTheme={setTheme}
      // static label: the server cannot know the resolved theme (avoids a hydration mismatch)
      aria-label="Toggle dark and light theme"
      data-testid="theme-toggle"
    >
      <ThemeTogglerButtonIcon light={<SunIcon />} dark={<MoonIcon />} />
    </ThemeTogglerButton>
  );
}
