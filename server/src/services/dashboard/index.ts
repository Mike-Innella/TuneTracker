import { db } from '@tunetracker/data';
import { getFeed } from '../community';
import { listNotifications } from '../notifications';
import { listProjects } from '../projects';
import { upcomingTasks } from '../tasks';

/** Everything on the dashboard comes from real rows — no placeholder numbers. */
export async function getDashboard(actorId: string) {
  const [projects, upcoming, activity, community, notifications, collaborators, postCount] =
    await Promise.all([
      listProjects(actorId),
      upcomingTasks(actorId),
      db().activity.findMany({
        where: {
          project: { OR: [{ ownerId: actorId }, { members: { some: { profileId: actorId } } }] },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          actor: { select: { displayName: true, username: true } },
          project: { select: { id: true, title: true } },
        },
      }),
      getFeed(actorId, { limit: 3 }),
      listNotifications(actorId, 6),
      db().projectMember.findMany({
        where: { project: { ownerId: actorId } },
        distinct: ['profileId'],
        select: { profileId: true },
      }),
      db().post.count({ where: { authorId: actorId } }),
    ]);
  const active = projects.filter((p) => p.status === 'ACTIVE');
  return {
    stats: {
      activeProjects: active.length,
      tasksDue: upcoming.length,
      collaborators: collaborators.length,
      publishedPosts: postCount,
    },
    recentProjects: projects.slice(0, 4),
    upcoming,
    activity,
    community: community.posts,
    notifications,
  };
}
