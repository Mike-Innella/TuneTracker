/** Result envelope returned by every Server Action so forms can render errors. */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';
