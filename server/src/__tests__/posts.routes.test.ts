import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { signSessionToken, SESSION_COOKIE_NAME } from '../auth/session';

const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

const OWNER_EMAIL = 'posts.routes.owner@tunetracker.dev';
const OTHER_EMAIL = 'posts.routes.other@tunetracker.dev';

let ownerId = '';
let otherId = '';
let ownerSessionToken = '';
let otherSessionToken = '';

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.post.deleteMany({
    where: {
      author: {
        email: {
          in: [OWNER_EMAIL, OTHER_EMAIL],
        },
      },
    },
  });
  await prisma.project.deleteMany({
    where: {
      owner: {
        email: {
          in: [OWNER_EMAIL, OTHER_EMAIL],
        },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [OWNER_EMAIL, OTHER_EMAIL],
      },
    },
  });

  const [owner, other] = await Promise.all([
    prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        passwordHash: 'fakehash',
        displayName: 'Posts Test Owner',
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: {
        email: OTHER_EMAIL,
        passwordHash: 'fakehash',
        displayName: 'Posts Test Other',
      },
      select: { id: true },
    }),
  ]);

  ownerId = owner.id;
  otherId = other.id;
  ownerSessionToken = signSessionToken(owner.id);
  otherSessionToken = signSessionToken(other.id);
});

beforeEach(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.post.deleteMany({
    where: {
      authorId: {
        in: [ownerId, otherId],
      },
    },
  });
  await prisma.project.deleteMany({
    where: {
      ownerId: {
        in: [ownerId, otherId],
      },
    },
  });
});

afterAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.post.deleteMany({
    where: {
      authorId: {
        in: [ownerId, otherId],
      },
    },
  });
  await prisma.project.deleteMany({
    where: {
      ownerId: {
        in: [ownerId, otherId],
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [OWNER_EMAIL, OTHER_EMAIL],
      },
    },
  });
  await prisma.$disconnect();
});

describe('Post routes', () => {
  test('POST /api/posts returns 401 without session cookie', async () => {
    const res = await request(app).post('/api/posts').send({ content: 'hello' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('POST /api/posts/:postId/like returns 401 without session cookie', async () => {
    const res = await request(app).post('/api/posts/post-id/like');

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Unauthorized');
  });

  dbTest('creates a post and returns it in feed listing', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({ content: 'First test post' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.content).toBe('First test post');
    expect(createRes.body.data.authorId).toBe(ownerId);

    const feedRes = await request(app).get('/api/posts');
    expect(feedRes.status).toBe(200);

    const posts = feedRes.body as Array<{
      id: string;
      content: string;
      feedType: string;
    }>;

    expect(posts.some((post) => post.content === 'First test post')).toBe(true);
    expect(posts.every((post) => post.feedType === 'POST')).toBe(true);
  });

  dbTest('rejects project assignment when project belongs to another user', async () => {
    const otherUsersProject = await prisma.project.create({
      data: {
        ownerId: otherId,
        title: 'Other User Project',
        visibility: 'PRIVATE',
      },
      select: { id: true },
    });

    const res = await request(app)
      .post('/api/posts')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({
        content: 'Trying to attach foreign project',
        projectId: otherUsersProject.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Invalid project selection');
  });

  dbTest('creates and fetches comments on a post', async () => {
    const createdPost = await prisma.post.create({
      data: {
        authorId: ownerId,
        content: 'Post for comments',
      },
      select: { id: true },
    });

    const createCommentRes = await request(app)
      .post(`/api/posts/${createdPost.id}/comments`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${otherSessionToken}`])
      .send({ content: 'Great work' });

    expect(createCommentRes.status).toBe(201);
    expect(createCommentRes.body.data.content).toBe('Great work');
    expect(createCommentRes.body.data.author.id).toBe(otherId);

    const listCommentsRes = await request(app).get(
      `/api/posts/${createdPost.id}/comments`
    );

    expect(listCommentsRes.status).toBe(200);
    expect(Array.isArray(listCommentsRes.body)).toBe(true);
    expect(
      (listCommentsRes.body as Array<{ content: string }>).some(
        (comment) => comment.content === 'Great work'
      )
    ).toBe(true);
  });
});
