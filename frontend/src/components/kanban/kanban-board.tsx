'use client';

import { useId, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, GripVertical, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Board, BoardTask } from '@tunetracker/backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  addColumnAction,
  createTaskAction,
  deleteColumnAction,
  moveColumnAction,
  moveTaskAction,
  renameColumnAction,
} from '@/features/board/actions';
import { cn } from '@/lib/utils';
import { applyMove, findTask, moveColumnLocal, type Col } from './board-state';
import { TaskCard } from './task-card';
import { TaskSheet } from './task-sheet';

type Column = Col<BoardTask>;

export function KanbanBoard({ board }: { board: Board }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canEdit = board.role !== 'VIEWER';
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'task' | 'column' | null>(null);
  const snapshot = useRef<Column[] | null>(null);
  const [, start] = useTransition();
  const openTaskId = params.get('task');
  const dndId = useId(); // stable across SSR/CSR (dnd-kit's counter is not)

  // Server is the source of truth: adopt fresh props after refreshes unless a drag is in flight.
  const [seenBoard, setSeenBoard] = useState(board);
  if (board !== seenBoard && !activeId) {
    setSeenBoard(board);
    setColumns(board.columns);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);
  const titleOf = (id: string) => columns.flatMap((c) => c.tasks).find((t) => t.id === id)?.title ?? 'task';
  const colTitle = (id: string) => columns.find((c) => c.id === id)?.title ?? 'column';

  const setTaskParam = (taskId: string | null) => {
    const sp = new URLSearchParams(params);
    if (taskId) sp.set('task', taskId);
    else sp.delete('task');
    router.replace(`${pathname}${sp.size ? `?${sp}` : ''}`, { scroll: false });
  };

  function persistMove(taskId: string, before: Column[], after: Column[]) {
    const from = findTask(before, taskId);
    const to = findTask(after, taskId);
    if (!to || (from && from.columnId === to.columnId && from.index === to.index)) return;
    start(async () => {
      const res = await moveTaskAction(taskId, to.columnId, to.index);
      if (!res.ok) {
        setColumns(before);
        toast.error(`Couldn’t move the task: ${res.error}`);
      } else router.refresh();
    });
  }

  /** Accessible alternative to dragging (menu + keyboard). */
  function moveTo(taskId: string, toColumnId: string, toIndex: number) {
    const before = columns;
    const after = applyMove(before, taskId, toColumnId, toIndex);
    setColumns(after);
    persistMove(taskId, before, after);
  }

  function onDragStart(e: DragStartEvent) {
    snapshot.current = columns;
    setActiveId(String(e.active.id));
    setActiveType(e.active.data.current?.type ?? 'task');
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over || active.data.current?.type !== 'task') return;
    const overType = over.data.current?.type;
    const from = findTask(columns, String(active.id));
    if (!from) return;
    const toColumnId =
      overType === 'column-drop' || overType === 'column'
        ? String(over.data.current?.columnId ?? over.id)
        : over.data.current?.columnId;
    if (!toColumnId || toColumnId === from.columnId) return;
    const target = columns.find((c) => c.id === toColumnId);
    if (!target) return;
    const overIndex =
      overType === 'task' ? target.tasks.findIndex((t) => t.id === over.id) : target.tasks.length;
    setColumns((cols) =>
      applyMove(cols, String(active.id), toColumnId, overIndex < 0 ? target.tasks.length : overIndex),
    );
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const before = snapshot.current ?? columns;
    setActiveId(null);
    setActiveType(null);
    snapshot.current = null;
    if (!over) {
      setColumns(before);
      return;
    }
    if (active.data.current?.type === 'column') {
      const from = columnIds.indexOf(String(active.id));
      const overCol = String(over.data.current?.columnId ?? over.id);
      const to = columnIds.indexOf(overCol);
      if (from < 0 || to < 0 || from === to) return;
      setColumns(moveColumnLocal(columns, from, to));
      start(async () => {
        const res = await moveColumnAction(String(active.id), to);
        if (!res.ok) {
          setColumns(before);
          toast.error(res.error);
        } else router.refresh();
      });
      return;
    }
    // same-column reorder (cross-column placement already happened in onDragOver)
    let after = columns;
    const loc = findTask(columns, String(active.id));
    if (loc && over.data.current?.type === 'task' && over.id !== active.id) {
      const col = columns.find((c) => c.id === loc.columnId)!;
      const overIndex = col.tasks.findIndex((t) => t.id === over.id);
      if (overIndex >= 0) after = applyMove(columns, String(active.id), loc.columnId, overIndex);
    }
    setColumns(after);
    persistMove(String(active.id), before, after);
  }

  const activeTask =
    activeType === 'task' && activeId ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeId) : null;
  const activeColumn = activeType === 'column' && activeId ? columns.find((c) => c.id === activeId) : null;

  return (
    <>
      {/* Mobile column navigation: jump between columns instead of a squeezed desktop board */}
      <nav aria-label="Columns" className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {columns.map((c) => (
          <a
            key={c.id}
            href={`#col-${c.id}`}
            className="type-role shrink-0 rounded-full border border-border px-3 py-2 whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            {c.title} <span className="type-figure ml-1">{c.tasks.length}</span>
          </a>
        ))}
      </nav>

      <DndContext
        id={dndId}
        sensors={canEdit ? sensors : []}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          if (snapshot.current) setColumns(snapshot.current);
          setActiveId(null);
          setActiveType(null);
        }}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) =>
              active.data.current?.type === 'column'
                ? `Picked up column ${colTitle(String(active.id))}`
                : `Picked up ${titleOf(String(active.id))}`,
            onDragOver: ({ active, over }) =>
              over
                ? `${titleOf(String(active.id))} is over ${colTitle(String(over.data.current?.columnId ?? over.id))}`
                : undefined,
            onDragEnd: ({ active, over }) =>
              over
                ? `Dropped ${titleOf(String(active.id))} in ${colTitle(String(over.data.current?.columnId ?? over.id))}`
                : 'Drop cancelled',
            onDragCancel: () => 'Drag cancelled; the task returned to its place.',
          },
          screenReaderInstructions: {
            draggable:
              'To pick up a task, press space or enter. Use arrow keys to move it, space or enter to drop, escape to cancel. Or use the task’s Move menu.',
          },
        }}
      >
        <div
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 md:snap-none lg:-mx-8 lg:px-8"
          data-testid="board"
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((col, i) => (
              <BoardColumn
                key={col.id}
                column={col}
                index={i}
                total={columns.length}
                canEdit={canEdit}
                allColumns={columns}
                onOpen={setTaskParam}
                onMoveTask={moveTo}
                onChanged={() => router.refresh()}
              />
            ))}
          </SortableContext>
          {canEdit && <AddColumn projectId={board.project.id} onAdded={() => router.refresh()} />}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeTask ? (
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{ rotate: -1.5, scale: 1.03 }}
              transition={{ duration: 0.15 }}
            >
              <TaskCard task={activeTask} lifted />
            </motion.div>
          ) : activeColumn ? (
            <div className="sheet w-72 p-3 opacity-90 shadow-(--shadow-lift)">
              <p className="type-role">{activeColumn.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskSheet
        key={openTaskId ?? 'closed'}
        taskId={openTaskId}
        board={board}
        onClose={() => setTaskParam(null)}
        onChanged={() => router.refresh()}
      />
    </>
  );
}

