'use client';

import { usePathname } from 'next/navigation';
import { TabLinks } from '@/components/ui/tab-links';

export function ProjectTabs({ projectId }: { projectId: string }) {
  const path = usePathname();
  const board = `/projects/${projectId}/board`;
  const overview = `/projects/${projectId}`;
  return (
    <TabLinks
      label="Project sections"
      className="mb-6"
      items={[
        { href: board, label: 'Board', active: path === board },
        { href: overview, label: 'Overview & team', active: path === overview },
      ]}
    />
  );
}
