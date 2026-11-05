import { describe, expect, it } from 'vitest';
import { applyToggle } from './reactions';

describe('applyToggle', () => {
  it('adds and removes a reaction without going below zero', () => {
    const on = applyToggle({ counts: { FIRE: 2 }, mine: [] }, 'FIRE');
    expect(on).toEqual({ counts: { FIRE: 3 }, mine: ['FIRE'] });
    expect(applyToggle(on, 'FIRE')).toEqual({ counts: { FIRE: 2 }, mine: [] });
    expect(applyToggle({ counts: {}, mine: ['LIKE'] }, 'LIKE').counts.LIKE).toBe(0);
  });
});
