'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { UpdateProjectInput } from '@tunetracker/shared';
import { collaboration, projects, requireActor, runAction } from '@tunetracker/backend';

const formObject = (form: FormData) => Object.fromEntries(form) as Record<string, string>;

export async function createProjectAction(_: unknown, form: FormData) {
  const result = await runAction(async () => {
    const me = await requireActor();
    return projects.createProject(me.id, formObject(form) as never);
  });
  if (result.ok) redirect(`/projects/${result.data.id}/board`);
  return result;
}

export async function updateProjectAction(projectId: string, input: UpdateProjectInput) {
  return runAction(async () => {
    const me = await requireActor();
    await projects.updateProject(me.id, projectId, input);
    revalidatePath(`/projects/${projectId}`, 'layout');
  });
}

export async function archiveProjectAction(projectId: string, archived: boolean) {
  return runAction(async () => {
    await projects.setArchived((await requireActor()).id, projectId, archived);
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`, 'layout');
  });
}

export async function deleteProjectAction(projectId: string) {
  const result = await runAction(async () => projects.deleteProject((await requireActor()).id, projectId));
  if (result.ok) redirect('/projects');
  return result;
}

export async function inviteMemberAction(projectId: string, input: { target: string; role: string }) {
  return runAction(async () => {
    const r = await collaboration.inviteMember((await requireActor()).id, projectId, input);
    revalidatePath(`/projects/${projectId}`, 'layout');
    return r;
  });
}

export async function revokeInviteAction(projectId: string, inviteId: string) {
  return runAction(async () => {
    await collaboration.revokeInvite((await requireActor()).id, inviteId);
    revalidatePath(`/projects/${projectId}`, 'layout');
  });
}

export async function respondToInviteAction(inviteId: string, accept: boolean) {
  return runAction(async () => {
    const r = await collaboration.respondToInvite((await requireActor()).id, inviteId, accept);
    revalidatePath('/dashboard');
    revalidatePath('/projects');
    return r;
  });
}

export async function changeRoleAction(projectId: string, profileId: string, role: string) {
  return runAction(async () => {
    await collaboration.changeRole((await requireActor()).id, projectId, profileId, role);
    revalidatePath(`/projects/${projectId}`, 'layout');
  });
}

export async function removeMemberAction(projectId: string, profileId: string) {
  const result = await runAction(async () => {
    const me = await requireActor();
    await collaboration.removeMember(me.id, projectId, profileId);
    return me.id === profileId;
  });
  if (result.ok && result.data) redirect('/projects');
  if (result.ok) revalidatePath(`/projects/${projectId}`, 'layout');
  return result;
}
