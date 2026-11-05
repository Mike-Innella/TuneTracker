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

export type { Board, BoardTask } from './services/boards';
export type { FeedPost } from './services/community';
