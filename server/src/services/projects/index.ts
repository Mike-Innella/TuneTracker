import { db, type Prisma } from '@tunetracker/data';
import {
  PROJECT_TEMPLATES,
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@tunetracker/shared';
import { authorizeProject, getRole } from '../../authorization/projects';
import { parse, notFound } from '../../lib/errors';
import { publicUrl, removeObjects } from '../../storage';
import { logActivity } from '../activity';

/** Progress = share of live tasks sitting in the board's last column. */
export function computeProgress(columns: { position: number; taskCount: number }[]): number {
  const total = columns.reduce((n, c) => n + c.taskCount, 0);
  if (total === 0) return 0;
  const last = columns.reduce((a, b) => (b.position > a.position ? b : a));
  return Math.round((last.taskCount / total) * 100);
}

const accessibleBy = (actorId: string): Prisma.ProjectWhereInput => ({
  OR: [{ ownerId: actorId }, { members: { some: { profileId: actorId } } }],
});

export async function listProjects(actorId: string, opts: { archived?: boolean } = {}) {
  const projects = await db().project.findMany({
    where: { ...accessibleBy(actorId), archivedAt: opts.archived ? { not: null } : null },
    orderBy: { updatedAt: 'desc' },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarPath: true } },
      columns: {
        select: {
          position: true,
          _count: { select: { tasks: { where: { archivedAt: null } } } },
        },
      },
      _count: { select: { members: true } },
    },
  });
  return projects.map(({ columns, ...p }) => ({
    ...p,
    artworkUrl: publicUrl(p.artworkPath),
    taskCount: columns.reduce((n, c) => n + c._count.tasks, 0),
    progress: computeProgress(columns.map((c) => ({ position: c.position, taskCount: c._count.tasks }))),
    role: p.ownerId === actorId ? ('OWNER' as const) : ('MEMBER' as const),
  }));
}

export async function getProject(actorId: string, projectId: string) {
  const { project, role } = await authorizeProject(projectId, actorId, 'view');
  const [members, activity, owner] = await Promise.all([
    db().projectMember.findMany({
      where: { projectId },
      include: { profile: { select: { id: true, username: true, displayName: true, avatarPath: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    db().activity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { actor: { select: { displayName: true, username: true } } },
    }),
    db().profile.findUniqueOrThrow({
      where: { id: project.ownerId },
      select: { id: true, username: true, displayName: true, avatarPath: true },
    }),
  ]);
  return {
    project: { ...project, artworkUrl: publicUrl(project.artworkPath) },
    role,
    members,
    activity,
    owner,
  };
}

export async function createProject(actorId: string, input: CreateProjectInput) {
  const data = parse(createProjectSchema, input);
  const template = PROJECT_TEMPLATES[data.template];
  const project = await db().project.create({
    data: {
      ownerId: actorId,
      title: data.title,
      description: data.description,
      visibility: data.visibility,
      dueDate: data.dueDate,
      template: data.template,
      columns: { create: template.columns.map((title, position) => ({ title, position })) },
    },
  });
  await logActivity(project.id, actorId, `created the project`);
  return project;
}

export async function updateProject(actorId: string, projectId: string, input: UpdateProjectInput) {
  const data = parse(updateProjectSchema, input);
  // visibility & settings are owner-only; editors may update title/description/status/due date
  const needsOwner = data.visibility !== undefined || data.artworkPath !== undefined;
  await authorizeProject(projectId, actorId, needsOwner ? 'manage' : 'edit');
  if (data.artworkPath) {
    const asset = await db().mediaAsset.findFirst({
      where: { path: data.artworkPath, ownerId: actorId, kind: 'IMAGE', verifiedAt: { not: null } },
    });
    if (!asset) throw notFound('Artwork upload not found');
  }
  const project = await db().project.update({ where: { id: projectId }, data });
  await logActivity(projectId, actorId, 'updated project details');
  return project;
}

export async function setArchived(actorId: string, projectId: string, archived: boolean) {
  await authorizeProject(projectId, actorId, 'manage');
  await logActivity(projectId, actorId, archived ? 'archived the project' : 'restored the project');
  return db().project.update({
    where: { id: projectId },
    data: { archivedAt: archived ? new Date() : null },
  });
}

/** Deletes the project and its private files; media still used by published posts is kept. */
export async function deleteProject(actorId: string, projectId: string) {
  await authorizeProject(projectId, actorId, 'manage');
  const orphans = await db().mediaAsset.findMany({
    where: {
      OR: [{ projectId }, { task: { projectId } }],
      audioPosts: { none: {} },
      imagePosts: { none: {} },
    },
    select: { id: true, bucket: true, path: true },
  });
  for (const bucket of new Set(orphans.map((o) => o.bucket))) {
    await removeObjects(
      bucket,
      orphans.filter((o) => o.bucket === bucket).map((o) => o.path),
    );
  }
  await db().$transaction([
    db().mediaAsset.deleteMany({ where: { id: { in: orphans.map((o) => o.id) } } }),
    db().project.delete({ where: { id: projectId } }),
  ]);
}

/** Public view: only fields the owner explicitly made public. Never tasks or private media. */
export async function getPublicProject(projectId: string, viewerId: string | null) {
  const found = await getRole(projectId, viewerId);
  if (!found) throw notFound('Project not found');
  const { project, role } = found;
  if (project.visibility !== 'PUBLIC' && !role) throw notFound('Project not found');
  const owner = await db().profile.findUniqueOrThrow({
    where: { id: project.ownerId },
    select: { username: true, displayName: true, avatarPath: true },
  });
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    artworkUrl: publicUrl(project.artworkPath),
    owner: { ...owner, avatarUrl: publicUrl(owner.avatarPath) },
    createdAt: project.createdAt,
  };
}
