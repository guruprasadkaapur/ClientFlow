
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("ClientFlow Tasks API", () => {
  it("rejects listing tasks without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/projects/test-project-id/tasks");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects creating a task without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/projects/test-project-id/tasks")
      .send({ title: "Test task" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects updating a task without authentication", async () => {
    const response = await request(app)
      .patch("/api/v1/projects/test-project-id/tasks/test-task-id")
      .send({ title: "Updated task" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
