import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

const RUN_DB_TESTS =
  process.env.RUN_DB_TESTS === "1" && Boolean(process.env.DATABASE_URL);
const dbTest = RUN_DB_TESTS ? test : test.skip;

afterAll(async () => {
  // Prevent Jest open-handle hangs (mysql pool / prisma engine)
  if (RUN_DB_TESTS) {
    await prisma.$disconnect();
  }
});

describe("Health endpoints", () => {
  test("GET /api/health returns ok:true", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  dbTest("GET /api/health/db returns ok:true when DB is reachable", async () => {
    const res = await request(app).get("/api/health/db");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test("Unknown route returns 404", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});
