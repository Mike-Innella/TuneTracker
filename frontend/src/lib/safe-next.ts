/** Only same-origin relative paths are allowed as post-auth redirects (no open redirect). */
export function safeNext(next: unknown, fallback = '/home'): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return fallback;
  }
  return next;
}
