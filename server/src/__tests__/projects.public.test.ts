import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma'; // <-- if your prisma import differs, copy the same one used in auth.service.ts

const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === '1' && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? it : it.skip;

describe('GET /api/projects/public', () => {
  let ownerId: string;

  beforeAll(async () => {
    if (!RUN_DB_TESTS) return;

    // Clean in FK-safe order
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // Create a real user to satisfy FK ownerId
    const user = await prisma.user.create({
      data: {
        email: 'projects_public_test@example.com',
        passwordHash: 'test-hash',
        displayName: 'Projects Public Test',
      },
      select: { id: true },
    });

    ownerId = user.id;
  });

  afterAll(async () => {
    if (!RUN_DB_TESTS) return;

    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  dbTest('returns only PUBLIC projects', async () => {
    await prisma.project.createMany({
      data: [
        {
          title: 'Public A',
          description: 'Visible',
          visibility: 'PUBLIC',
          ownerId,
        },
        {
          title: 'Public B',
          description: 'Visible too',
          visibility: 'PUBLIC',
          ownerId,
        },
        {
          title: 'Private C',
          description: 'Hidden',
          visibility: 'PRIVATE',
          ownerId,
        },
      ],
    });

    const res = await request(app).get('/api/projects/public');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const titles = res.body.data.map((p: any) => p.title);

    expect(titles).toEqual(expect.arrayContaining(['Public A', 'Public B']));
    expect(titles).not.toEqual(expect.arrayContaining(['Private C']));
  });

  dbTest('supports pagination via page + limit', async () => {
    const res = await request(app).get('/api/projects/public?page=1&limit=1');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  dbTest('supports q search over title/description', async () => {
    const res = await request(app).get('/api/projects/public?q=visible');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    const allMatch = res.body.data.every((p: any) => {
      const title = (p.title ?? '').toLowerCase();
      const desc = (p.description ?? '').toLowerCase();
      return title.includes('visible') || desc.includes('visible');
    });

    expect(allMatch).toBe(true);
  });

  dbTest('rejects invalid query params (400)', async () => {
    const res = await request(app).get('/api/projects/public?page=0&limit=9999');
    expect(res.status).toBe(400);
  });
});
