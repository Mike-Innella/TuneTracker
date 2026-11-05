export type TrackStatus = 'IDEA' | 'DRAFT' | 'MIX' | 'MASTER';

export type Track = {
  id: string;
  title: string;
  description?: string | null;
  status?: TrackStatus | null;
  audioUrl?: string | null;
};

export type Project = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  tracks?: Track[];
};

export const COLUMN_IDS = ['ideas', 'drafting', 'mixing', 'mastering'] as const;

export type ColumnId = (typeof COLUMN_IDS)[number];

export type BoardColumn = {
  id: ColumnId;
  title: string;
  items: Track[];
};
