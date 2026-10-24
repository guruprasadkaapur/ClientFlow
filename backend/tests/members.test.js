
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

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send(user);

  expect(registerResponse.status).toBe(201);

  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: user.email,
      password: user.password,
    });

  expect(loginResponse.status).toBe(200);

  return {
    token: loginResponse.body.token,
    id: registerResponse.body.data.id,
    email: user.email,
  };
}

async function createProject(token) {
  const response = await request(app)
    .post("/api/v1/projects")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: `Members Test Project ${uniqueId()}`,
      description: "Project for automated member tests",
    });

  expect(response.status).toBe(201);
  return response.body.data;
}

describe("ClientFlow Members API", () => {
  it("rejects listing members without authentication", async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${uniqueId()}/members`);

    expect(response.status).toBe(401);
  });

  it("rejects adding a member without authentication", async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${uniqueId()}/members`)
      .send({ email: "member@example.com" });

    expect(response.status).toBe(401);
  });

  it("allows the project owner to add an existing user", async () => {
    const owner = await registerAndLogin("owner");
    const member = await registerAndLogin("member");
    const project = await createProject(owner.token);

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.projectId).toBe(project.id);
    expect(response.body.data.user.id).toBe(member.id);
    expect(response.body.data.user.email).toBe(member.email);
  });

  it("lists project members for the project owner", async () => {
    const owner = await registerAndLogin("owner");
    const member = await registerAndLogin("member");
    const project = await createProject(owner.token);

    await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email })
      .expect(201);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.data[0].user.id).toBe(member.id);
  });

  it("rejects adding the same member twice", async () => {
    const owner = await registerAndLogin("owner");
    const member = await registerAndLogin("member");
    const project = await createProject(owner.token);
    const url = `/api/v1/projects/${project.id}/members`;

    await request(app)
      .post(url)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email })
      .expect(201);

    const response = await request(app)
      .post(url)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("rejects an invalid email address", async () => {
    const owner = await registerAndLogin("owner");
    const project = await createProject(owner.token);

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: "not-an-email" });

    expect(response.status).toBe(400);
  });

  it("returns not found when the requested user does not exist", async () => {
    const owner = await registerAndLogin("owner");
    const project = await createProject(owner.token);

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: `missing-${uniqueId()}@example.com` });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("prevents the owner from adding themselves as a member", async () => {
    const owner = await registerAndLogin("owner");
    const project = await createProject(owner.token);

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: owner.email });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("prevents a non-owner from adding project members", async () => {
    const owner = await registerAndLogin("owner");
    const nonOwner = await registerAndLogin("nonowner");
    const member = await registerAndLogin("member");
    const project = await createProject(owner.token);

    const response = await request(app)
      .post(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${nonOwner.token}`)
      .send({ email: member.email });

    expect(response.status).toBe(404);
  });

  it("prevents a non-owner from listing project members", async () => {
    const owner = await registerAndLogin("owner");
    const nonOwner = await registerAndLogin("nonowner");
    const project = await createProject(owner.token);

    const response = await request(app)
      .get(`/api/v1/projects/${project.id}/members`)
      .set("Authorization", `Bearer ${nonOwner.token}`);

    expect(response.status).toBe(404);
  });

  it("returns not found for an unknown project when adding a member", async () => {
    const owner = await registerAndLogin("owner");
    const member = await registerAndLogin("member");

    const response = await request(app)
      .post(`/api/v1/projects/${uniqueId()}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ email: member.email });

    expect(response.status).toBe(404);
  });

  it("returns not found for an unknown project when listing members", async () => {
    const owner = await registerAndLogin("owner");

    const response = await request(app)
      .get(`/api/v1/projects/${uniqueId()}/members`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(response.status).toBe(404);
  });
});
