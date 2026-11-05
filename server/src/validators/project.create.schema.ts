import { z } from "zod";

export const createProjectBodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PRIVATE"),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).optional().default([]),
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
