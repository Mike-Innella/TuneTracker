import { describe, expect, it } from 'vitest';
import { formatDate, toStars } from '../features/social/utils';

describe('social utils', () => {
  it('clamps and formats star ratings', () => {
    expect(toStars(undefined)).toBe('☆☆☆☆☆');
    expect(toStars(null)).toBe('☆☆☆☆☆');
    expect(toStars(0)).toBe('☆☆☆☆☆');
    expect(toStars(2)).toBe('★★☆☆☆');
    expect(toStars(10)).toBe('★★★★★');
  });

  it('returns original value for invalid date strings', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('formats valid date strings into a non-empty display value', () => {
    const result = formatDate('2026-01-01T12:00:00.000Z');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('2026-01-01T12:00:00.000Z');
  });
});
