'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { setThemeAction } from '@/features/profile/actions';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'dark', label: 'Midnight', hint: 'Default dark theme', icon: Moon },
  { value: 'light', label: 'Day', hint: 'Light theme', icon: Sun },
  { value: 'system', label: 'System', hint: 'Follow your device', icon: Monitor },
] as const;

/** Theme lives in localStorage (instant) and on the profile (follows you across devices). */
export function AppearanceSettings({ saved }: { saved: string }) {
  const { theme, setTheme } = useTheme();
  // true on the client, false during SSR — theme is only known in the browser
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // first visit on a new device: adopt the profile's saved preference
  useEffect(() => {
    if (mounted && !localStorage.getItem('theme') && saved !== theme) setTheme(saved);
  }, [mounted, saved, theme, setTheme]);

  const current = mounted ? theme : saved;
  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map(({ value, label, hint, icon: Icon }) => {
        const on = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            data-testid={`theme-${value}`}
            onClick={() => {
              setTheme(value);
              void setThemeAction(value);
            }}
            className={cn(
              'sheet flex items-center gap-3 p-4 text-left transition-colors',
              on ? 'border-electric' : 'hover:border-rule',
            )}
          >
            <Icon className={cn('size-5', on ? 'text-electric' : 'text-ink-soft')} aria-hidden />
            <span>
              <span className="block font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
