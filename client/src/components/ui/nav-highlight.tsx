'use client';

import { Highlight, HighlightItem } from '@animate-ui/react/primitives/effects/highlight';
import { spring } from '@animate-ui/react/utils/motion';
import { cn } from '@/lib/utils';

/**
 * One surface gliding to the active item (Animate UI Highlight, spring.selection).
 * Items are links: the highlight follows the route, not clicks, so keyboard and back/forward match.
 */
export function NavHighlight({
  value,
  className,
  children,
}: {
  value: string | null;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Highlight
      controlledItems
      value={value}
      click={false}
      transition={spring.selection}
      className={className}
    >
      {children}
    </Highlight>
  );
}

export function NavHighlightItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <HighlightItem value={value} className={cn('relative', className)}>
      {children}
    </HighlightItem>
  );
}
