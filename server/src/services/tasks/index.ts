import { db } from '@tunetracker/data';
import {
  checklistItemSchema,
  commentSchema,
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
  type UpdateTaskInput,
} from '@tunetracker/shared';
import { authorizeColumn, authorizeTask } from '../../authorization/projects';
import { AppError, notFound, parse } from '../../lib/errors';
import { moveBetween, moveWithin } from '../../lib/ordering';
import { publicUrl, signedReadUrls } from '../../storage';
import { logActivity } from '../activity';
import { notify } from '../notifications';
import { renumber, withBoardLock } from '../boards';

async function assertProjectPerson(projectId: string, profileId: string) {
  const project = await db().project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, members: { where: { profileId }, select: { profileId: true } } },
  });
  if (!project || (project.ownerId !== profileId && project.members.length === 0)) {
    throw new AppError(400, 'Assignee must be a collaborator on this project');
  }
}

export async function createTask(actorId: string, input: { columnId: string; title: string }) {
  const { columnId, title } = parse(createTaskSchema, input);
  const { project } = await authorizeColumn(columnId, actorId, 'edit');
  const task = await withBoardLock(project.id, async (tx) => {
    const count = await tx.task.count({ where: { columnId, archivedAt: null } });
    if (count >= 500) throw new AppError(400, 'This column is full');
    return tx.task.create({ data: { projectId: project.id, columnId, title, position: count } });
  });
  await logActivity(project.id, actorId, `added task “${title}”`);
  return task;
}

export async function updateTask(actorId: string, taskId: string, input: UpdateTaskInput) {
  const { labelIds, ...data } = parse(updateTaskSchema, input);
  const { project } = await authorizeTask(taskId, actorId, 'edit');
  const before = await db().task.findUniqueOrThrow({ where: { id: taskId } });
  if (data.assigneeId) await assertProjectPerson(project.id, data.assigneeId);
  if (labelIds) {
    const owned = await db().label.count({ where: { id: { in: labelIds }, projectId: project.id } });
    if (owned !== labelIds.length) throw new AppError(400, 'Unknown label');
  }
  const task = await db().task.update({
    where: { id: taskId },
    data: { ...data, ...(labelIds ? { labels: { set: labelIds.map((id) => ({ id })) } } : {}) },
  });
  if (data.assigneeId && data.assigneeId !== before.assigneeId && data.assigneeId !== actorId) {
    await notify(
      data.assigneeId,
      'task.assigned',
      `You were assigned “${task.title}” in ${project.title}`,
      `/projects/${project.id}/board?task=${task.id}`,
    );
  }
  return task;
}

/**
 * Moves a task to `toIndex` in `toColumnId` and renumbers both columns.
 * Indices refer to the live (non-archived) tasks, matching what the client renders.
 */
export async function moveTask(
  actorId: string,
  input: { taskId: string; toColumnId: string; toIndex: number },
) {
  const { taskId, toColumnId, toIndex } = parse(moveTaskSchema, input);
  const { project } = await authorizeTask(taskId, actorId, 'edit');
  await withBoardLock(project.id, async (tx) => {
    const task = await tx.task.findUniqueOrThrow({ where: { id: taskId } });
    const target = await tx.boardColumn.findUnique({ where: { id: toColumnId } });
    if (!target || target.projectId !== project.id) throw notFound('Column not found');
    const list = (columnId: string) =>
      tx.task
        .findMany({
          where: { columnId, archivedAt: null },
          orderBy: { position: 'asc' },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id));
    const sourceIds = await list(task.columnId);
    const from = sourceIds.indexOf(taskId);
    if (task.columnId === toColumnId) {
      await renumber(tx, 'task', moveWithin(sourceIds, from, toIndex));
      return;
    }
    const moved = moveBetween(sourceIds, await list(toColumnId), from, toIndex);
    await tx.task.update({ where: { id: taskId }, data: { columnId: toColumnId } });
    await renumber(tx, 'task', moved.source);
    await renumber(tx, 'task', moved.target);
  });
}

