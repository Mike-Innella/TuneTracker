import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../app";
import { prisma } from "../lib/prisma";
import { SESSION_COOKIE_NAME } from "../auth/session";

const TEST_EMAIL = "login.test@tunetracker.dev";
const TEST_PASSWORD = "Password123!";
const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

function getSetCookieValues(res: request.Response): string[] {
  const value = res.headers["set-cookie"];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

beforeAll(async () => {
  if (!RUN_DB_TESTS) return;

  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      passwordHash,
      displayName: "Login Test",
    },
  });
});

afterAll(async () => {
  if (!RUN_DB_TESTS) return;
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe("Auth login/logout", () => {
  dbTest("POST /api/auth/login sets tt_session cookie for valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.email).toBe(TEST_EMAIL);

    const setCookie = getSetCookieValues(res);
    expect(setCookie.some((value: string) => value.startsWith(`${SESSION_COOKIE_NAME}=`))).toBe(true);
  });

  dbTest("POST /api/auth/login returns 401 for invalid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: "WrongPassword!",
    });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("POST /api/auth/logout clears tt_session cookie", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const setCookie = getSetCookieValues(res);
    expect(setCookie.some((value: string) => value.startsWith(`${SESSION_COOKIE_NAME}=`))).toBe(true);
  });
});
