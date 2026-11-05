import { z } from 'zod';
import { GENRES, PROJECT_TEMPLATES, REACTIONS, USAGE_RIGHTS } from '../constants/index';

const id = z.string().min(1).max(64);
const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullish();
/** http(s) only — blocks javascript:, data: and friends at the trust boundary. */
export const safeUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  }, 'Must be an http(s) URL');
const optionalUrl = z.union([z.literal('').transform(() => null), safeUrl]).nullish();
const isoDate = z.union([z.literal('').transform(() => null), z.coerce.date()]).nullish();

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, '3–30 characters: letters, numbers, underscore');

// ---------- auth ----------
export const signUpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'At least 8 characters').max(72),
  displayName: trimmed(60).min(1, 'Required'),
  username: usernameSchema,
});
export const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, 'Required').max(72),
});
export const forgotPasswordSchema = z.object({ email: z.email().trim().toLowerCase() });
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'At least 8 characters').max(72),
});

// ---------- projects ----------
export const projectVisibility = z.enum(['PRIVATE', 'PUBLIC']);
export const projectStatus = z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED']);
export const createProjectSchema = z.object({
  title: trimmed(120).min(1, 'Required'),
  description: optionalText(2000),
  visibility: projectVisibility.default('PRIVATE'),
  dueDate: isoDate,
  template: z.enum(Object.keys(PROJECT_TEMPLATES) as [keyof typeof PROJECT_TEMPLATES]).default('blank'),
});
export const updateProjectSchema = z.object({
  title: trimmed(120).min(1).optional(),
  description: optionalText(2000),
  visibility: projectVisibility.optional(),
  status: projectStatus.optional(),
  dueDate: isoDate,
  artworkPath: z.string().max(300).nullish(),
});

export const memberRole = z.enum(['EDITOR', 'VIEWER']);
/** Invite by username (existing artist) or by email (anyone; they get a sign-up invitation). */
export const inviteMemberSchema = z.object({
  target: z.union([
    z.email().trim().toLowerCase(),
    z
      .string()
      .trim()
      .transform((u) => u.replace(/^@/, ''))
      .pipe(usernameSchema),
  ]),
  role: memberRole,
});
export const deleteAccountSchema = z.object({ confirmUsername: usernameSchema });
export const moderationOutcome = z.enum(['DISMISSED', 'CONTENT_REMOVED', 'USER_SUSPENDED']);
export const resolveReportSchema = z.object({
  reportId: id,
  outcome: moderationOutcome,
  note: optionalText(500),
});

// ---------- board ----------
export const columnTitle = trimmed(60).min(1, 'Required');
export const taskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const createTaskSchema = z.object({
  columnId: id,
  title: trimmed(200).min(1, 'Required'),
});
export const updateTaskSchema = z.object({
  title: trimmed(200).min(1).optional(),
  description: optionalText(5000),
  priority: taskPriority.optional(),
  dueDate: isoDate,
  assigneeId: z.uuid().nullish(),
  bpm: z.coerce.number().int().min(20).max(400).nullish(),
  musicalKey: optionalText(12),
  labelIds: z.array(id).max(20).optional(),
});
export const moveTaskSchema = z.object({
  taskId: id,
  toColumnId: id,
  toIndex: z.number().int().min(0),
});
export const moveColumnSchema = z.object({ columnId: id, toIndex: z.number().int().min(0) });
export const labelSchema = z.object({
  name: trimmed(30).min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});
export const checklistItemSchema = z.object({ text: trimmed(200).min(1) });
export const commentSchema = z.object({ body: trimmed(4000).min(1, 'Write something first') });

// ---------- media ----------
export const mediaKind = z.enum(['AUDIO', 'IMAGE', 'FILE']);
export const requestUploadSchema = z.object({
  kind: mediaKind,
  fileName: trimmed(200).min(1),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().positive(),
  /** public bucket only for avatars/artwork/post images */
  visibility: z.enum(['private', 'public']).default('private'),
  projectId: id.nullish(),
  taskId: id.nullish(),
});
export const completeUploadSchema = z.object({
  assetId: id,
  durationSec: z
    .number()
    .positive()
    .max(60 * 60 * 6)
    .nullish(),
  title: optionalText(200),
});

// ---------- community ----------
export const postType = z.enum(['PROGRESS', 'FINISHED', 'SAMPLE', 'FEEDBACK']);
export const reactionType = z.enum(Object.keys(REACTIONS) as [keyof typeof REACTIONS]);
export const postSchema = z.object({
  title: trimmed(160).min(1, 'Required'),
  body: trimmed(10000).min(1, 'Required'),
  type: postType.default('PROGRESS'),
  genre: optionalText(40),
  tags: z.array(trimmed(30).min(1)).max(10).default([]),
  links: z.array(safeUrl).max(5).default([]),
  feedbackRequested: z.boolean().default(false),
  projectId: id.nullish(),
  audioId: id.nullish(),
  imageId: id.nullish(),
});
export const reportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'PROFILE']),
  targetId: id,
  reason: trimmed(1000).min(5, 'Tell us a little more'),
});

// ---------- profile ----------
export const profileSchema = z.object({
  displayName: trimmed(60).min(1, 'Required'),
  username: usernameSchema,
  bio: optionalText(1000),
  location: optionalText(80),
  website: optionalUrl,
  specialties: z.array(trimmed(40).min(1)).max(10).default([]),
  isPublic: z.boolean().default(true),
  socialLinks: z
    .array(z.object({ label: trimmed(30).min(1), url: safeUrl }))
    .max(10)
    .default([]),
});
export const themeSchema = z.enum(['dark', 'light', 'system']);

export const pageSchema = z.object({
  cursor: id.nullish(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
export type PostInput = z.input<typeof postSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type RequestUploadInput = z.input<typeof requestUploadSchema>;

// ---------- tracks & samples ----------
export const trackKind = z.enum(['TRACK', 'SAMPLE']);
export const trackVisibility = z.enum(['PRIVATE', 'PUBLIC']);
export const usageRights = z.enum(Object.keys(USAGE_RIGHTS) as [keyof typeof USAGE_RIGHTS]);
export const creditSchema = z.object({ name: trimmed(80).min(1), role: trimmed(40).min(1) });
export const createTrackDraftSchema = z.object({ audioId: id, kind: trackKind.default('TRACK') });
export const updateTrackSchema = z.object({
  title: trimmed(160).min(1, 'Required').optional(),
  description: optionalText(5000),
  genre: z.enum(GENRES).nullish(),
  tags: z.array(trimmed(30).min(1)).max(10).optional(),
  links: z.array(safeUrl).max(5).optional(),
  credits: z.array(creditSchema).max(20).optional(),
  bpm: z.coerce.number().int().min(20).max(400).nullish(),
  musicalKey: optionalText(12),
  artworkId: id.nullish(),
  kind: trackKind.optional(),
  visibility: trackVisibility.optional(),
  downloadable: z.boolean().optional(),
  usageRights: usageRights.nullish(),
});
export const trackListSchema = z.object({
  kind: trackKind.optional(),
  genre: z.enum(GENRES).optional(),
  tag: trimmed(30).optional(),
  q: trimmed(80).optional(),
  sort: z.enum(['recent', 'trending']).default('recent'),
  cursor: id.nullish(),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});
export type UpdateTrackInput = z.input<typeof updateTrackSchema>;
export type TrackListInput = z.input<typeof trackListSchema>;
