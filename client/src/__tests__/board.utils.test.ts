import { describe, expect, it } from 'vitest';
import {
  getColumnIdFromStatus,
  getColumnsFromTracks,
  getStatusFromColumnId,
  getStatusFromColumnTitle,
} from '../features/projects/components/board/boardUtils';

describe('board utils', () => {
  it('maps between status and column id', () => {
    expect(getColumnIdFromStatus('IDEA')).toBe('ideas');
    expect(getColumnIdFromStatus('MIX')).toBe('mixing');
    expect(getColumnIdFromStatus('MASTER')).toBe('mastering');
    expect(getColumnIdFromStatus(undefined)).toBe('drafting');

    expect(getStatusFromColumnId('ideas')).toBe('IDEA');
    expect(getStatusFromColumnId('drafting')).toBe('DRAFT');
    expect(getStatusFromColumnId('mixing')).toBe('MIX');
    expect(getStatusFromColumnId('mastering')).toBe('MASTER');
  });

  it('maps column titles to status with DRAFT fallback', () => {
    expect(getStatusFromColumnTitle('Idea')).toBe('IDEA');
    expect(getStatusFromColumnTitle('Drafting')).toBe('DRAFT');
    expect(getStatusFromColumnTitle('Mixing')).toBe('MIX');
    expect(getStatusFromColumnTitle('Mastering')).toBe('MASTER');
    expect(getStatusFromColumnTitle('Unexpected')).toBe('DRAFT');
  });

  it('groups tracks into the expected board columns', () => {
    const columns = getColumnsFromTracks([
      { id: 't1', title: 'Idea track', status: 'IDEA' },
      { id: 't2', title: 'Draft track', status: 'DRAFT' },
      { id: 't3', title: 'Mix track', status: 'MIX' },
      { id: 't4', title: 'Master track', status: 'MASTER' },
      { id: 't5', title: 'Default draft', status: null },
    ]);

    expect(columns).toHaveLength(4);
    expect(columns.find((column) => column.id === 'ideas')?.items).toHaveLength(1);
    expect(columns.find((column) => column.id === 'drafting')?.items).toHaveLength(2);
    expect(columns.find((column) => column.id === 'mixing')?.items).toHaveLength(1);
    expect(columns.find((column) => column.id === 'mastering')?.items).toHaveLength(1);
  });
});
