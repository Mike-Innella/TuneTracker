import { describe, expect, it } from 'vitest';
import { db } from '@tunetracker/data';
import * as boards from '../../src/services/boards';
import * as projects from '../../src/services/projects';
import * as tasks from '../../src/services/tasks';
import * as collaboration from '../../src/services/collaboration';
import { makeProfile } from './helpers';

const titles = async (projectId: string) => {
  const board = await db().boardColumn.findMany({
    where: { projectId },
    orderBy: { position: 'asc' },
    include: { tasks: { where: { archivedAt: null }, orderBy: { position: 'asc' } } },
  });
  return board.map((c) => [c.title, c.tasks.map((t) => t.title)]);
};

describe('projects + kanban persistence', () => {
  it('creates a project from a template with ordered columns', async () => {
    const owner = await makeProfile('owner');
    const p = await projects.createProject(owner.id, { title: 'Midnight Drive', template: 'mixing' });
    expect(await titles(p.id)).toEqual([
      ['To mix', []],
      ['Balancing', []],
      ['Revisions', []],
      ['Approved', []],
    ]);
    const list = await projects.listProjects(owner.id);
    expect(list.find((x) => x.id === p.id)).toMatchObject({ progress: 0, role: 'OWNER' });
  });

  it('persists task order across moves within and between columns', async () => {
    const owner = await makeProfile('owner');
    const p = await projects.createProject(owner.id, { title: 'Echoes', template: 'blank' });
    const [todo, doing] = await db().boardColumn.findMany({
      where: { projectId: p.id },
      orderBy: { position: 'asc' },
    });
    const a = await tasks.createTask(owner.id, { columnId: todo!.id, title: 'A' });
    await tasks.createTask(owner.id, { columnId: todo!.id, title: 'B' });
    const c = await tasks.createTask(owner.id, { columnId: todo!.id, title: 'C' });

    await tasks.moveTask(owner.id, { taskId: c.id, toColumnId: todo!.id, toIndex: 0 });
    await tasks.moveTask(owner.id, { taskId: a.id, toColumnId: doing!.id, toIndex: 0 });
    expect(await titles(p.id)).toEqual([
      ['To do', ['C', 'B']],
      ['In progress', ['A']],
      ['Done', []],
    ]);
    const positions = await db().task.findMany({
      where: { columnId: todo!.id },
      orderBy: { position: 'asc' },
    });
    expect(positions.map((t) => t.position)).toEqual([0, 1]);
  });

  it('serialises concurrent moves without duplicate positions', async () => {
    const owner = await makeProfile('owner');
    const p = await projects.createProject(owner.id, { title: 'Race', template: 'blank' });
    const [todo, doing] = await db().boardColumn.findMany({
      where: { projectId: p.id },
      orderBy: { position: 'asc' },
    });
    const made = [];
    for (const t of ['1', '2', '3', '4'])
      made.push(await tasks.createTask(owner.id, { columnId: todo!.id, title: t }));
    await Promise.all(
      made.map((t, i) => tasks.moveTask(owner.id, { taskId: t.id, toColumnId: doing!.id, toIndex: i })),
    );
    const rows = await db().task.findMany({ where: { columnId: doing!.id } });
    expect(new Set(rows.map((r) => r.position)).size).toBe(4);
  });

  it('customises columns: add, rename, reorder, delete keeps tasks', async () => {
    const owner = await makeProfile('owner');
    const p = await projects.createProject(owner.id, { title: 'Cols', template: 'blank' });
    const col = await boards.addColumn(owner.id, p.id, 'Mastering');
    await boards.renameColumn(owner.id, col.id, 'Master');
    await boards.moveColumn(owner.id, { columnId: col.id, toIndex: 0 });
    const [, todo] = await db().boardColumn.findMany({
      where: { projectId: p.id },
      orderBy: { position: 'asc' },
    });
    await tasks.createTask(owner.id, { columnId: todo!.id, title: 'Keep me' });
    await boards.deleteColumn(owner.id, todo!.id);
    expect(await titles(p.id)).toEqual([
      ['Master', ['Keep me']],
      ['In progress', []],
      ['Done', []],
    ]);
  });

  it('task details: labels, checklist, comments, archive', async () => {
    const owner = await makeProfile('owner');
    const p = await projects.createProject(owner.id, { title: 'Detail' });
    const [col] = await db().boardColumn.findMany({
      where: { projectId: p.id },
      orderBy: { position: 'asc' },
    });
    const t = await tasks.createTask(owner.id, { columnId: col!.id, title: 'Vocals' });
    const label = await boards.createLabel(owner.id, p.id, { name: 'vocals', color: '#7c3aed' });
    await tasks.updateTask(owner.id, t.id, {
      priority: 'HIGH',
      bpm: 124,
      musicalKey: 'F#m',
      labelIds: [label.id],
    });
    const item = await tasks.addChecklistItem(owner.id, t.id, 'Comp takes');
    await tasks.toggleChecklistItem(owner.id, item.id, true);
    await tasks.addTaskComment(owner.id, t.id, 'Session log: tracked 6 takes');
    const { task } = await tasks.getTask(owner.id, t.id);
    expect(task).toMatchObject({ priority: 'HIGH', bpm: 124, musicalKey: 'F#m' });
    expect(task.labels.map((l) => l.name)).toEqual(['vocals']);
    expect(task.checklist[0]).toMatchObject({ done: true });
    expect(task.comments).toHaveLength(1);
    await tasks.setTaskArchived(owner.id, t.id, true);
    const board = await boards.getBoard(owner.id, p.id);
    expect(board.columns[0]!.tasks).toHaveLength(0);
  });
});

