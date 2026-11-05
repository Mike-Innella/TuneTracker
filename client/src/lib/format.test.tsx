import { describe, expect, it } from 'vitest';
import { formatDuration, timeAgo, toDateInput } from './format';

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(125.4)).toBe('2:05');
    expect(formatDuration(null)).toBe('–:––');
  });
  it('formats relative time', () => {
    const now = Date.parse('2026-01-10T12:00:00Z');
    expect(timeAgo('2026-01-10T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-01-10T10:00:00Z', now)).toBe('2 hours ago');
    expect(timeAgo('2026-01-09T12:00:00Z', now)).toBe('yesterday');
  });
  it('formats date inputs', () => expect(toDateInput('2026-03-04T00:00:00Z')).toBe('2026-03-04'));
});
