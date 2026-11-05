import { describe, expect, it } from 'vitest';
import {
  formatWelcomeName,
  getDashboardSummary,
  getShareStatusMessage,
  getSnapshotMessage,
  getTrackCountLabel,
  isPublicProject,
} from '../features/dashboard/utils';

describe('dashboard utils', () => {
  it('formats welcome name using display name, email, then fallback', () => {
    expect(formatWelcomeName({ displayName: '  Nova  ', email: 'n@example.com' })).toBe(
      'Nova'
    );
    expect(formatWelcomeName({ displayName: '', email: 'mixmaster@example.com' })).toBe(
      'mixmaster'
    );
    expect(formatWelcomeName(null)).toBe('Producer');
  });

  it('builds dashboard summary counts correctly', () => {
    const summary = getDashboardSummary([
      { id: 'p1', title: 'One', visibility: 'PUBLIC', trackCount: 2 },
      { id: 'p2', title: 'Two', visibility: 'PRIVATE', trackCount: 1 },
      { id: 'p3', title: 'Three', visibility: 'PRIVATE', trackCount: 0 },
    ]);

    expect(summary.publicProjects).toBe(1);
    expect(summary.privateProjects).toBe(2);
    expect(summary.totalTracks).toBe(3);
    expect(summary.stats).toHaveLength(4);
  });

  it('returns consistent helper labels', () => {
    expect(getSnapshotMessage(0)).toContain('Start by creating');
    expect(getSnapshotMessage(2)).toContain('2 tracked items');
    expect(getTrackCountLabel(1)).toBe('1 track');
    expect(getTrackCountLabel(3)).toBe('3 tracks');
    expect(getShareStatusMessage(0)).toContain('private');
    expect(getShareStatusMessage(1)).toContain('1 public project');
  });

  it('detects public project visibility', () => {
    expect(isPublicProject({ id: 'a', title: 'A', visibility: 'PUBLIC' })).toBe(true);
    expect(isPublicProject({ id: 'b', title: 'B', visibility: 'PRIVATE' })).toBe(false);
  });
});
