import { z } from 'zod';

export const postIdParamSchema = z.object({
  postId: z.string().min(1),
});

export const postCommentParamsSchema = z.object({
  postId: z.string().min(1),
  commentId: z.string().min(1),
});

export const createPostBodySchema = z.object({
  content: z.string().trim().min(1).max(1000),
  projectId: z.string().trim().min(1).optional(),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;

export const createPostCommentBodySchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export type CreatePostCommentBody = z.infer<typeof createPostCommentBodySchema>;
