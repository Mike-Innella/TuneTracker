import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { signSessionToken, SESSION_COOKIE_NAME } from "../auth/session";

const TEST_EMAIL = "me.test@tunetracker.dev";
const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

afterAll(async () => {
  if (RUN_DB_TESTS) {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  }
});

describe("Auth me", () => {
  test("GET /api/auth/me returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Unauthorized");
  });

  dbTest("GET /api/auth/me returns user when session cookie is valid", async () => {
    // ensure clean slate (prevents unique constraint failures)
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        displayName: "Me Test",
        passwordHash: "fakehash",
      },
      select: { id: true },
    });

    const token = signSessionToken(user.id);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`${SESSION_COOKIE_NAME}=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.displayName).toBe("Me Test");
  });
});
