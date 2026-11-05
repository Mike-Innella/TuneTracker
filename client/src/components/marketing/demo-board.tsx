'use client';

import { useId, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Effect } from '@animate-ui/react/primitives/effects/effect';
import type { BoardTask } from '@tunetracker/server';
import { TaskCard } from '@/components/kanban/task-card';
import { applyMove, findTask, type Col } from '@/components/kanban/board-state';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

// Synthetic demonstration data — labelled as a demo in the UI.
const t = (id: string, title: string, extra: Partial<BoardTask> = {}): BoardTask =>
  ({
    id,
    title,
    projectId: 'demo',
    columnId: 'demo',
    description: null,
    priority: 'MEDIUM',
    position: 0,
    dueDate: null,
    assigneeId: null,
    bpm: null,
    musicalKey: null,
    archivedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    labels: [],
    assignee: null,
    checklistDone: 0,
    checklistTotal: 0,
    commentCount: 0,
    attachmentCount: 0,
    ...extra,
  }) as BoardTask;

const label = (name: string, color: string) => ({ id: name, name, color, projectId: 'demo' });

const INITIAL: Col<BoardTask>[] = [
  {
    id: 'ideas',
    title: 'Ideas',
    tasks: [
      t('d1', 'Chord loop in F#m', { bpm: 118, musicalKey: 'F#m', labels: [label('keys', '#22d3ee')] }),
      t('d2', 'Find a vocal chop', { priority: 'LOW', attachmentCount: 3 }),
    ],
  },
  {
    id: 'mix',
    title: 'Mixing',
    tasks: [
      t('d3', 'Sidechain the bass to the kick', {
        priority: 'HIGH',
        checklistDone: 2,
        checklistTotal: 3,
        commentCount: 4,
      }),
      t('d4', 'Automate the filter sweep', { labels: [label('fx', '#a46bff')] }),
    ],
  },
  {
    id: 'master',
    title: 'Mastered',
    tasks: [t('d5', 'Reference against the last single', { checklistDone: 1, checklistTotal: 1 })],
  },
];

export function DemoBoard() {
  const [cols, setCols] = useState(INITIAL);
  const [active, setActive] = useState<string | null>(null);
  const dndId = useId(); // stable across SSR/CSR (dnd-kit's counter is not)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragOver({ active: a, over }: DragOverEvent) {
    if (!over) return;
    const from = findTask(cols, String(a.id));
    const to = String(over.data.current?.columnId ?? over.id);
    if (!from || from.columnId === to) return;
    const target = cols.find((c) => c.id === to);
    if (!target) return;
    const idx = target.tasks.findIndex((x) => x.id === over.id);
    setCols((c) => applyMove(c, String(a.id), to, idx < 0 ? target.tasks.length : idx));
  }

  function onDragEnd({ active: a, over }: DragEndEvent) {
    setActive(null);
    const loc = findTask(cols, String(a.id));
    if (!over || !loc || over.id === a.id || over.data.current?.type !== 'task') return;
    const col = cols.find((c) => c.id === loc.columnId)!;
    const idx = col.tasks.findIndex((x) => x.id === over.id);
    if (idx >= 0) setCols(applyMove(cols, String(a.id), loc.columnId, idx));
  }

  const lifted = active ? cols.flatMap((c) => c.tasks).find((x) => x.id === active) : null;

  return (
    <figure className="relative" aria-label="Interactive demo board with example tasks">
      <div className="sheet relative overflow-hidden p-4 shadow-(--shadow-lift) sm:p-5">
        <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <span className="flex items-center gap-3">
            <LogoMark size={40} className="drop-shadow-[0_0_18px_rgb(58_107_255/0.55)]" />
            <span>
              <span className="type-title block text-xl">Midnight Drive</span>
              <span className="type-role text-muted-foreground">Production · 3 collaborators</span>
            </span>
          </span>
          <span className="type-role rounded-full border border-rule px-2.5 py-1 text-ink-soft">
            Demo board — try dragging
          </span>
        </figcaption>
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActive(String(e.active.id))}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {cols.map((c, i) => (
              <DemoColumn key={c.id} col={c} index={i} />
            ))}
          </div>
          <DragOverlay>
            {lifted ? <TaskCard task={lifted} lifted className="rotate-[-1.5deg]" /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </figure>
  );
}

function DemoColumn({ col, index }: { col: Col<BoardTask>; index: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id, data: { columnId: col.id } });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${col.title} column`}
      className={cn(
        'flex min-h-40 flex-col gap-2 rounded-md border border-border bg-stock-2/60 p-2 transition-colors',
        isOver && 'bg-accent/40',
      )}
    >
      <h3 className="type-role flex justify-between px-1 pt-1 text-muted-foreground">
        {col.title}
        <span className="type-figure">{col.tasks.length}</span>
      </h3>
      <SortableContext items={col.tasks.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        {col.tasks.map((task, i) => (
          <Effect
            key={task.id}
            fade={{ initialOpacity: 0.35 }}
            slide={{ direction: 'up', offset: 10 }}
            blur={{ initialBlur: 2 }}
            delay={150 + index * 80 + i * 60}
          >
            <DemoTask task={task} columnId={col.id} />
          </Effect>
        ))}
      </SortableContext>
    </section>
  );
}

function DemoTask({ task, columnId }: { task: BoardTask; columnId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId },
  });
  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      dropSlot={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="cursor-grab"
      {...attributes}
      {...listeners}
      aria-label={`Drag ${task.title}`}
    />
  );
}
