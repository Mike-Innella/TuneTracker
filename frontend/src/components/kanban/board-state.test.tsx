import { describe, expect, it } from 'vitest';
import { applyMove, findTask, moveColumnLocal } from './board-state';

const cols = () => [
  { id: 'a', title: 'A', tasks: [{ id: '1' }, { id: '2' }, { id: '3' }] },
  { id: 'b', title: 'B', tasks: [{ id: '4' }] },
];
const ids = (c: ReturnType<typeof cols>) => c.map((x) => x.tasks.map((t) => t.id));

describe('board state', () => {
  it('reorders within a column', () => {
    expect(ids(applyMove(cols(), '1', 'a', 2))).toEqual([['2', '3', '1'], ['4']]);
  });
  it('moves across columns and clamps', () => {
    expect(ids(applyMove(cols(), '2', 'b', 0))).toEqual([
      ['1', '3'],
      ['2', '4'],
    ]);
    expect(ids(applyMove(cols(), '2', 'b', 99))).toEqual([
      ['1', '3'],
      ['4', '2'],
    ]);
  });
  it('ignores unknown tasks and does not mutate input', () => {
    const c = cols();
    expect(applyMove(c, 'zzz', 'b', 0)).toBe(c);
    applyMove(c, '1', 'b', 0);
    expect(ids(c)).toEqual([['1', '2', '3'], ['4']]);
  });
  it('finds tasks and moves columns', () => {
    expect(findTask(cols(), '4')).toEqual({ columnId: 'b', index: 0 });
    expect(moveColumnLocal(['x', 'y', 'z'], 2, 0)).toEqual(['z', 'x', 'y']);
  });
});
