
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("ClientFlow Projects API", () => {
  it("rejects listing projects without authentication", async () => {
    const response = await request(app).get("/api/v1/projects");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects creating a project without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/projects")
      .send({
        name: "Test Project",
        description: "Created by an automated test",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects creating a project with invalid input", async () => {
    const response = await request(app)
      .post("/api/v1/projects")
      .send({ name: "A" });

    // Authentication runs before body validation.
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects retrieving a project without authentication", async () => {
    const response = await request(app).get(
      "/api/v1/projects/test-project-id"
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects updating a project without authentication", async () => {
    const response = await request(app)
      .patch("/api/v1/projects/test-project-id")
      .send({ name: "Updated Project" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects deleting a project without authentication", async () => {
    const response = await request(app).delete(
      "/api/v1/projects/test-project-id"
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("creates a project for an authenticated user", async () => {
    const email = `project-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Project Test User",
        email,
        password,
      });

    expect(registration.status).toBe(201);

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password });

    expect(login.status).toBe(200);
    const token = login.body.token;

    const response = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Integration Test Project",
        description: "Created by an automated integration test",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe("Integration Test Project");
    expect(response.body.data.ownerId).toBe(registration.body.data.id);
  });
});
