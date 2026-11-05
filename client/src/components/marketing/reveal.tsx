'use client';

import { Effect } from '@animate-ui/react/primitives/effects/effect';

/**
 * The "needle drop": rows fade up out of a light blur once, as they scroll into view
 * (Animate UI Effect, page-recipe values; movement drops under reduced motion).
 */
export function Reveal({
  as = 'div',
  index = 0,
  className,
  children,
}: {
  as?: 'div' | 'li';
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = as;
  return (
    <Effect
      asChild
      inView
      fade
      slide={{ direction: 'up', offset: 12 }}
      blur={{ initialBlur: 2 }}
      delay={index * 80}
    >
      <Tag className={className}>{children}</Tag>
    </Effect>
  );
}
