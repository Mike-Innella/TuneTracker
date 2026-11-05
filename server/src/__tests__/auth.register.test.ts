import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

const TEST_EMAIL = "register.test@tunetracker.dev";
const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

afterAll(async () => {
  // Cleanup + prevent open-handle hangs
  if (RUN_DB_TESTS) {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  }
});

describe("Auth register", () => {
  dbTest("POST /api/auth/register creates a user and returns sanitized payload", async () => {
    // Ensure clean slate in case the test was re-run
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: "Password123!",
      displayName: "Register Test",
    });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);

    // Should return user object, but never passwordHash
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL.toLowerCase());
    expect(res.body.user.displayName).toBe("Register Test");
    expect(res.body.user.passwordHash).toBeUndefined();

    // Prisma user id is a string cuid()
    expect(typeof res.body.user.id).toBe("string");
    expect(res.body.user.id.length).toBeGreaterThan(10);
  });

  dbTest("POST /api/auth/register returns 409 when email already exists", async () => {
    // Ensure user exists
    await prisma.user.upsert({
      where: { email: TEST_EMAIL.toLowerCase() },
      create: {
        email: TEST_EMAIL.toLowerCase(),
        displayName: "Register Test",
        passwordHash: "fakehash", // doesn't matter for this test
      },
      update: {},
      select: { id: true },
    });

    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: "Password123!",
      displayName: "Register Test",
    });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Email already in use");
  });
});
