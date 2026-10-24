
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

const password = "TestPassword123!";

async function createUserAndProject() {
  const email = `task-${crypto.randomUUID()}@example.com`;

  const registration = await request(app)
    .post("/api/v1/auth/register")
    .send({
      name: "Task Test User",
      email,
      password,
    });

  expect(registration.status).toBe(201);

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  expect(login.status).toBe(200);
  expect(login.body.token).toBeTruthy();

  const token = login.body.token;

  const projectResponse = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Task Test Project",
      description: "Created for task integration tests",
    });

  expect(projectResponse.status).toBe(201);

  return {
    token,
    userId: registration.body.data.id,
    projectId: projectResponse.body.data.id,
  };
}

describe("ClientFlow Tasks API", () => {
  it("rejects listing tasks without authentication", async () => {
    const response = await request(app)
      .get("/api/v1/projects/test-project-id/tasks");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects creating tasks without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/projects/test-project-id/tasks")
      .send({ title: "Test Task" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects updating tasks without authentication", async () => {
    const response = await request(app)
      .patch("/api/v1/projects/test-project-id/tasks/test-task-id")
      .send({ title: "Updated Task" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("creates a task for an authenticated project owner", async () => {
    const { token, userId, projectId } =
      await createUserAndProject();

    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Implement login page",
        description: "Build the login form",
        priority: "HIGH",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Implement login page");
    expect(response.body.data.description).toBe("Build the login form");
    expect(response.body.data.priority).toBe("HIGH");
    expect(response.body.data.status).toBe("TODO");
    expect(response.body.data.projectId).toBe(projectId);
    expect(response.body.data.creatorId).toBe(userId);
  });

  it("lists tasks belonging to an accessible project", async () => {
    const { token, projectId } = await createUserAndProject();

    const created = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task to list" });

    expect(created.status).toBe(201);

    const response = await request(app)
      .get(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.some(
        (task) => task.id === created.body.data.id
      )
    ).toBe(true);
  });

  it("updates a task's title, status, and priority", async () => {
    const { token, projectId } = await createUserAndProject();

    const created = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original task" });

    expect(created.status).toBe(201);

    const response = await request(app)
      .patch(
        `/api/v1/projects/${projectId}/tasks/${created.body.data.id}`
      )
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated task",
        status: "IN_PROGRESS",
        priority: "HIGH",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Updated task");
    expect(response.body.data.status).toBe("IN_PROGRESS");
    expect(response.body.data.priority).toBe("HIGH");
  });

  it("rejects a task title that is too short", async () => {
    const { token, projectId } = await createUserAndProject();

    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "A" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects an invalid task priority", async () => {
    const { token, projectId } = await createUserAndProject();

    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Valid task title",
        priority: "URGENT",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects an empty task update", async () => {
    const { token, projectId } = await createUserAndProject();

    const created = await request(app)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task to update" });

    expect(created.status).toBe(201);

    const response = await request(app)
      .patch(
        `/api/v1/projects/${projectId}/tasks/${created.body.data.id}`
      )
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("returns not found when an authenticated user accesses an unknown project", async () => {
    const { token } = await createUserAndProject();

    const response = await request(app)
      .get("/api/v1/projects/00000000-0000-4000-8000-000000000000/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
