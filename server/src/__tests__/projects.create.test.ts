import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { signSessionToken, SESSION_COOKIE_NAME } from "../auth/session";

const TEST_EMAIL = "projects.create.test@tunetracker.dev";
const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;
let ownerId = "";
let ownerSessionToken = "";

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      passwordHash: "fakehash",
      displayName: "Projects Create Test",
    },
    select: { id: true },
  });

  ownerId = user.id;
  ownerSessionToken = signSessionToken(user.id);
});

beforeEach(async () => {
  if (!RUN_DB_TESTS || !ownerId) return;
  await prisma.project.deleteMany({ where: { ownerId } });
});

afterAll(async () => {
  if (RUN_DB_TESTS) {
    if (ownerId) {
      await prisma.project.deleteMany({ where: { ownerId } });
    }
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  }
});

describe("POST /api/projects", () => {
  test("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/projects").send({
      title: "Unauthorized Create",
    });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Unauthorized");
  });

  dbTest("returns 400 for invalid body when authenticated", async () => {
    if (!ownerId) return;

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({
        title: "   ",
      });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Validation failed");
  });

  dbTest("creates a PRIVATE project by default", async () => {
    if (!ownerId) return;

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({
        title: "  New Project  ",
        description: "  Internal draft  ",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.id).toBe("string");
    expect(res.body.data.ownerId).toBe(ownerId);
    expect(res.body.data.title).toBe("New Project");
    expect(res.body.data.description).toBe("Internal draft");
    expect(res.body.data.visibility).toBe("PRIVATE");

    const created = await prisma.project.findUnique({
      where: { id: res.body.data.id },
    });

    expect(created).not.toBeNull();
    expect(created?.ownerId).toBe(ownerId);
    expect(created?.title).toBe("New Project");
    expect(created?.description).toBe("Internal draft");
    expect(created?.visibility).toBe("PRIVATE");
  });

  dbTest("creates a PUBLIC project when visibility is provided", async () => {
    if (!ownerId) return;

    const res = await request(app)
      .post("/api/projects")
      .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
      .send({
        title: "Launch Single",
        visibility: "PUBLIC",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.visibility).toBe("PUBLIC");
    expect(res.body.data.title).toBe("Launch Single");
    expect(res.body.data.ownerId).toBe(ownerId);

    const created = await prisma.project.findUnique({
      where: { id: res.body.data.id },
      select: { visibility: true, title: true, ownerId: true },
    });

    expect(created).not.toBeNull();
    expect(created?.visibility).toBe("PUBLIC");
    expect(created?.title).toBe("Launch Single");
    expect(created?.ownerId).toBe(ownerId);
  });
});
