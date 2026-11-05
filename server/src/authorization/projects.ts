import 'server-only';
import { db, type Project } from '@tunetracker/data';
import type { Role } from '@tunetracker/shared';
import { can, type ProjectAction } from './permissions';
import { forbidden, notFound } from '../lib/errors';

export async function getRole(
  projectId: string,
  profileId: string | null,
): Promise<{
  project: Project;
  role: Role | null;
} | null> {
  const project = await db().project.findUnique({
    where: { id: projectId },
    include: profileId ? { members: { where: { profileId } } } : undefined,
  });
  if (!project) return null;
  if (profileId && project.ownerId === profileId) return { project, role: 'OWNER' };
  const member = (project as Project & { members?: { role: Role }[] }).members?.[0];
  return { project, role: member?.role ?? null };
}

/**
 * Loads a project and asserts the actor may perform `action`.
 * Non-members get 404 (not 403) for private projects so IDs can't be probed.
 */
export async function authorizeProject(
  projectId: string,
  profileId: string,
  action: ProjectAction,
): Promise<{ project: Project; role: Role }> {
  const found = await getRole(projectId, profileId);
  if (!found || !found.role) throw notFound('Project not found');
  if (!can(found.role, action)) throw forbidden();
  return { project: found.project, role: found.role };
}

/** Resolve the project owning a task/column and authorize against it. */
export async function authorizeTask(taskId: string, profileId: string, action: ProjectAction) {
  const task = await db().task.findUnique({ where: { id: taskId }, select: { projectId: true } });
  if (!task) throw notFound('Task not found');
  return authorizeProject(task.projectId, profileId, action);
}

export async function authorizeColumn(columnId: string, profileId: string, action: ProjectAction) {
  const column = await db().boardColumn.findUnique({
    where: { id: columnId },
    select: { projectId: true },
  });
  if (!column) throw notFound('Column not found');
  return authorizeProject(column.projectId, profileId, action);
}
