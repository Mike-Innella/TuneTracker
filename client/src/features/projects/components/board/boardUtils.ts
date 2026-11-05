import type { BoardColumn, ColumnId, Track, TrackStatus } from './boardTypes';

export function getColumnIdFromStatus(status?: string | null): ColumnId {
  if (status === 'IDEA') return 'ideas';
  if (status === 'MIX') return 'mixing';
  if (status === 'MASTER') return 'mastering';
  return 'drafting';
}

export function getStatusFromColumnId(columnId: ColumnId): TrackStatus {
  if (columnId === 'ideas') return 'IDEA';
  if (columnId === 'mixing') return 'MIX';
  if (columnId === 'mastering') return 'MASTER';
  return 'DRAFT';
}

export function getStatusFromColumnTitle(columnTitle: string): TrackStatus {
  if (columnTitle === 'Idea') return 'IDEA';
  if (columnTitle === 'Drafting') return 'DRAFT';
  if (columnTitle === 'Mixing') return 'MIX';
  if (columnTitle === 'Mastering') return 'MASTER';
  return 'DRAFT';
}

export function getColumnsFromTracks(tracks: Track[]): BoardColumn[] {
  return [
    {
      id: 'ideas',
      title: 'Idea',
      items: tracks.filter((track) => (track.status || 'DRAFT') === 'IDEA'),
    },
    {
      id: 'drafting',
      title: 'Drafting',
      items: tracks.filter((track) => (track.status || 'DRAFT') === 'DRAFT'),
    },
    {
      id: 'mixing',
      title: 'Mixing',
      items: tracks.filter((track) => (track.status || 'DRAFT') === 'MIX'),
    },
    {
      id: 'mastering',
      title: 'Mastering',
      items: tracks.filter((track) => (track.status || 'DRAFT') === 'MASTER'),
    },
  ];
}
