import { db } from '@tunetracker/data';
import { inviteMemberSchema, memberRole } from '@tunetracker/shared';
import { authorizeProject } from '../../authorization/projects';
import { AppError, notFound, parse } from '../../lib/errors';
import { rateLimit } from '../../lib/rate-limit';
import { logActivity } from '../activity';
import { notify } from '../notifications';

/** Owners add registered users directly; the invitee is notified. */
export async function inviteMember(
  actorId: string,
  projectId: string,
  input: { username: string; role: string },
) {
  const { username, role } = parse(inviteMemberSchema, input);
  const { project } = await authorizeProject(projectId, actorId, 'manage');
  await rateLimit(`invite:${actorId}`, 30, 3600);
  const invitee = await db().profile.findUnique({ where: { username } });
  if (!invitee) throw notFound('No artist with that username');
  if (invitee.id === project.ownerId) throw new AppError(400, 'The owner is already on the project');
  const member = await db().projectMember.upsert({
    where: { projectId_profileId: { projectId, profileId: invitee.id } },
    update: { role },
    create: { projectId, profileId: invitee.id, role },
  });
  await notify(
    invitee.id,
    'project.invite',
    `You were added to “${project.title}” as ${role.toLowerCase()}`,
    `/projects/${projectId}`,
  );
  await logActivity(projectId, actorId, `added @${invitee.username} as ${role.toLowerCase()}`);
  return member;
}

export async function changeRole(actorId: string, projectId: string, profileId: string, role: string) {
  const r = parse(memberRole, role);
  await authorizeProject(projectId, actorId, 'manage');
  return db().projectMember.update({
    where: { projectId_profileId: { projectId, profileId } },
    data: { role: r },
  });
}

/** Owners remove anyone; members may remove themselves (leave). */
export async function removeMember(actorId: string, projectId: string, profileId: string) {
  await authorizeProject(projectId, actorId, profileId === actorId ? 'view' : 'manage');
  await db().$transaction([
    db().task.updateMany({ where: { projectId, assigneeId: profileId }, data: { assigneeId: null } }),
    db().projectMember.delete({ where: { projectId_profileId: { projectId, profileId } } }),
  ]);
  await logActivity(
    projectId,
    actorId,
    profileId === actorId ? 'left the project' : 'removed a collaborator',
  );
}
