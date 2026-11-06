'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Archive, FileText, Loader2, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Board } from '@tunetracker/backend';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AudioPlayer } from '@/components/audio/audio-player';
import {
  addChecklistItemAction,
  addTaskCommentAction,
  archiveTaskAction,
  createLabelAction,
  deleteAttachmentAction,
  deleteChecklistItemAction,
  deleteTaskAction,
  deleteTaskCommentAction,
  getTaskAction,
  toggleChecklistItemAction,
  updateTaskAction,
} from '@/features/board/actions';
import { uploadFile } from '@/features/media/upload';
import { formatDuration, timeAgo, toDateInput } from '@/lib/format';
import { cn } from '@/lib/utils';

type TaskData = Extract<Awaited<ReturnType<typeof getTaskAction>>, { ok: true }>['data'];

const selectClass = 'h-10 w-full rounded-md border border-input bg-stock px-3 text-sm dark:bg-input/30';
const LABEL_COLORS = ['#2f7bff', '#22d3ee', '#a46bff', '#f472b6', '#f59e0b', '#34d399'];

export function TaskSheet({
  taskId,
  board,
  onClose,
  onChanged,
}: {
  taskId: string | null;
  board: Board;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<TaskData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canEdit = board.role !== 'VIEWER';

  const load = useCallback(async (id: string) => {
    const r = await getTaskAction(id);
    if (r.ok) {
      setData(r.data);
      setError(null);
    } else setError(r.error);
  }, []);

  // State resets via the parent's key={taskId}; this only fetches.
  useEffect(() => {
    if (!taskId) return;
    let live = true;
    getTaskAction(taskId).then((r) => {
      if (!live) return;
      if (r.ok) setData(r.data);
      else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [taskId]);

  /** Run a mutation, then refresh both the sheet and the board behind it. */
  const mutate = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error ?? 'Something went wrong');
      if (ok) toast.success(ok);
      if (taskId) await load(taskId);
      onChanged();
    });

  const task = data?.task;

  async function onFiles(files: FileList | null) {
    if (!files?.length || !task) return;
    for (const file of Array.from(files)) {
      setUploadPct(0);
      try {
        await uploadFile(
          file,
          {
            kind: file.type.startsWith('audio/')
              ? 'AUDIO'
              : file.type.startsWith('image/')
                ? 'IMAGE'
                : 'FILE',
            taskId: task.id,
            projectId: board.project.id,
          },
          setUploadPct,
        );
        toast.success(`${file.name} attached`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
    setUploadPct(null);
    if (fileRef.current) fileRef.current.value = '';
    await load(task.id);
    onChanged();
  }

  return (
    <Sheet open={!!taskId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="type-title pr-8 text-2xl break-words">
            {task?.title ?? (error ? 'Task unavailable' : 'Loading…')}
          </SheetTitle>
          <SheetDescription className="type-role">{task ? `in ${task.column.title}` : ' '}</SheetDescription>
        </SheetHeader>

        {error && <p className="p-5 text-sm text-destructive">{error}</p>}
        {!task && !error && (
          <div className="grid gap-3 p-5" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        )}

        {task && (
          <div className="grid gap-8 p-5">
            {/* Details */}
            <form
              key={task.updatedAt.toString()}
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
                mutate(
                  () =>
                    updateTaskAction(task.id, {
                      title: f.title,
                      description: f.description,
                      priority: f.priority as never,
                      dueDate: f.dueDate as never,
                      assigneeId: f.assigneeId || null,
                      bpm: f.bpm === '' ? null : (f.bpm as never),
                      musicalKey: f.musicalKey,
                    }),
                  'Task saved',
                );
              }}
            >
              <fieldset disabled={!canEdit || pending} className="grid gap-4">
                <Field id="t-title" label="Title">
                  {(p) => <Input {...p} name="title" defaultValue={task.title} required maxLength={200} />}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="t-priority" label="Priority">
                    {(p) => (
                      <select {...p} name="priority" defaultValue={task.priority} className={selectClass}>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    )}
                  </Field>
                  <Field id="t-due" label="Due date">
                    {(p) => (
                      <Input {...p} name="dueDate" type="date" defaultValue={toDateInput(task.dueDate)} />
                    )}
                  </Field>
                  <Field id="t-assignee" label="Assignee">
                    {(p) => (
                      <select
                        {...p}
                        name="assigneeId"
                        defaultValue={task.assigneeId ?? ''}
                        className={selectClass}
                      >
                        <option value="">Unassigned</option>
                        {board.people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.displayName}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field id="t-bpm" label="BPM">
                      {(p) => (
                        <Input
                          {...p}
                          name="bpm"
                          type="number"
                          min={20}
                          max={400}
                          inputMode="numeric"
                          defaultValue={task.bpm ?? ''}
                          className="type-figure"
                        />
                      )}
                    </Field>
                    <Field id="t-key" label="Key">
                      {(p) => (
                        <Input
                          {...p}
                          name="musicalKey"
                          maxLength={12}
                          defaultValue={task.musicalKey ?? ''}
                          placeholder="F#m"
                          className="type-figure"
                        />
                      )}
                    </Field>
                  </div>
                </div>
                <Field id="t-desc" label="Notes">
                  {(p) => (
                    <Textarea
                      {...p}
                      name="description"
                      rows={4}
                      maxLength={5000}
                      defaultValue={task.description ?? ''}
                      placeholder="References, arrangement notes, mix feedback…"
                    />
                  )}
                </Field>
                {canEdit && (
                  <div>
                    <Button type="submit" size="sm" disabled={pending}>
                      {pending && <Loader2 className="animate-spin" aria-hidden />} Save details
                    </Button>
                  </div>
                )}
              </fieldset>
            </form>

            {/* Labels */}
            <section aria-labelledby="t-labels">
              <h3 id="t-labels" className="type-role mb-2 text-muted-foreground">
                Labels
              </h3>
              <div className="flex flex-wrap gap-2">
                {board.labels.map((l) => {
                  const on = task.labels.some((x) => x.id === l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      disabled={!canEdit || pending}
                      aria-pressed={on}
                      onClick={() =>
                        mutate(() =>
                          updateTaskAction(task.id, {
                            labelIds: on
                              ? task.labels.filter((x) => x.id !== l.id).map((x) => x.id)
                              : [...task.labels.map((x) => x.id), l.id],
                          }),
                        )
                      }
                      className={cn(
                        'type-role inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.68rem]',
                        on
                          ? 'border-electric bg-accent text-foreground'
                          : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="size-2 rounded-full" style={{ background: l.color }} aria-hidden />
                      {l.name}
                    </button>
                  );
                })}
                {canEdit && (
                  <form
                    className="flex gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const name = String(new FormData(formEl).get('label') ?? '').trim();
                      if (!name) return;
                      const color = LABEL_COLORS[board.labels.length % LABEL_COLORS.length]!;
                      mutate(async () => {
                        const r = await createLabelAction(board.project.id, name, color);
                        if (r.ok) {
                          formEl.reset();
                          return updateTaskAction(task.id, {
                            labelIds: [...task.labels.map((x) => x.id), r.data.id],
                          });
                        }
                        return r;
                      });
                    }}
                  >
                    <Input
                      name="label"
                      placeholder="New label"
                      aria-label="New label name"
                      maxLength={30}
                      className="h-8 w-32"
                    />
                    <Button type="submit" variant="ghost" size="icon-sm" aria-label="Create label">
                      <Plus aria-hidden />
                    </Button>
                  </form>
                )}
              </div>
            </section>

            {/* Checklist */}
            <section aria-labelledby="t-checklist">
              <h3 id="t-checklist" className="type-role mb-2 text-muted-foreground">
                Checklist{' '}
                {task.checklist.length > 0 && (
                  <span className="type-figure">
                    {task.checklist.filter((i) => i.done).length}/{task.checklist.length}
                  </span>
                )}
              </h3>
              <ul className="grid gap-1">
                {task.checklist.map((item) => (
                  <li
                    key={item.id}
                    className="group/item flex min-h-10 items-center gap-3 rounded-md px-2 hover:bg-muted"
                  >
                    <Checkbox
                      id={`ci-${item.id}`}
                      checked={item.done}
                      disabled={!canEdit || pending}
                      onCheckedChange={(v) => mutate(() => toggleChecklistItemAction(item.id, v === true))}
                    />
                    <label
                      htmlFor={`ci-${item.id}`}
                      className={cn('flex-1 text-sm', item.done && 'text-muted-foreground line-through')}
                    >
                      {item.text}
                    </label>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${item.text}`}
                        className="opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
                        onClick={() => mutate(() => deleteChecklistItemAction(item.id))}
                      >
                        <X aria-hidden />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {canEdit && (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const text = String(new FormData(formEl).get('item') ?? '').trim();
                    if (!text) return;
                    mutate(async () => {
                      const r = await addChecklistItemAction(task.id, text);
                      if (r.ok) formEl.reset();
                      return r;
                    });
                  }}
                >
                  <Input
                    name="item"
                    placeholder="Add an item — e.g. Comp lead vocal"
                    aria-label="New checklist item"
                    maxLength={200}
                  />
                  <Button type="submit" variant="outline" size="icon" aria-label="Add checklist item">
                    <Plus aria-hidden />
                  </Button>
                </form>
              )}
            </section>

            {/* Attachments */}
            <section aria-labelledby="t-files">
              <div className="mb-2 flex items-center justify-between">
                <h3 id="t-files" className="type-role text-muted-foreground">
                  Attachments
                </h3>
                {canEdit && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      className="sr-only"
                      id="t-file-input"
                      aria-label="Attach files"
                      onChange={(e) => onFiles(e.target.files)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadPct !== null}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploadPct !== null ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <Paperclip aria-hidden />
                      )}
                      {uploadPct !== null ? `Uploading ${uploadPct}%` : 'Attach files'}
                    </Button>
                  </>
                )}
              </div>
              {task.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Stems, references, demos, lyric sheets — up to 50 MB per audio file.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {task.attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      {a.kind === 'AUDIO' ? (
                        <AudioPlayer
                          src={a.url}
                          title={a.title ?? 'Audio'}
                          durationSec={a.durationSec}
                          className="flex-1"
                        />
                      ) : (
                        <a
                          href={a.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm hover:bg-muted"
                        >
                          <FileText className="size-4 shrink-0 text-ink-soft" aria-hidden />
                          <span className="truncate">{a.title}</span>
                          <span className="type-figure ml-auto shrink-0 text-xs text-muted-foreground">
                            {Math.ceil(a.sizeBytes / 1024)} KB
                          </span>
                        </a>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${a.title}`}
                          onClick={() => mutate(() => deleteAttachmentAction(a.id), 'Attachment deleted')}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {task.attachments.some((a) => a.kind === 'AUDIO' && a.durationSec) && (
                <p className="type-figure mt-2 text-xs text-muted-foreground">
                  Total audio {formatDuration(task.attachments.reduce((n, a) => n + (a.durationSec ?? 0), 0))}
                </p>
              )}
            </section>

            {/* Comments */}
            <section aria-labelledby="t-comments">
              <h3 id="t-comments" className="type-role mb-3 text-muted-foreground">
                Discussion
              </h3>
              <ul className="grid gap-4">
                {task.comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <UserAvatar name={c.author.displayName} url={c.author.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{c.author.displayName}</span>{' '}
                        <span className="type-figure text-xs text-ink-soft">{timeAgo(c.createdAt)}</span>
                      </p>
                      <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">{c.body}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Delete comment"
                      onClick={() => mutate(() => deleteTaskCommentAction(c.id))}
                    >
                      <X aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 grid gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formEl = e.currentTarget;
                  const body = String(new FormData(formEl).get('body') ?? '').trim();
                  if (!body) return;
                  mutate(async () => {
                    const r = await addTaskCommentAction(task.id, body);
                    if (r.ok) formEl.reset();
                    return r;
                  });
                }}
              >
                <Textarea
                  name="body"
                  rows={2}
                  placeholder="Leave a note or session log"
                  aria-label="Comment"
                  maxLength={4000}
                />
                <div>
                  <Button type="submit" size="sm" variant="outline" disabled={pending}>
                    Comment
                  </Button>
                </div>
              </form>
            </section>

            {canEdit && (
              <footer className="flex flex-wrap gap-2 border-t border-border pt-5">
                <Button
                  variant="outline"
                  onClick={() =>
                    start(async () => {
                      const r = await archiveTaskAction(task.id, true);
                      if (!r.ok) return void toast.error(r.error);
                      toast.success('Task archived');
                      onChanged();
                      onClose();
                    })
                  }
                >
                  <Archive aria-hidden /> Archive
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    confirmDelete
                      ? start(async () => {
                          const r = await deleteTaskAction(task.id);
                          if (!r.ok) return void toast.error(r.error);
                          toast.success('Task deleted');
                          onChanged();
                          onClose();
                        })
                      : setConfirmDelete(true)
                  }
                >
                  <Trash2 aria-hidden /> {confirmDelete ? 'Confirm delete — this can’t be undone' : 'Delete'}
                </Button>
              </footer>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
