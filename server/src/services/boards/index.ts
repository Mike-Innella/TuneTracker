import { db, type Prisma } from '@tunetracker/data';
import { columnTitle, labelSchema, moveColumnSchema } from '@tunetracker/shared';
import { authorizeColumn, authorizeProject } from '../../authorization/projects';
import { AppError, notFound, parse } from '../../lib/errors';
import { moveWithin } from '../../lib/ordering';
import { publicUrl } from '../../storage';
import { logActivity } from '../activity';

type Tx = Prisma.TransactionClient;

/** Serialises all ordering writes for one board so concurrent drags can't interleave. */
export function withBoardLock<T>(projectId: string, fn: (tx: Tx) => Promise<T>) {
  return db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;
    return fn(tx);
  });
}

export async function renumber(tx: Tx, model: 'task' | 'boardColumn', ids: string[]) {
  await Promise.all(
    ids.map((id, position) =>
      model === 'task'
        ? tx.task.update({ where: { id }, data: { position } })
        : tx.boardColumn.update({ where: { id }, data: { position } }),
    ),
  );
}

export async function getBoard(actorId: string, projectId: string) {
  const { project, role } = await authorizeProject(projectId, actorId, 'view');
  const [columns, labels, members, owner] = await Promise.all([
    db().boardColumn.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: {
        tasks: {
          where: { archivedAt: null },
          orderBy: { position: 'asc' },
          include: {
            labels: true,
            assignee: { select: { id: true, displayName: true, username: true, avatarPath: true } },
            checklist: { select: { done: true } },
            _count: { select: { comments: true, attachments: true } },
          },
        },
      },
    }),
    db().label.findMany({ where: { projectId }, orderBy: { name: 'asc' } }),
    db().projectMember.findMany({
      where: { projectId },
      include: { profile: { select: { id: true, displayName: true, username: true, avatarPath: true } } },
    }),
    db().profile.findUniqueOrThrow({
      where: { id: project.ownerId },
      select: { id: true, displayName: true, username: true, avatarPath: true },
    }),
  ]);
  const people = [owner, ...members.map((m) => m.profile)].map((p) => ({
    ...p,
    avatarUrl: publicUrl(p.avatarPath),
  }));
  return {
    project: { id: project.id, title: project.title, visibility: project.visibility },
    role,
    labels,
    people,
    columns: columns.map((c) => ({
      id: c.id,
      title: c.title,
      position: c.position,
      tasks: c.tasks.map(({ checklist, _count, assignee, ...t }) => ({
        ...t,
        assignee: assignee ? { ...assignee, avatarUrl: publicUrl(assignee.avatarPath) } : null,
        checklistDone: checklist.filter((i) => i.done).length,
        checklistTotal: checklist.length,
        commentCount: _count.comments,
        attachmentCount: _count.attachments,
      })),
    })),
  };
}
export type Board = Awaited<ReturnType<typeof getBoard>>;
export type BoardTask = Board['columns'][number]['tasks'][number];

export async function addColumn(actorId: string, projectId: string, title: string) {
  const t = parse(columnTitle, title);
  await authorizeProject(projectId, actorId, 'edit');
  return withBoardLock(projectId, async (tx) => {
    const count = await tx.boardColumn.count({ where: { projectId } });
    if (count >= 20) throw new AppError(400, 'A board can have at most 20 columns');
    return tx.boardColumn.create({ data: { projectId, title: t, position: count } });
  });
}

export async function renameColumn(actorId: string, columnId: string, title: string) {
  const t = parse(columnTitle, title);
  await authorizeColumn(columnId, actorId, 'edit');
  return db().boardColumn.update({ where: { id: columnId }, data: { title: t } });
}

export async function moveColumn(actorId: string, input: { columnId: string; toIndex: number }) {
  const { columnId, toIndex } = parse(moveColumnSchema, input);
  const { project } = await authorizeColumn(columnId, actorId, 'edit');
  return withBoardLock(project.id, async (tx) => {
    const cols = await tx.boardColumn.findMany({
      where: { projectId: project.id },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    const ids = cols.map((c) => c.id);
    await renumber(tx, 'boardColumn', moveWithin(ids, ids.indexOf(columnId), toIndex));
  });
}

/** Deleting a column keeps its tasks: they move to the end of the neighbouring column. */
export async function deleteColumn(actorId: string, columnId: string) {
  const { project } = await authorizeColumn(columnId, actorId, 'edit');
  await withBoardLock(project.id, async (tx) => {
    const cols = await tx.boardColumn.findMany({
      where: { projectId: project.id },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    if (cols.length <= 1) throw new AppError(400, 'A board needs at least one column');
    const idx = cols.findIndex((c) => c.id === columnId);
    const target = cols[idx === 0 ? 1 : idx - 1]!;
    const [moving, existing] = await Promise.all([
      tx.task.findMany({ where: { columnId }, orderBy: { position: 'asc' }, select: { id: true } }),
      tx.task.count({ where: { columnId: target.id } }),
    ]);
    await Promise.all(
      moving.map((t, i) =>
        tx.task.update({ where: { id: t.id }, data: { columnId: target.id, position: existing + i } }),
      ),
    );
    await tx.boardColumn.delete({ where: { id: columnId } });
    await renumber(
      tx,
      'boardColumn',
      cols.filter((c) => c.id !== columnId).map((c) => c.id),
    );
  });
  await logActivity(project.id, actorId, 'removed a board column');
}

export async function createLabel(
  actorId: string,
  projectId: string,
  input: { name: string; color: string },
) {
  const data = parse(labelSchema, input);
  await authorizeProject(projectId, actorId, 'edit');
  return db().label.create({ data: { ...data, projectId } });
}

export async function deleteLabel(actorId: string, labelId: string) {
  const label = await db().label.findUnique({ where: { id: labelId } });
  if (!label) throw notFound('Label not found');
  await authorizeProject(label.projectId, actorId, 'edit');
  await db().label.delete({ where: { id: labelId } });
}
