import { prisma } from '../lib/prisma';
import { withTrackAudioUrl } from '../lib/trackAudio';
import type {
  PublicProjectsQuery,
  UpdateProjectBody,
} from '../validators/project.schema';

function unauthorizedError() {
  return Object.assign(new Error('Unauthorized'), { statusCode: 401 });
}

function notFoundError() {
  return Object.assign(new Error('Project not found'), { statusCode: 404 });
}

function forbiddenError() {
  return Object.assign(new Error('Forbidden'), { statusCode: 403 });
}

export const projectService = {
  async getPublicProjects(query: PublicProjectsQuery) {
    const rawPage = Number((query as any).page ?? 1);
    const rawLimit = Number((query as any).limit ?? 12);
    const q =
      typeof (query as any).q === 'string' && (query as any).q.trim()
        ? (query as any).q.trim()
        : undefined;

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isInteger(rawLimit) && rawLimit > 0 && rawLimit <= 50 ? rawLimit : 12;

    const skip = (page - 1) * limit;

    const where = {
      visibility: 'PUBLIC' as const,
      ...(q && {
        OR: [{ title: { contains: q } }, { description: { contains: q } }],
      }),
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              displayName: true,
              email: true,
              profileImageData: true,
            },
          },
          _count: {
            select: {
              tracks: true,
            },
          },
        },
      }),
    ]);

    return {
      data: projects,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getPublicProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageData: true,
          },
        },
        tracks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project || project.visibility !== 'PUBLIC') {
      throw Object.assign(new Error('Project not found'), { statusCode: 404 });
    }

    return {
      ...project,
      tracks: project.tracks.map((track) => withTrackAudioUrl(track)),
    };
  },

  async getMyProjects(userId?: string) {
    if (!userId) throw unauthorizedError();

    return prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
    });
  },

  async getProjectById(projectId: string, viewerUserId?: string) {
    if (!viewerUserId) throw unauthorizedError();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw notFoundError();
    if (project.ownerId !== viewerUserId && project.visibility !== 'PUBLIC') {
      throw forbiddenError();
    }

    return project;
  },

  async updateProject(projectId: string, ownerId: string | undefined, patch: UpdateProjectBody) {
    if (!ownerId) throw unauthorizedError();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) throw notFoundError();
    if (project.ownerId !== ownerId) throw forbiddenError();

    return prisma.project.update({
      where: { id: project.id },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
      },
    });
  },

  async deleteProject(projectId: string, ownerId: string | undefined) {
    if (!ownerId) throw unauthorizedError();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) throw notFoundError();
    if (project.ownerId !== ownerId) throw forbiddenError();

    await prisma.project.delete({ where: { id: project.id } });

    return { success: true };
  },
};
