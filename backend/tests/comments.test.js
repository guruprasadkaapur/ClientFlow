
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("ClientFlow Comments API", () => {
  it("rejects listing comments without authentication", async () => {
    const response = await request(app).get(
      "/api/v1/projects/test-project-id/tasks/test-task-id/comments"
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects adding a comment without authentication", async () => {
    const response = await request(app)
      .post(
        "/api/v1/projects/test-project-id/tasks/test-task-id/comments"
      )
      .send({ content: "Test comment" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects an empty comment when unauthenticated", async () => {
    const response = await request(app)
      .post(
        "/api/v1/projects/test-project-id/tasks/test-task-id/comments"
      )
      .send({ content: "" });

    // Authentication runs before body validation.
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
