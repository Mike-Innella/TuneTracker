import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { signSessionToken, SESSION_COOKIE_NAME } from '../auth/session';

const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

const OWNER_EMAIL = 'tracks.patch.owner@tunetracker.dev';
const OTHER_EMAIL = 'tracks.patch.other@tunetracker.dev';

let ownerId = '';
let otherId = '';
let ownerSessionToken = '';
let otherSessionToken = '';

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.project.deleteMany({
    where: { owner: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } },
  });

  const [owner, other] = await Promise.all([
    prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        passwordHash: 'fakehash',
        displayName: 'Tracks Patch Owner',
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: {
        email: OTHER_EMAIL,
        passwordHash: 'fakehash',
        displayName: 'Tracks Patch Other',
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

  await prisma.project.deleteMany({
    where: { ownerId: { in: [ownerId, otherId] } },
  });
});

afterAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.project.deleteMany({
    where: { ownerId: { in: [ownerId, otherId] } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [OWNER_EMAIL, OTHER_EMAIL] } },
  });
  await prisma.$disconnect();
});

describe('PATCH /api/projects/:projectId/tracks/:trackId', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .patch('/api/projects/anything/tracks/anything')
      .send({ status: 'MASTER' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('DELETE returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/api/projects/anything/tracks/anything');

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('Unauthorized');
  });

  dbTest('owner can update a track status', async () => {
    const project = await prisma.project.create({
      data: {
        title: 'Track Patch Project',
        visibility: 'PRIVATE',
        ownerId,
      },
      select: { id: true },
    });

    const track = await prisma.track.create({
      data: {
        projectId: project.id,
        title: 'Track A',
        status: 'IDEA',
      },
      select: { id: true },
    });

    const res = await request(app)
      .patch(`/api/projects/${project.id}/tracks/${track.id}`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({ status: 'MASTER' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(track.id);
    expect(res.body.status).toBe('MASTER');

    const updated = await prisma.track.findUnique({
      where: { id: track.id },
      select: { status: true },
    });

    expect(updated?.status).toBe('MASTER');
  });

  dbTest('owner can update and clear a track description', async () => {
    const project = await prisma.project.create({
      data: {
        title: 'Track Description Project',
        visibility: 'PRIVATE',
        ownerId,
      },
      select: { id: true },
    });

    const track = await prisma.track.create({
      data: {
        projectId: project.id,
        title: 'Track With Notes',
        description: 'Old description',
      },
      select: { id: true },
    });

    const updateRes = await request(app)
      .patch(`/api/projects/${project.id}/tracks/${track.id}`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({ description: '  New detail text for this track.  ' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.description).toBe('New detail text for this track.');

    const clearRes = await request(app)
      .patch(`/api/projects/${project.id}/tracks/${track.id}`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({ description: null });

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.description).toBeNull();

    const updated = await prisma.track.findUnique({
      where: { id: track.id },
      select: { description: true },
    });

    expect(updated?.description).toBeNull();
  });

  dbTest('non-owner cannot update track status', async () => {
    const project = await prisma.project.create({
      data: {
        title: 'Public Project',
        visibility: 'PUBLIC',
        ownerId,
      },
      select: { id: true },
    });

    const track = await prisma.track.create({
      data: {
        projectId: project.id,
        title: 'Track B',
        status: 'DRAFT',
      },
      select: { id: true },
    });

    const res = await request(app)
      .patch(`/api/projects/${project.id}/tracks/${track.id}`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${otherSessionToken}`])
      .send({ status: 'MASTER' });

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
  });

  dbTest('returns 404 when track does not exist in project', async () => {
    const project = await prisma.project.create({
      data: {
        title: 'Track Missing Project',
        visibility: 'PRIVATE',
        ownerId,
      },
      select: { id: true },
    });

    const res = await request(app)
      .patch(`/api/projects/${project.id}/tracks/not-a-real-id`)
      .set('Cookie', [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({ status: 'MIX' });

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