function BoardColumn({
  column,
  index,
  total,
  canEdit,
  allColumns,
  onOpen,
  onMoveTask,
  onChanged,
}: {
  column: Column;
  index: number;
  total: number;
  canEdit: boolean;
  allColumns: Column[];
  onOpen: (id: string) => void;
  onMoveTask: (taskId: string, toColumnId: string, toIndex: number) => void;
  onChanged: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
    disabled: !canEdit,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${column.id}`,
    data: { type: 'column-drop', columnId: column.id },
  });
  const [renaming, setRenaming] = useState(false);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? 'Something went wrong');
      else {
        if (ok) toast.success(ok);
        onChanged();
      }
    });

  return (
    <section
      ref={setNodeRef}
      id={`col-${column.id}`}
      aria-label={`${column.title} column`}
      data-testid="board-column"
      data-column-title={column.title}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex w-[85vw] max-w-[22rem] shrink-0 snap-start flex-col rounded-lg border border-border bg-stock-2/60 sm:w-80',
        isDragging && 'opacity-40',
      )}
    >
      <header className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
        {canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder column ${column.title}`}
            className="grid size-8 cursor-grab place-items-center rounded text-ink-soft hover:bg-muted hover:text-foreground"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}
        {renaming ? (
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const title = String(new FormData(e.currentTarget).get('title') ?? '');
              setRenaming(false);
              if (title && title !== column.title) run(() => renameColumnAction(column.id, title));
            }}
          >
            <Input
              name="title"
              defaultValue={column.title}
              autoFocus
              aria-label="Column name"
              className="h-8"
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            />
          </form>
        ) : (
          <h2 className="type-role min-w-0 flex-1 truncate text-foreground">{column.title}</h2>
        )}
        <span
          className="type-figure text-xs text-muted-foreground"
          aria-label={`${column.tasks.length} tasks`}
        >
          {column.tasks.length}
        </span>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Column actions for ${column.title}`}
                disabled={pending}
              >
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === 0}
                onSelect={() => run(() => moveColumnAction(column.id, index - 1))}
              >
                <ArrowLeft aria-hidden /> Move left
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === total - 1}
                onSelect={() => run(() => moveColumnAction(column.id, index + 1))}
              >
                <ArrowRight aria-hidden /> Move right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={total <= 1}
                onSelect={() =>
                  run(() => deleteColumnAction(column.id), `Column deleted; its tasks moved next door`)
                }
              >
                <Trash2 aria-hidden /> Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div
        ref={setDropRef}
        className={cn('flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors', isOver && 'bg-accent/40')}
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task, i) => (
            <SortableTask
              key={task.id}
              task={task}
              columnId={column.id}
              canEdit={canEdit}
              onOpen={() => onOpen(task.id)}
              menu={
                canEdit ? (
                  <MoveMenu task={task} index={i} column={column} columns={allColumns} onMove={onMoveTask} />
                ) : null
              }
            />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && (
          <p className="grid flex-1 place-items-center rounded-md border border-dashed border-rule px-3 py-6 text-center text-xs text-ink-soft">
            {canEdit ? 'Drop a task here' : 'No tasks'}
          </p>
        )}
      </div>
      {canEdit && <AddTask columnId={column.id} onAdded={onChanged} />}
    </section>
  );
}

function SortableTask({
  task,
  columnId,
  canEdit,
  onOpen,
  menu,
}: {
  task: BoardTask;
  columnId: string;
  canEdit: boolean;
  onOpen: () => void;
  menu: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId },
    disabled: !canEdit,
  });
  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      dropSlot={isDragging}
      onOpen={onOpen}
      menu={menu}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...(canEdit ? { ...attributes, ...listeners } : {})}
      aria-roledescription="draggable task"
      aria-label={`Drag ${task.title}`}
    />
  );
}

function MoveMenu({
  task,
  index,
  column,
  columns,
  onMove,
}: {
  task: BoardTask;
  index: number;
  column: Column;
  columns: Column[];
  onMove: (taskId: string, toColumnId: string, toIndex: number) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Move ${task.title}`}
          className="opacity-60 group-hover/card:opacity-100 focus-visible:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="type-role text-muted-foreground">Move to</DropdownMenuLabel>
        {columns
          .filter((c) => c.id !== column.id)
          .map((c) => (
            <DropdownMenuItem key={c.id} onSelect={() => onMove(task.id, c.id, c.tasks.length)}>
              {c.title}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(task.id, column.id, index - 1)}>
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index === column.tasks.length - 1}
          onSelect={() => onMove(task.id, column.id, index + 1)}
        >
          Move down
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddTask({ columnId, onAdded }: { columnId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="m-2 mt-0 flex h-10 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add task
      </button>
    );
  }
  return (
    <form
      className="m-2 mt-0 grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const title = String(new FormData(formEl).get('title') ?? '').trim();
        if (!title) return;
        start(async () => {
          const r = await createTaskAction(columnId, title);
          if (!r.ok) toast.error(r.error);
          else {
            formEl.reset();
            onAdded();
          }
        });
      }}
    >
      <Input
        name="title"
        placeholder="Task title"
        autoFocus
        aria-label="New task title"
        maxLength={200}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddColumn({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="flex w-[85vw] max-w-[22rem] shrink-0 snap-start flex-col gap-2 self-start rounded-lg border border-dashed border-rule p-3 sm:w-72"
      onSubmit={(e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const title = String(new FormData(formEl).get('title') ?? '').trim();
        if (!title) return;
        start(async () => {
          const r = await addColumnAction(projectId, title);
          if (!r.ok) toast.error(r.error);
          else {
            formEl.reset();
            onAdded();
          }
        });
      }}
    >
      <label htmlFor="new-column" className="type-role text-muted-foreground">
        Add column
      </label>
      <Input id="new-column" name="title" placeholder="e.g. Vocal comping" maxLength={60} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Plus aria-hidden /> Add column
      </Button>
    </form>
  );
}
