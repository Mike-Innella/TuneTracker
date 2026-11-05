/** Pure helpers for list ordering; DB code persists the resulting index as `position`. */
export function moveWithin<T>(list: readonly T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return next;
  next.splice(clamp(to, 0, next.length), 0, item);
  return next;
}

export function moveBetween<T>(
  source: readonly T[],
  target: readonly T[],
  from: number,
  to: number,
): { source: T[]; target: T[] } {
  const s = source.slice();
  const [item] = s.splice(from, 1);
  const t = target.slice();
  if (item !== undefined) t.splice(clamp(to, 0, t.length), 0, item);
  return { source: s, target: t };
}

export const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
