/** Pure board-state transforms used for optimistic updates (mirrors server ordering). */
export type Col<T extends { id: string }> = { id: string; title: string; tasks: T[] };

export function findTask<T extends { id: string }>(cols: Col<T>[], taskId: string) {
  for (const col of cols) {
    const index = col.tasks.findIndex((t) => t.id === taskId);
    if (index >= 0) return { columnId: col.id, index };
  }
  return null;
}

export function applyMove<T extends { id: string }>(
  cols: Col<T>[],
  taskId: string,
  toColumnId: string,
  toIndex: number,
): Col<T>[] {
  const from = findTask(cols, taskId);
  if (!from) return cols;
  const task = cols.find((c) => c.id === from.columnId)!.tasks[from.index]!;
  const without = cols.map((c) =>
    c.id === from.columnId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c,
  );
  return without.map((c) => {
    if (c.id !== toColumnId) return c;
    const tasks = c.tasks.slice();
    tasks.splice(Math.max(0, Math.min(toIndex, tasks.length)), 0, task);
    return { ...c, tasks };
  });
}

export function moveColumnLocal<C>(cols: C[], from: number, to: number): C[] {
  const next = cols.slice();
  const [c] = next.splice(from, 1);
  if (c !== undefined) next.splice(Math.max(0, Math.min(to, next.length)), 0, c);
  return next;
}
