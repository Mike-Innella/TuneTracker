import 'server-only';

export { AppError, runAction, toActionError } from './lib/errors';
export { rateLimit } from './lib/rate-limit';
export { getAuthUser, getCurrentProfile, requireActor, requireProfile, ensureProfile } from './auth/session';
export { supabaseServer } from './auth/supabase';
export { can, type ProjectAction } from './authorization/permissions';
export { authorizeProject } from './authorization/projects';
export { publicUrl } from './storage';
export { requestOrigin } from './lib/origin';

export * as projects from './services/projects';
export * as boards from './services/boards';
export * as tasks from './services/tasks';
export * as collaboration from './services/collaboration';
export * as community from './services/community';
export * as media from './services/media';
export * as profiles from './services/profiles';
export * as notifications from './services/notifications';
export * as dashboard from './services/dashboard';
export * as follows from './services/follows';
export * as account from './services/account';
export * as moderation from './services/moderation';
export * as tracks from './services/tracks';
export * as blog from './services/blog';
export * as playlists from './services/playlists';
export * as analytics from './services/analytics';

export type { Board, BoardTask } from './services/boards';
export type { FeedPost } from './services/community';
export type { PublicTrack } from './services/tracks';
export type { PublicArticle } from './services/blog';
export type { UpdateTrackInput, TrackListInput, ArticleInput, PlaylistInput } from '@tunetracker/shared';
