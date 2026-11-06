import { db, type Profile } from '@tunetracker/data';
import { resolveReportSchema } from '@tunetracker/shared';
import { supabaseAdmin } from '../../auth/supabase';
import { AppError, notFound, parse } from '../../lib/errors';
import { notify } from '../notifications';

export const isModerator = (p: Pick<Profile, 'role'>) => p.role === 'MODERATOR' || p.role === 'ADMIN';

/** Moderation is invisible to everyone else: non-moderators get a 404, not a 403. */
async function requireModerator(actorId: string) {
  const p = await db().profile.findUnique({ where: { id: actorId }, select: { role: true } });
  if (!p || !isModerator(p)) throw notFound('Not found');
}

type Target = { type: 'POST' | 'COMMENT' | 'PROFILE' | 'ARTICLE'; id: string };

/** What a moderator needs to judge a report, plus the owner to act on. */
async function describe(t: Target) {
  if (t.type === 'POST') {
    const p = await db().post.findUnique({
      where: { id: t.id },
      select: { title: true, body: true, author: { select: { id: true, username: true } } },
    });
    return p
      ? {
          exists: true,
          ownerId: p.author.id,
          owner: p.author.username,
          preview: `${p.title} — ${p.body.slice(0, 240)}`,
          href: `/community/${t.id}`,
        }
      : null;
  }
  if (t.type === 'COMMENT') {
    const c = await db().postComment.findUnique({
      where: { id: t.id },
      select: { body: true, postId: true, author: { select: { id: true, username: true } } },
    });
    return c
      ? {
          exists: true,
          ownerId: c.author.id,
          owner: c.author.username,
          preview: c.body.slice(0, 240),
          href: `/community/${c.postId}`,
        }
      : null;
  }
  if (t.type === 'ARTICLE') {
    const a = await db().article.findUnique({
      where: { id: t.id },
      select: { title: true, bodyText: true, slug: true, author: { select: { id: true, username: true } } },
    });
    return a
      ? {
          exists: true,
          ownerId: a.author.id,
          owner: a.author.username,
          preview: `${a.title} — ${a.bodyText.slice(0, 240)}`,
          href: `/blog/${a.slug}`,
        }
      : null;
  }
  const u = await db().profile.findUnique({
    where: { id: t.id },
    select: { id: true, username: true, bio: true },
  });
  return u
    ? {
        exists: true,
        ownerId: u.id,
        owner: u.username,
        preview: u.bio?.slice(0, 240) ?? '(no bio)',
        href: `/artists/${u.username}`,
      }
    : null;
}

export async function listReports(actorId: string, status: 'open' | 'resolved' = 'open') {
  await requireModerator(actorId);
  const reports = await db().report.findMany({
    where: { resolvedAt: status === 'open' ? null : { not: null } },
    orderBy: { createdAt: status === 'open' ? 'asc' : 'desc' },
    take: 100,
    include: { reporter: { select: { username: true } } },
  });
  return Promise.all(
    reports.map(async (r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      outcome: r.outcome,
      reporter: r.reporter.username,
      target: await describe({ type: r.targetType, id: r.targetId }),
    })),
  );
}

/**
 * Resolve a report. Every report on the same target closes with it, the decision is recorded,
 * and the owner is told when their content or account was affected.
 */
export async function resolveReport(
  actorId: string,
  input: { reportId: string; outcome: string; note?: string | null },
) {
  await requireModerator(actorId);
  const { reportId, outcome, note } = parse(resolveReportSchema, input);
  const report = await db().report.findUnique({ where: { id: reportId } });
  if (!report) throw notFound('Report not found');
  if (report.resolvedAt) throw new AppError(409, 'This report is already resolved');
  const target = { type: report.targetType, id: report.targetId } as Target;
  const info = await describe(target);

  if (outcome === 'CONTENT_REMOVED') {
    if (target.type === 'PROFILE') throw new AppError(400, 'Profiles are suspended, not removed');
    if (info) {
      if (target.type === 'POST') await db().post.delete({ where: { id: target.id } });
      else if (target.type === 'ARTICLE') await db().article.delete({ where: { id: target.id } });
      else await db().postComment.delete({ where: { id: target.id } });
      await notify(
        info.ownerId,
        'moderation.removed',
        `A moderator removed your ${{ POST: 'post', ARTICLE: 'article', COMMENT: 'comment' }[target.type]} for breaking the community rules.`,
      );
    }
  }
  if (outcome === 'USER_SUSPENDED' && info) {
    if (info.ownerId === actorId) throw new AppError(400, "You can't suspend yourself");
    await db().profile.update({ where: { id: info.ownerId }, data: { suspendedAt: new Date() } });
    // Auth-level ban too, so existing sessions can't be refreshed
    const { error } = await supabaseAdmin().auth.admin.updateUserById(info.ownerId, {
      ban_duration: '876000h',
    });
    if (error) throw new AppError(400, `Suspended in the app, but the login ban failed: ${error.message}`);
  }

  const resolvedAt = new Date();
  await db().$transaction([
    db().report.updateMany({
      where: { targetType: report.targetType, targetId: report.targetId, resolvedAt: null },
      data: { resolvedAt, outcome },
    }),
    db().moderationAction.create({
      data: {
        moderatorId: actorId,
        reportId,
        outcome,
        targetType: report.targetType,
        targetId: report.targetId,
        note,
      },
    }),
  ]);
  return { outcome };
}

/** Lift a suspension (moderators only). */
export async function unsuspend(actorId: string, username: string) {
  await requireModerator(actorId);
  const p = await db().profile.findUnique({ where: { username } });
  if (!p) throw notFound('Artist not found');
  await db().profile.update({ where: { id: p.id }, data: { suspendedAt: null } });
  const { error } = await supabaseAdmin().auth.admin.updateUserById(p.id, { ban_duration: 'none' });
  if (error) throw new AppError(400, error.message);
}
