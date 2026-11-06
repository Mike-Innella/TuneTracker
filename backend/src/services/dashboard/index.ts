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

/**
 * Creator activation: the first things that make a profile worth visiting. Each step is derived
 * from real data (nothing to store), so it completes itself however the creator gets there.
 */
export async function activation(profileId: string) {
  const [profile, tracks, published, playlists, projects, shares] = await Promise.all([
    db().profile.findUniqueOrThrow({ where: { id: profileId }, select: { bio: true, avatarPath: true } }),
    db().track.count({ where: { ownerId: profileId } }),
    db().track.count({ where: { ownerId: profileId, status: 'PUBLISHED' } }),
    db().playlist.count({ where: { ownerId: profileId } }),
    db().project.count({ where: { OR: [{ ownerId: profileId }, { members: { some: { profileId } } }] } }),
    Promise.all([
      db().post.count({ where: { authorId: profileId } }),
      db().article.count({ where: { authorId: profileId, status: 'PUBLISHED' } }),
    ]).then(([a, b]) => a + b),
  ]);
  const steps = [
    {
      key: 'profile',
      label: 'Add a photo or bio',
      href: '/profile',
      done: !!(profile.bio?.trim() || profile.avatarPath),
    },
    { key: 'upload', label: 'Upload a track or sample', href: '/studio/upload', done: tracks > 0 },
    { key: 'publish', label: 'Publish it', href: '/studio', done: published > 0 },
    { key: 'playlist', label: 'Make a playlist', href: '/studio#my-playlists', done: playlists > 0 },
    { key: 'project', label: 'Start a project', href: '/projects?new=1', done: projects > 0 },
    { key: 'share', label: 'Post to the community or the blog', href: '/community/new', done: shares > 0 },
  ];
  return { steps, completed: steps.filter((s) => s.done).length };
}
