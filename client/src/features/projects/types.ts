export type Project = {
  id: string;
  title: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | string;
  _count?: {
    tracks: number;
  };
  trackCount?: number;
};
