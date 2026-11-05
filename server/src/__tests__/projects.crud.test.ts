import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { signSessionToken, SESSION_COOKIE_NAME } from "../auth/session";

const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

const OWNER_EMAIL = "projects.crud.owner@tunetracker.dev";
const OTHER_EMAIL = "projects.crud.other@tunetracker.dev";

let ownerId = "";
let otherId = "";
let ownerSessionToken = "";
let otherSessionToken = "";

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;

  // Clean slate for these two users (FK-safe order)
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
        passwordHash: "fakehash",
        displayName: "Projects CRUD Owner",
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: {
        email: OTHER_EMAIL,
        passwordHash: "fakehash",
        displayName: "Projects CRUD Other",
      },
      select: { id: true },
    }),
  ]);

  ownerId = owner.id;
  otherId = other.id;

  ownerSessionToken = signSessionToken(ownerId);
  otherSessionToken = signSessionToken(otherId);
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

describe("Projects CRUD", () => {
  describe("GET /api/projects", () => {
    test("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/api/projects");

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    dbTest("returns only the authenticated user's projects", async () => {
      await prisma.project.createMany({
        data: [
          {
            title: "Owner Project A",
            description: "Owner",
            visibility: "PRIVATE",
            ownerId,
          },
          {
            title: "Owner Project B",
            description: "Owner",
            visibility: "PUBLIC",
            ownerId,
          },
          {
            title: "Other Project C",
            description: "Other",
            visibility: "PUBLIC",
            ownerId: otherId,
          },
        ],
      });

      const res = await request(app)
        .get("/api/projects")
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const titles = res.body.map((p: any) => p.title);
      expect(titles).toEqual(expect.arrayContaining(["Owner Project A", "Owner Project B"]));
      expect(titles).not.toEqual(expect.arrayContaining(["Other Project C"]));
    });
  });

  describe("GET /api/projects/:projectId", () => {
    dbTest("owner can read their PRIVATE project", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Private Read",
          description: "Secret",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(project.id);
      expect(res.body.title).toBe("Private Read");
      expect(res.body.visibility).toBe("PRIVATE");
      expect(res.body.ownerId).toBe(ownerId);
    });

    dbTest("non-owner can read a PUBLIC project", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Public Read",
          description: "Visible",
          visibility: "PUBLIC",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${otherSessionToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(project.id);
      expect(res.body.visibility).toBe("PUBLIC");
    });

    dbTest("non-owner cannot read a PRIVATE project (403)", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Private Hidden",
          description: "Nope",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${otherSessionToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    dbTest("returns 404 for missing project", async () => {
      const res = await request(app)
        .get("/api/projects/not-a-real-id")
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  describe("PATCH /api/projects/:projectId", () => {
    test("returns 401 when not authenticated", async () => {
      const res = await request(app).patch("/api/projects/anything").send({ title: "X" });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    dbTest("returns 400 when body has no updatable fields", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Patch Target",
          description: "Before",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Validation failed");
    });

    dbTest("owner can update project fields", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Before Title",
          description: "Before Desc",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
        .send({
          title: "After Title",
          visibility: "PUBLIC",
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(project.id);
      expect(res.body.title).toBe("After Title");
      expect(res.body.visibility).toBe("PUBLIC");

      const updated = await prisma.project.findUnique({
        where: { id: project.id },
        select: { title: true, visibility: true },
      });

      expect(updated?.title).toBe("After Title");
      expect(updated?.visibility).toBe("PUBLIC");
    });

    dbTest("non-owner cannot update (403)", async () => {
      const project = await prisma.project.create({
        data: {
          title: "No Touch",
          description: "Nope",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${otherSessionToken}`])
        .send({ title: "Hacked" });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    dbTest("returns 404 for missing project", async () => {
      const res = await request(app)
        .patch("/api/projects/not-a-real-id")
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`])
        .send({ title: "X" });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  describe("DELETE /api/projects/:projectId", () => {
    test("returns 401 when not authenticated", async () => {
      const res = await request(app).delete("/api/projects/anything");

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    dbTest("owner can delete project", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Delete Me",
          description: "Soon gone",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const exists = await prisma.project.findUnique({
        where: { id: project.id },
        select: { id: true },
      });

      expect(exists).toBeNull();
    });

    dbTest("non-owner cannot delete (403)", async () => {
      const project = await prisma.project.create({
        data: {
          title: "Protected",
          description: "Nope",
          visibility: "PRIVATE",
          ownerId,
        },
        select: { id: true },
      });

      const res = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${otherSessionToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
    });

    dbTest("returns 404 for missing project", async () => {
      const res = await request(app)
        .delete("/api/projects/not-a-real-id")
        .set("Cookie", [`${SESSION_COOKIE_NAME}=${ownerSessionToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });
});