describe('authorization', () => {
  it('hides private projects from strangers (404, not 403)', async () => {
    const owner = await makeProfile('owner');
    const stranger = await makeProfile('stranger');
    const p = await projects.createProject(owner.id, { title: 'Secret' });
    await expect(projects.getProject(stranger.id, p.id)).rejects.toMatchObject({ status: 404 });
    await expect(boards.getBoard(stranger.id, p.id)).rejects.toMatchObject({ status: 404 });
    await expect(projects.getPublicProject(p.id, null)).rejects.toMatchObject({ status: 404 });
  });

  it('enforces viewer/editor/owner roles server-side', async () => {
    const owner = await makeProfile('owner');
    const editor = await makeProfile('editor');
    const viewer = await makeProfile('viewer');
    const p = await projects.createProject(owner.id, { title: 'Team' });
    await collaboration.inviteMember(owner.id, p.id, { username: editor.username, role: 'EDITOR' });
    await collaboration.inviteMember(owner.id, p.id, { username: viewer.username, role: 'VIEWER' });
    const [col] = await db().boardColumn.findMany({ where: { projectId: p.id } });

    const t = await tasks.createTask(editor.id, { columnId: col!.id, title: 'by editor' });
    await expect(tasks.createTask(viewer.id, { columnId: col!.id, title: 'nope' })).rejects.toMatchObject({
      status: 403,
    });
    await expect(tasks.addTaskComment(viewer.id, t.id, 'viewers can comment')).resolves.toBeTruthy();
    await expect(projects.updateProject(editor.id, p.id, { visibility: 'PUBLIC' })).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      collaboration.inviteMember(editor.id, p.id, { username: viewer.username, role: 'EDITOR' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(projects.deleteProject(editor.id, p.id)).rejects.toMatchObject({ status: 403 });

    // assignment only to collaborators, and the assignee is notified
    const outsider = await makeProfile('outsider');
    await expect(tasks.updateTask(owner.id, t.id, { assigneeId: outsider.id })).rejects.toMatchObject({
      status: 400,
    });
    await tasks.updateTask(owner.id, t.id, { assigneeId: editor.id });
    expect(await db().notification.count({ where: { recipientId: editor.id, type: 'task.assigned' } })).toBe(
      1,
    );

    // shared projects show up for members; removal revokes access
    expect((await projects.listProjects(viewer.id)).map((x) => x.id)).toContain(p.id);
    await collaboration.removeMember(owner.id, p.id, viewer.id);
    await expect(projects.getProject(viewer.id, p.id)).rejects.toMatchObject({ status: 404 });
  });

  it('rejects moving a task into another project’s column (IDOR)', async () => {
    const a = await makeProfile('a');
    const pa = await projects.createProject(a.id, { title: 'A' });
    const pb = await projects.createProject(a.id, { title: 'B' });
    const [ca] = await db().boardColumn.findMany({ where: { projectId: pa.id } });
    const [cb] = await db().boardColumn.findMany({ where: { projectId: pb.id } });
    const t = await tasks.createTask(a.id, { columnId: ca!.id, title: 't' });
    await expect(
      tasks.moveTask(a.id, { taskId: t.id, toColumnId: cb!.id, toIndex: 0 }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('every public table has row level security enabled', async () => {
    const rows = await db().$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' AND NOT rowsecurity`;
    expect(rows).toEqual([]);
  });
});
