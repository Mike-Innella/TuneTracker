'use client';

import { forwardRef } from 'react';
import { CalendarDays, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import type { BoardTask } from '@tunetracker/server';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const PRIORITY: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'text-ink-soft' },
  MEDIUM: { label: 'Medium', className: 'text-ink-soft' },
  HIGH: { label: 'High', className: 'text-warning' },
  URGENT: { label: 'Urgent', className: 'text-destructive' },
};

export type CardProps = {
  task: BoardTask;
  lifted?: boolean;
  dropSlot?: boolean;
  onOpen?: () => void;
  menu?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

/** A track sheet entry: title, credits-style meta, numbers in tabular mono. */
export const TaskCard = forwardRef<HTMLDivElement, CardProps>(function TaskCard(
  { task, lifted, dropSlot, onOpen, menu, className, ...rest },
  ref,
) {
  const p = PRIORITY[task.priority] ?? PRIORITY.MEDIUM!;
  const overdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());
  return (
    <div
      ref={ref}
      {...rest}
      data-testid="task-card"
      data-task-title={task.title}
      className={cn(
        'group/card relative rounded-md border border-border bg-card p-3 text-left shadow-(--shadow-sheet) transition-[box-shadow,border-color] duration-200',
        'hover:border-rule',
        // only the moving edge takes colour
        lifted &&
          'cursor-grabbing border-transparent shadow-(--shadow-lift) [background:linear-gradient(var(--card),var(--card))_padding-box,var(--gradient-light)_border-box]',
        dropSlot && 'border-dashed border-electric/70 bg-accent/40 shadow-none [&>*]:opacity-0',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 text-left text-sm leading-snug font-semibold break-words after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {task.title}
          </button>
        ) : (
          <span className="min-w-0 flex-1 text-sm leading-snug font-semibold break-words">{task.title}</span>
        )}
        {menu && <div className="relative z-10 -mt-1 -mr-1">{menu}</div>}
      </div>

      {task.labels.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Labels">
          {task.labels.map((l) => (
            <li
              key={l.id}
              className="type-role inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[0.64rem]"
            >
              <span className="size-1.5 rounded-full" style={{ background: l.color }} aria-hidden />
              {l.name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className={cn('type-role text-[0.64rem]', p.className)}>{p.label}</span>
        {(task.bpm || task.musicalKey) && (
          <span className="type-figure">
            {task.bpm ? `${task.bpm} BPM` : ''}
            {task.bpm && task.musicalKey ? ' · ' : ''}
            {task.musicalKey ?? ''}
          </span>
        )}
        {task.dueDate && (
          <span className={cn('type-figure inline-flex items-center gap-1', overdue && 'text-destructive')}>
            <CalendarDays className="size-3" aria-hidden />
            <span className="sr-only">Due</span>
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.checklistTotal > 0 && (
          <span className="type-figure inline-flex items-center gap-1">
            <CheckSquare className="size-3" aria-hidden />
            <span className="sr-only">Checklist</span>
            {task.checklistDone}/{task.checklistTotal}
          </span>
        )}
        {task.commentCount > 0 && (
          <span className="type-figure inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            <span className="sr-only">Comments</span>
            {task.commentCount}
          </span>
        )}
        {task.attachmentCount > 0 && (
          <span className="type-figure inline-flex items-center gap-1">
            <Paperclip className="size-3" aria-hidden />
            <span className="sr-only">Attachments</span>
            {task.attachmentCount}
          </span>
        )}
        {task.assignee && (
          <span className="ml-auto" title={`Assigned to ${task.assignee.displayName}`}>
            <UserAvatar name={task.assignee.displayName} url={task.assignee.avatarUrl} className="size-6" />
          </span>
        )}
      </div>
    </div>
  );
});
