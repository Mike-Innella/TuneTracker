import type { Metadata } from 'next';
import { Suspense } from 'react';
import { boards, requireProfile } from '@tunetracker/server';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { or404 } from '@/lib/or-404';

export const metadata: Metadata = { title: 'Board' };

export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const me = await requireProfile();
  const board = await or404(boards.getBoard(me.id, projectId));
  return (
    <Suspense>
      <KanbanBoard board={board} />
    </Suspense>
  );
}
