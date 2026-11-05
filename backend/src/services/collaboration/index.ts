import { db } from '@tunetracker/data';
import { inviteMemberSchema, memberRole } from '@tunetracker/shared';
import { supabaseAdmin } from '../../auth/supabase';
import { authorizeProject } from '../../authorization/projects';
import { AppError, forbidden, notFound, parse } from '../../lib/errors';
import { env } from '../../lib/env';
import { rateLimit } from '../../lib/rate-limit';
import { publicUrl } from '../../storage';
import { logActivity } from '../activity';
import { notify } from '../notifications';

/**
 * Owners invite collaborators. Nobody joins a project without accepting:
 * - an existing artist (by @username or account email) gets a pending invite + notification;
 * - anyone else (by email) gets a Supabase sign-up invitation, and the pending invite attaches to
 *   their profile when they first sign in (`attachEmailInvites`).
 */
export async function inviteMember(
  actorId: string,
  projectId: string,
  input: { target: string; role: string },
): Promise<{ status: 'invited' | 'emailed' }> {
  const { target, role } = parse(inviteMemberSchema, input);
  const { project } = await authorizeProject(projectId, actorId, 'manage');
  await rateLimit(`invite:${actorId}`, 30, 3600);

  const isEmail = target.includes('@');
  const invitee = await db().profile.findUnique({
    where: isEmail ? { email: target } : { username: target },
  });
  if (!invitee && !isEmail) throw notFound('No artist with that username');
  if (invitee?.id === project.ownerId) throw new AppError(400, 'The owner is already on the project');
  if (invitee) {
    const member = await db().projectMember.findUnique({
      where: { projectId_profileId: { projectId, profileId: invitee.id } },
    });
    if (member) throw new AppError(409, `@${invitee.username} is already a collaborator`);
  }

  // one open invite per person per project: re-inviting just updates its role
  const existing = await db().projectInvite.findFirst({
    where: { projectId, status: 'PENDING', ...(invitee ? { inviteeId: invitee.id } : { email: target }) },
  });
  const invite = existing
    ? await db().projectInvite.update({ where: { id: existing.id }, data: { role } })
    : await db().projectInvite.create({
        data: {
          projectId,
          inviterId: actorId,
          inviteeId: invitee?.id ?? null,
          email: invitee ? null : target,
          role,
        },
      });

  if (invitee) {
    if (!existing) {
      await notify(
        invitee.id,
        'project.invite',
        `You're invited to “${project.title}” as ${role.toLowerCase()}`,
        '/dashboard#invitations',
      );
    }
    await logActivity(projectId, actorId, `invited @${invitee.username} as ${role.toLowerCase()}`);
    return { status: 'invited' };
  }

  const { error } = await supabaseAdmin().auth.admin.inviteUserByEmail(target, {
    redirectTo: `${env.siteUrl()}/auth/confirm?next=/reset-password`,
  });
  // "already registered" means they signed up without a profile yet; the invite still waits for them
  if (error && !/already been registered|already registered|exists/i.test(error.message)) {
    if (!existing) await db().projectInvite.delete({ where: { id: invite.id } });
    throw new AppError(400, `Couldn't send the invitation email: ${error.message}`);
  }
  await logActivity(projectId, actorId, `invited ${target} by email as ${role.toLowerCase()}`);
  return { status: 'emailed' };
}

/** The invitee accepts or declines; only they can answer their own invite. */
export async function respondToInvite(actorId: string, inviteId: string, accept: boolean) {
  const invite = await db().projectInvite.findUnique({
    where: { id: inviteId },
    include: { project: { select: { id: true, title: true } }, invitee: { select: { username: true } } },
  });
  if (!invite || invite.inviteeId !== actorId) throw notFound('Invitation not found');
  if (invite.status !== 'PENDING') throw new AppError(409, 'This invitation was already answered');

  await db().$transaction([
    db().projectInvite.update({
      where: { id: inviteId },
      data: { status: accept ? 'ACCEPTED' : 'DECLINED', respondedAt: new Date() },
    }),
    ...(accept
      ? [
          db().projectMember.upsert({
            where: { projectId_profileId: { projectId: invite.projectId, profileId: actorId } },
            update: { role: invite.role },
            create: { projectId: invite.projectId, profileId: actorId, role: invite.role },
          }),
        ]
      : []),
  ]);
  const who = `@${invite.invitee?.username ?? 'someone'}`;
  await notify(
    invite.inviterId,
    accept ? 'project.invite.accepted' : 'project.invite.declined',
    `${who} ${accept ? 'accepted' : 'declined'} your invitation to “${invite.project.title}”`,
    `/projects/${invite.projectId}`,
  );
  if (accept) await logActivity(invite.projectId, actorId, `joined as ${invite.role.toLowerCase()}`);
  return { projectId: invite.projectId, accepted: accept };
}

/** Owners withdraw an invite that hasn't been answered. */
export async function revokeInvite(actorId: string, inviteId: string) {
  const invite = await db().projectInvite.findUnique({ where: { id: inviteId } });
  if (!invite) throw notFound('Invitation not found');
  await authorizeProject(invite.projectId, actorId, 'manage');
  if (invite.status !== 'PENDING') throw new AppError(409, 'This invitation was already answered');
  await db().projectInvite.update({
    where: { id: inviteId },
    data: { status: 'REVOKED', respondedAt: new Date() },
  });
}

/** Pending invitations addressed to the actor (dashboard). */
export async function myInvites(actorId: string) {
  const rows = await db().projectInvite.findMany({
    where: { inviteeId: actorId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, title: true, artworkPath: true } },
      inviter: { select: { username: true, displayName: true, avatarPath: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    createdAt: r.createdAt,
    project: { ...r.project, artworkUrl: publicUrl(r.project.artworkPath) },
    inviter: { ...r.inviter, avatarUrl: publicUrl(r.inviter.avatarPath) },
  }));
}

/** Pending invitations on a project (owner view). Emails are only shown to the project owner. */
export async function projectInvites(actorId: string, projectId: string) {
  await authorizeProject(projectId, actorId, 'manage');
  const rows = await db().projectInvite.findMany({
    where: { projectId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { invitee: { select: { username: true, displayName: true } } },
  });
  return rows.map((r) => ({ id: r.id, role: r.role, email: r.email, invitee: r.invitee }));
}

/** Called on first sign-in: email invitations become this profile's pending invites. */
export async function attachEmailInvites(profileId: string, email: string) {
  await db().projectInvite.updateMany({
    where: { email: email.toLowerCase(), inviteeId: null, status: 'PENDING' },
    data: { inviteeId: profileId },
  });
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
  if (profileId !== actorId) {
    await authorizeProject(projectId, actorId, 'manage');
  } else {
    const { role } = await authorizeProject(projectId, actorId, 'view');
    if (role === 'OWNER') throw forbidden('The owner cannot leave their own project');
  }
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
