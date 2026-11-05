export const APP_NAME = 'TuneTracker';
/** Fixed so browser and server agree even when they reach Supabase via different hosts. */
export const AUTH_COOKIE_NAME = 'sb-tunetracker-auth-token';
export const TAGLINE = 'Create. Collaborate. Share.';

export const BUCKETS = {
  /** Private: project audio, task attachments, unpublished media. Signed URLs only. */
  media: 'media',
  /** Public: avatars, project artwork, images attached to public posts. */
  public: 'public-media',
} as const;

export const UPLOAD_LIMITS = {
  audioBytes: 50 * 1024 * 1024,
  imageBytes: 5 * 1024 * 1024,
  fileBytes: 25 * 1024 * 1024,
  /** Total stored bytes per user across all media. */
  quotaBytes: 1024 * 1024 * 1024,
} as const;

/** Browser-playable formats only; codec support still varies (see docs/security). */
export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/x-flac',
] as const;
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
export const FILE_MIME_TYPES = [
  ...AUDIO_MIME_TYPES,
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'text/plain',
  'application/zip',
  'audio/midi',
  'audio/x-midi',
] as const;

export const PROJECT_TEMPLATES = {
  blank: { name: 'Blank board', columns: ['To do', 'In progress', 'Done'] },
  songwriting: { name: 'Songwriting', columns: ['Ideas', 'Lyrics', 'Melody', 'Structure', 'Done'] },
  recording: { name: 'Recording', columns: ['Prep', 'Tracking', 'Comping', 'Edits', 'Done'] },
  production: {
    name: 'Production',
    columns: ['Ideas', 'Drafting', 'Arrangement', 'Sound design', 'Done'],
  },
  mixing: { name: 'Mixing', columns: ['To mix', 'Balancing', 'Revisions', 'Approved'] },
  mastering: { name: 'Mastering', columns: ['Queued', 'Mastering', 'Client review', 'Delivered'] },
  release: {
    name: 'Release preparation',
    columns: ['Assets', 'Metadata', 'Distribution', 'Promotion', 'Released'],
  },
} as const;
export type ProjectTemplateKey = keyof typeof PROJECT_TEMPLATES;

export const REACTIONS = {
  LIKE: 'Like',
  FIRE: 'Fire',
  HEART: 'Love',
  MIND_BLOWN: 'Mind-blown',
} as const;

export const SPECIALTIES = [
  'Producer',
  'DJ',
  'Vocalist',
  'Songwriter',
  'Instrumentalist',
  'Recording artist',
  'Audio engineer',
  'Mixing engineer',
  'Mastering engineer',
  'Composer',
] as const;

/** Fixed genre list (explainable filters; extend here). */
export const GENRES = [
  'Electronic',
  'House',
  'Techno',
  'Drum & Bass',
  'Hip-Hop',
  'R&B',
  'Pop',
  'Rock',
  'Indie',
  'Synthwave',
  'Ambient',
  'Lo-fi',
  'Jazz',
  'Soul',
  'Folk',
  'Classical',
  'Cinematic',
  'Experimental',
] as const;

export const USAGE_RIGHTS = {
  ALL_RIGHTS_RESERVED: { label: 'All rights reserved', summary: 'Listen only. No reuse without permission.' },
  ROYALTY_FREE_NON_COMMERCIAL: {
    label: 'Royalty-free, non-commercial',
    summary: 'Free to use in non-commercial work. Credit appreciated.',
  },
  ROYALTY_FREE_COMMERCIAL: {
    label: 'Royalty-free, commercial',
    summary: 'Free to use in commercial and non-commercial work.',
  },
  CC_BY: { label: 'CC BY 4.0', summary: 'Any use, including commercial, with attribution.' },
  CC_BY_NC: { label: 'CC BY-NC 4.0', summary: 'Non-commercial use with attribution.' },
} as const;
export type UsageRightsKey = keyof typeof USAGE_RIGHTS;
