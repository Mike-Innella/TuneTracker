import { db, type Prisma } from '@tunetracker/data';
import {
  commentSchema,
  pageSchema,
  postSchema,
  reactionType,
  reportSchema,
  type PostInput,
} from '@tunetracker/shared';
import { authorizeProject } from '../../authorization/projects';
import { AppError, forbidden, notFound, parse } from '../../lib/errors';
import { rateLimit } from '../../lib/rate-limit';
import { publicUrl, signedReadUrls } from '../../storage';
import { notify } from '../notifications';

const authorSelect = { id: true, username: true, displayName: true, avatarPath: true } as const;

const postInclude = {
  author: { select: authorSelect },
  project: { select: { id: true, title: true, visibility: true } },
  audio: true,
  image: true,
  reactions: { select: { type: true, profileId: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

async function present(rows: PostRow[], viewerId: string | null) {
  const urls = await signedReadUrls(rows.flatMap((p) => (p.audio ? [p.audio.path] : [])));
  return rows.map((p) => {
    const counts: Record<string, number> = {};
    for (const r of p.reactions) counts[r.type] = (counts[r.type] ?? 0) + 1;
    return {
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      genre: p.genre,
      tags: p.tags,
      links: p.links,
      feedbackRequested: p.feedbackRequested,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: { ...p.author, avatarUrl: publicUrl(p.author.avatarPath) },
      // a linked private project shows nothing beyond the fact it exists
      project: p.project?.visibility === 'PUBLIC' ? { id: p.project.id, title: p.project.title } : null,
      audio: p.audio
        ? {
            id: p.audio.id,
            // published track for this audio, so the player counts listens
            trackId: p.trackId,
            title: p.audio.title,
            durationSec: p.audio.durationSec,
            mimeType: p.audio.mimeType,
            url: urls.get(p.audio.path) ?? null,
          }
        : null,
      imageUrl: p.image ? publicUrl(p.image.path) : null,
      reactionCounts: counts,
      myReactions: viewerId ? p.reactions.filter((r) => r.profileId === viewerId).map((r) => r.type) : [],
      commentCount: p._count.comments,
      isMine: viewerId === p.author.id,
      // raw references only for the author (edit form); never exposes a private project's title
      ownerRefs: viewerId === p.author.id ? { projectId: p.projectId, imageId: p.imageId } : null,
    };
  });
}
export type FeedPost = Awaited<ReturnType<typeof present>>[number];

/** Keyset pagination on (createdAt desc, id desc). */
export async function getFeed(
  viewerId: string | null,
  input: {
    cursor?: string | null;
    limit?: number;
    authorId?: string;
    projectId?: string;
    type?: string;
    /** only posts by artists this profile follows */
    followedBy?: string;
  } = {},
) {
  const { cursor, limit } = parse(pageSchema, input);
  const where: Prisma.PostWhereInput = {
    ...(input.authorId ? { authorId: input.authorId } : {}),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.type ? { type: input.type as PostRow['type'] } : {}),
    ...(input.followedBy ? { author: { followers: { some: { followerId: input.followedBy } } } } : {}),
  };
  const rows = await db().post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: postInclude,
  });
  const page = rows.slice(0, limit);
  return {
    posts: await present(page, viewerId),
    nextCursor: rows.length > limit ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export async function getPost(viewerId: string | null, postId: string) {
  const row = await db().post.findUnique({ where: { id: postId }, include: postInclude });
  if (!row) throw notFound('Post not found');
  const [post] = await present([row], viewerId);
  const comments = await db().postComment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: authorSelect } },
  });
  return {
    post: post!,
    comments: comments.map((c) => ({
      ...c,
      author: { ...c.author, avatarUrl: publicUrl(c.author.avatarPath) },
      isMine: c.authorId === viewerId,
    })),
  };
}

/** Media/project references must belong to the author; nothing private is attached implicitly. */
async function checkRefs(
  actorId: string,
  data: { audioId?: string | null; imageId?: string | null; projectId?: string | null },
) {
  if (data.audioId) {
    const a = await db().mediaAsset.findUnique({ where: { id: data.audioId } });
    if (!a || a.ownerId !== actorId || a.kind !== 'AUDIO' || !a.verifiedAt)
      throw new AppError(400, 'Audio upload not found');
  }
  if (data.imageId) {
    const i = await db().mediaAsset.findUnique({ where: { id: data.imageId } });
    if (!i || i.ownerId !== actorId || i.kind !== 'IMAGE' || !i.verifiedAt || i.bucket !== 'public-media') {
      throw new AppError(400, 'Image upload not found');
    }
  }
  if (data.projectId) await authorizeProject(data.projectId, actorId, 'edit');
}

export async function createPost(actorId: string, input: PostInput) {
  const data = parse(postSchema, input);
  await rateLimit(`post:${actorId}`, 20, 3600);
  await checkRefs(actorId, data);
  return db().post.create({ data: { ...data, authorId: actorId } });
}

export async function updatePost(actorId: string, postId: string, input: PostInput) {
  const data = parse(postSchema, input);
  const post = await db().post.findUnique({ where: { id: postId } });
  if (!post) throw notFound('Post not found');
  if (post.authorId !== actorId) throw forbidden('You can only edit your own posts');
  await checkRefs(actorId, data);
  return db().post.update({ where: { id: postId }, data });
}

export async function deletePost(actorId: string, postId: string) {
  const post = await db().post.findUnique({ where: { id: postId } });
  if (!post) throw notFound('Post not found');
  if (post.authorId !== actorId) throw forbidden('You can only delete your own posts');
  await db().post.delete({ where: { id: postId } });
}

export async function addComment(actorId: string, postId: string, body: string) {
  const data = parse(commentSchema, { body });
  await rateLimit(`comment:${actorId}`, 60, 600);
  const post = await db().post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } });
  if (!post) throw notFound('Post not found');
  const comment = await db().postComment.create({ data: { postId, authorId: actorId, body: data.body } });
  if (post.authorId !== actorId) {
    await notify(post.authorId, 'post.comment', `New feedback on “${post.title}”`, `/community/${postId}`);
  }
  return comment;
}

/** Comment author or the post's author may remove a comment. */
export async function deleteComment(actorId: string, commentId: string) {
  const c = await db().postComment.findUnique({
    where: { id: commentId },
    include: { post: { select: { authorId: true } } },
  });
  if (!c) throw notFound('Comment not found');
  if (c.authorId !== actorId && c.post.authorId !== actorId) throw forbidden();
  await db().postComment.delete({ where: { id: commentId } });
}

export async function toggleReaction(actorId: string, postId: string, type: string) {
  const t = parse(reactionType, type);
  const key = { postId_profileId_type: { postId, profileId: actorId, type: t } };
  const existing = await db().reaction.findUnique({ where: key });
  if (existing) {
    await db().reaction.delete({ where: key });
    return { active: false };
  }
  const post = await db().post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw notFound('Post not found');
  await db().reaction.create({ data: { postId, profileId: actorId, type: t } });
  return { active: true };
}

export async function report(
  actorId: string,
  input: { targetType: string; targetId: string; reason: string },
) {
  const data = parse(reportSchema, input);
  await rateLimit(`report:${actorId}`, 10, 3600);
  return db().report.upsert({
    where: {
      reporterId_targetType_targetId: {
        reporterId: actorId,
        targetType: data.targetType,
        targetId: data.targetId,
      },
    },
    update: { reason: data.reason },
    create: { ...data, reporterId: actorId },
  });
}
