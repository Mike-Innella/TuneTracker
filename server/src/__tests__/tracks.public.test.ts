import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { signSessionToken, SESSION_COOKIE_NAME } from '../auth/session';

const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

const OWNER_EMAIL = 'tracks.public.owner@tunetracker.dev';
const VIEWER_EMAIL = 'tracks.public.viewer@tunetracker.dev';

let ownerId = '';
let viewerId = '';
let viewerSessionToken = '';

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.project.deleteMany({
    where: {
      owner: {
        email: {
          in: [OWNER_EMAIL, VIEWER_EMAIL],
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [OWNER_EMAIL, VIEWER_EMAIL],
      },
    },
  });

  const [owner, viewer] = await Promise.all([
    prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        passwordHash: 'fakehash',
        displayName: 'Public Track Owner',
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: {
        email: VIEWER_EMAIL,
        passwordHash: 'fakehash',
        displayName: 'Public Track Viewer',
      },
      select: { id: true },
    }),
  ]);

  ownerId = owner.id;
  viewerId = viewer.id;
  viewerSessionToken = signSessionToken(viewer.id);
});

beforeEach(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.project.deleteMany({
    where: {
      ownerId: {
        in: [ownerId, viewerId],
      },
    },
  });
});

afterAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.project.deleteMany({
    where: {
      ownerId: {
        in: [ownerId, viewerId],
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [OWNER_EMAIL, VIEWER_EMAIL],
      },
    },
  });
  await prisma.$disconnect();
});

describe('Public track engagement routes', () => {
  test('POST /api/projects/public/:projectId/tracks/:trackId/comments returns 401 without session cookie', async () => {
    const res = await request(app)
      .post('/api/projects/public/project-id/tracks/track-id/comments')
      .send({ body: 'nice mix' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Unauthorized');
  });

  dbTest('supports like, rating, comment, and engagement reads for public tracks', async () => {
    const project = await prisma.project.create({
      data: {
        ownerId,
        title: 'Public Engagement Project',
        visibility: 'PUBLIC',
      },
      select: { id: true },
    });

    const track = await prisma.track.create({
      data: {
        projectId: project.id,
        title: 'Public Track',
        status: 'DRAFT',
      },
      select: { id: true },
    });

    const likeRes = await request(app)
      .post(`/api/projects/public/${project.id}/tracks/${track.id}/like`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${viewerSessionToken}`]);
    expect(likeRes.status).toBe(200);
    expect(likeRes.body.liked).toBe(true);
    expect(likeRes.body.likesCount).toBe(1);

    const ratingRes = await request(app)
      .post(`/api/projects/public/${project.id}/tracks/${track.id}/rating`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${viewerSessionToken}`])
      .send({ value: 4 });
    expect(ratingRes.status).toBe(200);
    expect(ratingRes.body.myRating).toBe(4);
    expect(ratingRes.body.ratingCount).toBe(1);

    const commentRes = await request(app)
      .post(`/api/projects/public/${project.id}/tracks/${track.id}/comments`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${viewerSessionToken}`])
      .send({ body: 'Solid low-end balance' });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.data.body).toBe('Solid low-end balance');
    expect(commentRes.body.data.author.id).toBe(viewerId);

    const engagementRes = await request(app).get(
      `/api/projects/public/${project.id}/tracks/${track.id}/engagement`
    );
    expect(engagementRes.status).toBe(200);
    expect(engagementRes.body.likesCount).toBe(1);
    expect(engagementRes.body.commentsCount).toBe(1);
    expect(engagementRes.body.ratingCount).toBe(1);
    expect(engagementRes.body.ratingAverage).toBe(4);

    const commentsRes = await request(app).get(
      `/api/projects/public/${project.id}/tracks/${track.id}/comments`
    );
    expect(commentsRes.status).toBe(200);
    expect(Array.isArray(commentsRes.body)).toBe(true);
    expect(
      (commentsRes.body as Array<{ body: string }>).some(
        (comment) => comment.body === 'Solid low-end balance'
      )
    ).toBe(true);
  });

  dbTest('returns 404 for private project tracks on public engagement endpoints', async () => {
    const privateProject = await prisma.project.create({
      data: {
        ownerId,
        title: 'Private Project',
        visibility: 'PRIVATE',
      },
      select: { id: true },
    });

    const privateTrack = await prisma.track.create({
      data: {
        projectId: privateProject.id,
        title: 'Private Track',
      },
      select: { id: true },
    });

    const res = await request(app).get(
      `/api/projects/public/${privateProject.id}/tracks/${privateTrack.id}/engagement`
    );

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Track not found');
  });
});
