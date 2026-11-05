import { prisma } from '../lib/prisma';
import type {
  CreateTrackCommentBody,
  UpsertTrackRatingBody,
} from '../validators/track.schema';

function unauthorizedError() {
  return Object.assign(new Error('Unauthorized'), { statusCode: 401 });
}

function trackNotFoundError() {
  return Object.assign(new Error('Track not found'), { statusCode: 404 });
}

async function getPublicTrack(projectId: string, trackId: string) {
  const track = await prisma.track.findFirst({
    where: {
      id: trackId,
      projectId,
      project: {
        visibility: 'PUBLIC',
      },
    },
    select: {
      id: true,
      projectId: true,
    },
  });

  if (!track) throw trackNotFoundError();
  return track;
}

export const trackPublicService = {
  async getEngagement(projectId: string, trackId: string, viewerUserId?: string) {
    await getPublicTrack(projectId, trackId);

    const [likesCount, commentsCount, ratingsAgg, myLike, myRating] = await Promise.all([
      prisma.trackLike.count({ where: { trackId } }),
      prisma.comment.count({ where: { trackId } }),
      prisma.trackRating.aggregate({
        where: { trackId },
        _avg: { value: true },
        _count: { value: true },
      }),
      viewerUserId
        ? prisma.trackLike.findUnique({
            where: {
              trackId_userId: { trackId, userId: viewerUserId },
            },
            select: { id: true },
          })
        : null,
      viewerUserId
        ? prisma.trackRating.findUnique({
            where: {
              trackId_userId: { trackId, userId: viewerUserId },
            },
            select: { value: true },
          })
        : null,
    ]);

    return {
      likesCount,
      commentsCount,
      ratingAverage: ratingsAgg._avg.value !== null ? Number(ratingsAgg._avg.value) : null,
      ratingCount: ratingsAgg._count.value,
      likedByMe: Boolean(myLike),
      myRating: myRating?.value ?? null,
    };
  },

  async getComments(projectId: string, trackId: string) {
    await getPublicTrack(projectId, trackId);

    const comments = await prisma.comment.findMany({
      where: { trackId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageData: true,
          },
        },
      },
    });

    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.user,
    }));
  },

  async createComment(
    projectId: string,
    trackId: string,
    userId: string | undefined,
    body: CreateTrackCommentBody
  ) {
    if (!userId) throw unauthorizedError();

    await getPublicTrack(projectId, trackId);

    const created = await prisma.comment.create({
      data: {
        trackId,
        userId,
        body: body.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profileImageData: true,
          },
        },
      },
    });

    return {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt,
      author: created.user,
    };
  },

  async like(projectId: string, trackId: string, userId: string | undefined) {
    if (!userId) throw unauthorizedError();

    await getPublicTrack(projectId, trackId);

    await prisma.trackLike.upsert({
      where: {
        trackId_userId: {
          trackId,
          userId,
        },
      },
      update: {},
      create: {
        trackId,
        userId,
      },
    });

    const likesCount = await prisma.trackLike.count({ where: { trackId } });
    return { liked: true, likesCount };
  },

  async unlike(projectId: string, trackId: string, userId: string | undefined) {
    if (!userId) throw unauthorizedError();

    await getPublicTrack(projectId, trackId);

    await prisma.trackLike.deleteMany({
      where: {
        trackId,
        userId,
      },
    });

    const likesCount = await prisma.trackLike.count({ where: { trackId } });
    return { liked: false, likesCount };
  },

  async rate(
    projectId: string,
    trackId: string,
    userId: string | undefined,
    body: UpsertTrackRatingBody
  ) {
    if (!userId) throw unauthorizedError();

    await getPublicTrack(projectId, trackId);

    await prisma.trackRating.upsert({
      where: {
        trackId_userId: {
          trackId,
          userId,
        },
      },
      update: {
        value: body.value,
      },
      create: {
        trackId,
        userId,
        value: body.value,
      },
    });

    const ratingsAgg = await prisma.trackRating.aggregate({
      where: { trackId },
      _avg: { value: true },
      _count: { value: true },
    });

    return {
      myRating: body.value,
      ratingAverage: ratingsAgg._avg.value !== null ? Number(ratingsAgg._avg.value) : null,
      ratingCount: ratingsAgg._count.value,
    };
  },
};
