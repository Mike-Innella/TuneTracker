import { prisma } from '../lib/prisma';
import type { CreatePostBody, CreatePostCommentBody } from '../validators/post.schema';

function unauthorizedError() {
  return Object.assign(new Error('Unauthorized'), { statusCode: 401 });
}

function notFoundError() {
  return Object.assign(new Error('Post not found'), { statusCode: 404 });
}

function badRequestError(message: string) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function forbiddenError() {
  return Object.assign(new Error('Forbidden'), { statusCode: 403 });
}

function commentNotFoundError() {
  return Object.assign(new Error('Comment not found'), { statusCode: 404 });
}

const feedInclude = {
  author: {
    select: {
      id: true,
      displayName: true,
      email: true,
      profileImageData: true,
    },
  },
  project: {
    select: {
      id: true,
      title: true,
    },
  },
  _count: {
    select: {
      comments: true,
      likes: true,
    },
  },
} as const;

export const postService = {
  async getFeed() {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: feedInclude,
    });

    return posts.map((post) => ({
      ...post,
      feedType: 'POST' as const,
    }));
  },

  async getPostById(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: feedInclude,
    });

    if (!post) throw notFoundError();

    return post;
  },

  async createPost(authorId: string | undefined, body: CreatePostBody) {
    if (!authorId) throw unauthorizedError();

    if (body.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: body.projectId },
        select: { id: true, ownerId: true },
      });

      if (!project) throw badRequestError('Project not found');
      if (project.ownerId !== authorId) {
        throw badRequestError('Invalid project selection');
      }
    }

    return prisma.post.create({
      data: {
        authorId,
        content: body.content,
        ...(body.projectId ? { projectId: body.projectId } : {}),
      },
      include: feedInclude,
    });
  },

  async getPostComments(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) throw notFoundError();

    return prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageData: true,
          },
        },
      },
    });
  },

  async createPostComment(
    postId: string,
    authorId: string | undefined,
    body: CreatePostCommentBody
  ) {
    if (!authorId) throw unauthorizedError();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) throw notFoundError();

    return prisma.postComment.create({
      data: {
        postId,
        authorId,
        content: body.content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageData: true,
          },
        },
      },
    });
  },

  async likePost(postId: string, userId: string | undefined) {
    if (!userId) throw unauthorizedError();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw notFoundError();

    await prisma.postLike.upsert({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
      update: {},
      create: {
        postId,
        userId,
      },
    });

    const likesCount = await prisma.postLike.count({ where: { postId } });
    return { liked: true, likesCount };
  },

  async unlikePost(postId: string, userId: string | undefined) {
    if (!userId) throw unauthorizedError();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw notFoundError();

    await prisma.postLike.deleteMany({
      where: {
        postId,
        userId,
      },
    });

    const likesCount = await prisma.postLike.count({ where: { postId } });
    return { liked: false, likesCount };
  },

  async deletePost(postId: string, userId: string | undefined) {
    if (!userId) throw unauthorizedError();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) throw notFoundError();
    if (post.authorId !== userId) throw forbiddenError();

    await prisma.post.delete({
      where: { id: post.id },
    });

    return { success: true };
  },

  async deletePostComment(
    postId: string,
    commentId: string,
    userId: string | undefined
  ) {
    if (!userId) throw unauthorizedError();

    const comment = await prisma.postComment.findFirst({
      where: { id: commentId, postId },
      select: { id: true, authorId: true },
    });
    if (!comment) throw commentNotFoundError();
    if (comment.authorId !== userId) throw forbiddenError();

    await prisma.postComment.delete({
      where: { id: comment.id },
    });

    return { success: true };
  },
};
