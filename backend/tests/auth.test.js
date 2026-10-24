
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("ClientFlow Authentication API", () => {
  it("rejects registration with invalid input", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "A",
        email: "invalid-email",
        password: "123",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects login with invalid input", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "invalid-email",
        password: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects access to the profile without a token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me");

    expect(response.status).toBe(401);
  });
});
