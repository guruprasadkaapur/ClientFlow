
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

  it("registers a new user successfully", async () => {
    const email = `test-${Date.now()}@example.com`;

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Integration Test User",
        email,
        password: "TestPassword123!",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(email);
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("logs in a registered user successfully", async () => {
    const email = `login-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Login Test User",
        email,
        password,
      });

    expect(registration.status).toBe(201);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
  });
});
