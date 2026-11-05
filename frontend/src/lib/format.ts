const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(date: Date | string, now = Date.now()): string {
  const seconds = Math.round((new Date(date).getTime() - now) / 1000);
  for (const [unit, s] of UNITS) {
    if (Math.abs(seconds) >= s) return rtf.format(Math.round(seconds / s), unit);
  }
  return 'just now';
}

export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en', { ...opts, timeZone: 'UTC' }).format(new Date(date));
}

/** 0:00 style durations for audio. */
export function formatDuration(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return '–:––';
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function toDateInput(date: Date | string | null | undefined): string {
  return date ? new Date(date).toISOString().slice(0, 10) : '';
}
