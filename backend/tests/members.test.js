
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("ClientFlow Project Membership API", () => {
  it("rejects listing members without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/projects/test-project-id/members");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects adding a member without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/projects/test-project-id/members")
      .send({ email: "member@example.com" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects adding a member with invalid input when unauthenticated", async () => {
    const response = await request(app)
      .post("/api/v1/projects/test-project-id/members")
      .send({ email: "invalid-email" });

    // Authentication middleware runs before body validation.
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
