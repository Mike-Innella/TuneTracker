import { z } from 'zod';

export const publicProjectsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 12))
    .refine((val) => val > 0 && val <= 50, {
      message: 'Limit must be between 1 and 50',
    }),

  q: z.string().optional(),
});

export type PublicProjectsQuery = z.infer<typeof publicProjectsQuerySchema>;

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

export const updateProjectBodySchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(2000).optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.visibility !== undefined,
    { message: 'At least one field must be provided' }
  );

export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
