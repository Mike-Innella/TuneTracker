'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NavHighlight, NavHighlightItem } from './nav-highlight';

/** Route tabs: one underline gliding to the active link (Animate UI Highlight). */
export function TabLinks({
  label,
  items,
  className,
}: {
  label: string;
  items: { href: string; label: React.ReactNode; active: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn('border-b border-border', className)}>
      <NavHighlight
        value={items.find((i) => i.active)?.href ?? null}
        className="inset-x-0 -bottom-px h-0.5 rounded-full bg-electric"
      >
        <ul className="flex gap-1 overflow-x-auto">
          {items.map((item) => (
            <NavHighlightItem key={item.href} value={item.href} className="shrink-0" as="li">
              <Link
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'relative z-10 block px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  item.active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            </NavHighlightItem>
          ))}
        </ul>
      </NavHighlight>
    </nav>
  );
}
