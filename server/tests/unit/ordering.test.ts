import { describe, expect, it } from 'vitest';
import { moveBetween, moveWithin } from '../../src/lib/ordering';
import { computeProgress } from '../../src/services/projects';
import { checkUpload } from '../../src/services/media';

describe('ordering', () => {
  it('moves within a list', () => {
    expect(moveWithin(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveWithin(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('clamps out-of-range targets', () => {
    expect(moveWithin(['a', 'b'], 0, 99)).toEqual(['b', 'a']);
  });
  it('moves between lists', () => {
    expect(moveBetween(['a', 'b'], ['x', 'y'], 1, 1)).toEqual({ source: ['a'], target: ['x', 'b', 'y'] });
    expect(moveBetween(['a'], [], 0, 5)).toEqual({ source: [], target: ['a'] });
  });
});

describe('progress', () => {
  it('is the share of tasks in the last column', () => {
    expect(
      computeProgress([
        { position: 0, taskCount: 3 },
        { position: 1, taskCount: 1 },
      ]),
    ).toBe(25);
    expect(computeProgress([{ position: 0, taskCount: 0 }])).toBe(0);
  });
});

describe('upload rules', () => {
  it('accepts browser audio within limits', () => {
    expect(() => checkUpload('AUDIO', 'audio/mpeg', 1024, 'private')).not.toThrow();
  });
  it('rejects wrong types, oversize files and public audio', () => {
    expect(() => checkUpload('AUDIO', 'application/x-msdownload', 10, 'private')).toThrow(/Unsupported/);
    expect(() => checkUpload('IMAGE', 'image/png', 50 * 1024 * 1024, 'public')).toThrow(/too large/);
    expect(() => checkUpload('AUDIO', 'audio/mpeg', 10, 'public')).toThrow(/Only images/);
  });
});
