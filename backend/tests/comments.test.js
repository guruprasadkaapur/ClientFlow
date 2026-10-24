
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
      name: `Comments Project ${uniqueId()}`,
      description: "Project for comment tests",
    });

  expect(response.status).toBe(201);
  return response.body.data;
}

async function createTask(token, projectId) {
  const response = await request(app)
    .post(`/api/v1/projects/${projectId}/tasks`)
    .set("Authorization", `Bearer ${token}`)
    .send({ title: `Test task ${uniqueId()}` });

  expect(response.status).toBe(201);
  return response.body.data;
}

async function setupCommentScenario() {
  const owner = await registerAndLogin("owner");
  const project = await createProject(owner.token);
  const task = await createTask(owner.token, project.id);

  return { owner, project, task };
}

function commentsUrl(projectId, taskId) {
  return `/api/v1/projects/${projectId}/tasks/${taskId}/comments`;
}

describe("ClientFlow Comments API", () => {
  it("rejects listing comments without authentication", async () => {
    const response = await request(app)
      .get(commentsUrl(uniqueId(), uniqueId()));

    expect(response.status).toBe(401);
  });

  it("rejects creating comments without authentication", async () => {
    const response = await request(app)
      .post(commentsUrl(uniqueId(), uniqueId()))
      .send({ content: "Test comment" });

    expect(response.status).toBe(401);
  });

  it("creates a comment for a task accessible to the owner", async () => {
    const { owner, project, task } = await setupCommentScenario();
    const content = "This task is progressing well.";

    const response = await request(app)
      .post(commentsUrl(project.id, task.id))
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ content });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe(content);
    expect(response.body.data.taskId).toBe(task.id);
    expect(response.body.data.userId).toBe(owner.id);
    expect(response.body.data.author.id).toBe(owner.id);
  });

  it("lists comments belonging to a task", async () => {
    const { owner, project, task } = await setupCommentScenario();
    const url = commentsUrl(project.id, task.id);

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ content: "First comment" })
      .expect(201);

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ content: "Second comment" })
      .expect(201);

    const response = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(2);
    expect(response.body.data.map((comment) => comment.content)).toEqual([
      "First comment",
      "Second comment",
    ]);
  });

  it("rejects an empty comment", async () => {
    const { owner, project, task } = await setupCommentScenario();

    const response = await request(app)
      .post(commentsUrl(project.id, task.id))
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ content: "   " });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("rejects a comment exceeding 3000 characters", async () => {
    const { owner, project, task } = await setupCommentScenario();

    const response = await request(app)
      .post(commentsUrl(project.id, task.id))
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ content: "x".repeat(3001) });

    expect(response.status).toBe(400);
  });

  it("returns not found for an unknown task", async () => {
    const { owner, project } = await setupCommentScenario();

    const response = await request(app)
      .post(commentsUrl(project.id, uniqueId()))
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ content: "Test comment" });

    expect(response.status).toBe(404);
  });

  it("does not expose comments when the user cannot access the project", async () => {
    const { project, task } = await setupCommentScenario();
    const otherUser = await registerAndLogin("outsider");

    const response = await request(app)
      .get(commentsUrl(project.id, task.id))
      .set("Authorization", `Bearer ${otherUser.token}`);

    expect(response.status).toBe(404);
  });

  it("allows a project member to create and list comments", async () => {
    const { owner, project, task } = await setupCommentScenario();
    const member = await registerAndLogin("member");

    const addMember = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email });

    expect(addMember.status).toBe(201);

    const url = commentsUrl(project.id, task.id);

    const createResponse = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${member.token}`)
      .send({ content: "Comment from project member" });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.author.id).toBe(member.id);

    const listResponse = await request(app)
      .get(url)
      .set("Authorization", `Bearer ${member.token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.count).toBe(1);
    expect(listResponse.body.data[0].content).toBe(
      "Comment from project member"
    );
  });
});
