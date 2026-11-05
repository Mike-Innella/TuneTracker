'use server';

import type { UpdateTaskInput } from '@tunetracker/shared';
import { boards, media, requireActor, runAction, tasks } from '@tunetracker/server';

const me = async () => (await requireActor()).id;

export const addColumnAction = async (projectId: string, title: string) =>
  runAction(async () => boards.addColumn(await me(), projectId, title));
export const renameColumnAction = async (columnId: string, title: string) =>
  runAction(async () => boards.renameColumn(await me(), columnId, title));
export const moveColumnAction = async (columnId: string, toIndex: number) =>
  runAction(async () => boards.moveColumn(await me(), { columnId, toIndex }));
export const deleteColumnAction = async (columnId: string) =>
  runAction(async () => boards.deleteColumn(await me(), columnId));

export const createTaskAction = async (columnId: string, title: string) =>
  runAction(async () => tasks.createTask(await me(), { columnId, title }));
export const updateTaskAction = async (taskId: string, input: UpdateTaskInput) =>
  runAction(async () => tasks.updateTask(await me(), taskId, input));
export const moveTaskAction = async (taskId: string, toColumnId: string, toIndex: number) =>
  runAction(async () => tasks.moveTask(await me(), { taskId, toColumnId, toIndex }));
export const archiveTaskAction = async (taskId: string, archived = true) =>
  runAction(async () => tasks.setTaskArchived(await me(), taskId, archived));
export const deleteTaskAction = async (taskId: string) =>
  runAction(async () => tasks.deleteTask(await me(), taskId));
export const getTaskAction = async (taskId: string) =>
  runAction(async () => tasks.getTask(await me(), taskId));

export const addChecklistItemAction = async (taskId: string, text: string) =>
  runAction(async () => tasks.addChecklistItem(await me(), taskId, text));
export const toggleChecklistItemAction = async (itemId: string, done: boolean) =>
  runAction(async () => tasks.toggleChecklistItem(await me(), itemId, done));
export const deleteChecklistItemAction = async (itemId: string) =>
  runAction(async () => tasks.deleteChecklistItem(await me(), itemId));

export const addTaskCommentAction = async (taskId: string, body: string) =>
  runAction(async () => tasks.addTaskComment(await me(), taskId, body));
export const deleteTaskCommentAction = async (commentId: string) =>
  runAction(async () => tasks.deleteTaskComment(await me(), commentId));

export const createLabelAction = async (projectId: string, name: string, color: string) =>
  runAction(async () => boards.createLabel(await me(), projectId, { name, color }));
export const deleteAttachmentAction = async (assetId: string) =>
  runAction(async () => media.deleteMedia(await me(), assetId));
