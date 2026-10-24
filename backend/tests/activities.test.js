
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("ClientFlow Activity History API", () => {
  it("rejects viewing activity history without authentication", async () => {
    const response = await request(app).get(
      "/api/v1/projects/test-project-id/activities"
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
