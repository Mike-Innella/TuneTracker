'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ProjectTabs({ projectId }: { projectId: string }) {
  const path = usePathname();
  const tabs = [
    { href: `/projects/${projectId}/board`, label: 'Board' },
    { href: `/projects/${projectId}`, label: 'Overview & team' },
  ];
  return (
    <nav aria-label="Project sections" className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
              active
                ? 'border-electric text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
