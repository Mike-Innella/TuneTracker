import { prisma } from '../lib/prisma';
import type { CreateProjectBody } from '../validators/project.create.schema';

export async function createProject(
  ownerId: string | undefined,
  body: CreateProjectBody
) {
  if (!ownerId) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }

  const project = await prisma.project.create({
    data: {
      ownerId,
      title: body.title,
      description: body.description ?? null,
      visibility: body.visibility,
    },
  });

  return project;
}