export async function setTaskArchived(actorId: string, taskId: string, archived: boolean) {
  const { project } = await authorizeTask(taskId, actorId, 'edit');
  const task = await db().task.update({
    where: { id: taskId },
    data: { archivedAt: archived ? new Date() : null },
  });
  await logActivity(project.id, actorId, `${archived ? 'archived' : 'restored'} “${task.title}”`);
  return task;
}

export async function deleteTask(actorId: string, taskId: string) {
  const { project } = await authorizeTask(taskId, actorId, 'edit');
  const task = await db().task.delete({ where: { id: taskId } });
  await logActivity(project.id, actorId, `deleted “${task.title}”`);
}

export async function getTask(actorId: string, taskId: string) {
  const { role } = await authorizeTask(taskId, actorId, 'view');
  const task = await db().task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      labels: true,
      checklist: { orderBy: { position: 'asc' } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, displayName: true, username: true, avatarPath: true } } },
      },
      attachments: { where: { verifiedAt: { not: null } }, orderBy: { createdAt: 'desc' } },
      column: { select: { title: true } },
    },
  });
  const urls = await signedReadUrls(task.attachments.filter((a) => a.bucket === 'media').map((a) => a.path));
  return {
    role,
    task: {
      ...task,
      comments: task.comments.map((c) => ({
        ...c,
        author: { ...c.author, avatarUrl: publicUrl(c.author.avatarPath) },
      })),
      attachments: task.attachments.map((a) => ({
        ...a,
        url: a.bucket === 'media' ? (urls.get(a.path) ?? null) : publicUrl(a.path),
      })),
    },
  };
}

export async function addChecklistItem(actorId: string, taskId: string, text: string) {
  const data = parse(checklistItemSchema, { text });
  await authorizeTask(taskId, actorId, 'edit');
  const count = await db().checklistItem.count({ where: { taskId } });
  if (count >= 100) throw new AppError(400, 'Checklist is full');
  return db().checklistItem.create({ data: { taskId, text: data.text, position: count } });
}

async function checklistTask(itemId: string) {
  const item = await db().checklistItem.findUnique({ where: { id: itemId }, select: { taskId: true } });
  if (!item) throw notFound('Checklist item not found');
  return item.taskId;
}

export async function toggleChecklistItem(actorId: string, itemId: string, done: boolean) {
  await authorizeTask(await checklistTask(itemId), actorId, 'edit');
  return db().checklistItem.update({ where: { id: itemId }, data: { done } });
}

export async function deleteChecklistItem(actorId: string, itemId: string) {
  await authorizeTask(await checklistTask(itemId), actorId, 'edit');
  await db().checklistItem.delete({ where: { id: itemId } });
}

export async function addTaskComment(actorId: string, taskId: string, body: string) {
  const data = parse(commentSchema, { body });
  const { project } = await authorizeTask(taskId, actorId, 'comment');
  const comment = await db().taskComment.create({ data: { taskId, authorId: actorId, body: data.body } });
  const task = await db().task.findUniqueOrThrow({
    where: { id: taskId },
    select: { title: true, assigneeId: true },
  });
  if (task.assigneeId && task.assigneeId !== actorId) {
    await notify(
      task.assigneeId,
      'task.comment',
      `New comment on “${task.title}”`,
      `/projects/${project.id}/board?task=${taskId}`,
    );
  }
  return comment;
}

export async function deleteTaskComment(actorId: string, commentId: string) {
  const comment = await db().taskComment.findUnique({ where: { id: commentId } });
  if (!comment) throw notFound('Comment not found');
  const { role } = await authorizeTask(comment.taskId, actorId, 'view');
  if (comment.authorId !== actorId && role !== 'OWNER') throw new AppError(403, 'Not your comment');
  await db().taskComment.delete({ where: { id: commentId } });
}

/** Tasks due soon across every project the actor can see (dashboard). */
export function upcomingTasks(actorId: string, limit = 6) {
  return db().task.findMany({
    where: {
      archivedAt: null,
      dueDate: { not: null },
      project: {
        archivedAt: null,
        OR: [{ ownerId: actorId }, { members: { some: { profileId: actorId } } }],
      },
    },
    orderBy: { dueDate: 'asc' },
    take: limit,
    include: { project: { select: { id: true, title: true } }, column: { select: { title: true } } },
  });
}
