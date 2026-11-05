import { z } from 'zod';

export const projectTrackParamsSchema = z.object({
  projectId: z.string().min(1),
});

export const trackIdParamsSchema = z.object({
  projectId: z.string().min(1),
  trackId: z.string().min(1),
});

export const publicTrackParamsSchema = z.object({
  projectId: z.string().min(1),
  trackId: z.string().min(1),
});

export const createTrackBodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['IDEA', 'DRAFT', 'MIX', 'MASTER']).optional().default('DRAFT'),
  bpm: z.number().int().min(1).max(400).optional(),
  key: z.string().trim().max(20).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  audioDataUrl: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
  const hasFileName = Boolean(value.fileName);
  const hasAudioData = Boolean(value.audioDataUrl);

  if (hasFileName !== hasAudioData) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['audioDataUrl'],
      message: 'fileName and audioDataUrl must be provided together',
    });
  }
});

export type CreateTrackBody = z.infer<typeof createTrackBodySchema>;

export const updateTrackBodySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(['IDEA', 'DRAFT', 'MIX', 'MASTER']).optional(),
  bpm: z.number().int().min(1).max(400).nullable().optional(),
  key: z.string().trim().max(20).nullable().optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  audioDataUrl: z.string().trim().min(1).optional(),
  deleteAudio: z.boolean().optional(),
}).superRefine((value, ctx) => {
  const hasFileName = Boolean(value.fileName);
  const hasAudioData = Boolean(value.audioDataUrl);

  if (hasFileName !== hasAudioData) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['audioDataUrl'],
      message: 'fileName and audioDataUrl must be provided together',
    });
  }

  if (value.deleteAudio && (hasFileName || hasAudioData)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['deleteAudio'],
      message: 'deleteAudio cannot be used while uploading a new audio file',
    });
  }

  const hasAtLeastOneField =
    value.title !== undefined ||
    value.description !== undefined ||
    value.status !== undefined ||
    value.bpm !== undefined ||
    value.key !== undefined ||
    hasFileName ||
    hasAudioData ||
    value.deleteAudio === true;

  if (!hasAtLeastOneField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one track field must be provided',
    });
  }
});

export type UpdateTrackBody = z.infer<typeof updateTrackBodySchema>;

export const createTrackCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(1000),
});

export type CreateTrackCommentBody = z.infer<typeof createTrackCommentBodySchema>;

export const upsertTrackRatingBodySchema = z.object({
  value: z.number().int().min(1).max(5),
});

export type UpsertTrackRatingBody = z.infer<typeof upsertTrackRatingBodySchema>;

export const createTrackEntryBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type CreateTrackEntryBody = z.infer<typeof createTrackEntryBodySchema>;
