import request from "supertest";
import app from "../app";

describe("Auth router", () => {
  it("GET /api/auth/ping returns ok", async () => {
    const res = await request(app).get("/api/auth/ping");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      feature: "auth",
      route: "ping",
    });
  });
});
