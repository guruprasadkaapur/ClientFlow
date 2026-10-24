
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

const uniqueId = () => crypto.randomUUID();

async function registerAndLogin(label = "user") {
  const id = uniqueId();
  const user = {
    name: `${label} User`,
    email: `${label}-${id}@example.com`,
    password: "TestPassword123!",
  };

  const registration = await request(app)
    .post("/api/v1/auth/register")
    .send(user);

  expect(registration.status).toBe(201);

  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: user.email, password: user.password });

  expect(login.status).toBe(200);

  return {
    token: login.body.token,
    id: registration.body.data.id,
    email: user.email,
  };
}

async function createProject(token) {
  const response = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: `Activity Project ${uniqueId()}`,
      description: "Project for activity history tests",
    });

  expect(response.status).toBe(201);
  return response.body.data;
}

async function createTask(token, projectId) {
  const response = await request(app)
    .post(`/api/v1/projects/${projectId}/tasks`)
    .set("Authorization", `Bearer ${token}`)
    .send({ title: `Activity Test Task ${uniqueId()}` });

  expect(response.status).toBe(201);
  return response.body.data;
}

describe("ClientFlow Activity History API", () => {
  it("rejects activity history requests without authentication", async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${uniqueId()}/activities`);

    expect(response.status).toBe(401);
  });

  it("returns an empty activity list for a project with no activities", async () => {
    const user = await registerAndLogin("empty");
    const project = await createProject(user.token);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/activities`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(0);
    expect(response.body.data).toEqual([]);
  });

  it("records task creation in project activity history", async () => {
    const user = await registerAndLogin("taskcreator");
    const project = await createProject(user.token);
    const task = await createTask(user.token, project.id);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/activities`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const activity = response.body.data.find(
      (item) =>
        item.action === "TASK_CREATED" &&
        item.taskId === task.id
    );

    expect(activity).toBeDefined();
    expect(activity.actor.id).toBe(user.id);
    expect(activity.projectId).toBe(project.id);
    expect(activity.task.id).toBe(task.id);
  });

  it("records comment creation in project activity history", async () => {
    const user = await registerAndLogin("commenter");
    const project = await createProject(user.token);
    const task = await createTask(user.token, project.id);

    const commentResponse = await request(app)
      .post(
        `/api/v1/projects/${project.id}/tasks/${task.id}/comments`
      )
      .set("Authorization", `Bearer ${user.token}`)
      .send({ content: "Checking activity history" });

    expect(commentResponse.status).toBe(201);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/activities`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(200);

    const activity = response.body.data.find(
      (item) =>
        item.action === "COMMENT_ADDED" &&
        item.taskId === task.id
    );

    expect(activity).toBeDefined();
    expect(activity.actor.id).toBe(user.id);
    expect(activity.projectId).toBe(project.id);
    expect(activity.task.id).toBe(task.id);
  });

  it("denies activity history access to a non-member", async () => {
    const owner = await registerAndLogin("owner");
    const outsider = await registerAndLogin("outsider");
    const project = await createProject(owner.token);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/activities`)
      .set("Authorization", `Bearer ${outsider.token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("allows a project member to view activity history", async () => {
    const owner = await registerAndLogin("owner");
    const member = await registerAndLogin("member");
    const project = await createProject(owner.token);

    const memberResponse = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email });

    expect(memberResponse.status).toBe(201);

    await createTask(owner.token, project.id);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/activities`)
      .set("Authorization", `Bearer ${member.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].actor).toBeDefined();
    expect(response.body.data[0].task).toBeDefined();
  });

  it("returns not found for an unknown project", async () => {
    const user = await registerAndLogin("unknown");

    const response = await request(app)
      .get(`/api/v1/projects/${uniqueId()}/activities`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(response.status).toBe(404);
  });
});
