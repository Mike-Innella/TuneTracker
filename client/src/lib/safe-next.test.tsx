import { describe, expect, it } from 'vitest';
import { safeNext } from './safe-next';

describe('safeNext', () => {
  it('keeps relative app paths', () => expect(safeNext('/projects/abc')).toBe('/projects/abc'));
  it.each(['https://evil.com', '//evil.com', '/\\evil.com', null, 42])('rejects %s', (v) =>
    expect(safeNext(v)).toBe('/dashboard'),
  );
});
