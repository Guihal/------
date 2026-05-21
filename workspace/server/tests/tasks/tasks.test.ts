import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchJson, setupTests, teardownTests, registerAndLogin } from "./setup.ts";

describe("GET /profile", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns profile for authenticated user", async () => {
    const token = await registerAndLogin(`prof-${Date.now()}@example.com`);
    const { status, data } = await fetchJson("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.id).toBeDefined();
    expect(data.email).toBeDefined();
    expect(data.xp).toBe(0);
    expect(data.level).toBe(1);
  });

  it("returns 401 without token", async () => {
    const { status } = await fetchJson("/profile");
    expect(status).toBe(401);
  });
});

describe("GET /progression", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns progression with next_level_xp", async () => {
    const token = await registerAndLogin(`prog-${Date.now()}@example.com`);
    const { status, data } = await fetchJson("/progression", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.xp).toBe(0);
    expect(data.level).toBe(1);
    expect(data.next_level_xp).toBe(100);
  });
});

describe("POST /tasks", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("creates a task with defaults", async () => {
    const token = await registerAndLogin(`task-${Date.now()}@example.com`);
    const { status, data } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test task" }),
    });
    expect(status).toBe(201);
    expect(data.task.title).toBe("Test task");
    expect(data.task.difficulty).toBe("normal");
    expect(data.task.category).toBe("general");
    expect(data.task.size).toBe("medium");
    expect(data.task.completed).toBe(false);
  });

  it("validates title length", async () => {
    const token = await registerAndLogin(`task2-${Date.now()}@example.com`);
    const { status } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    expect(status).toBe(400);
  });

  it("validates difficulty enum", async () => {
    const token = await registerAndLogin(`task3-${Date.now()}@example.com`);
    const { status } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X", difficulty: "impossible" }),
    });
    expect(status).toBe(400);
  });
});

describe("GET /tasks", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("lists user tasks excluding archived", async () => {
    const token = await registerAndLogin(`list-${Date.now()}@example.com`);
    await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "A" }),
    });
    const { status, data } = await fetchJson("/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(data.tasks.length).toBeGreaterThanOrEqual(1);
  });
});

describe("PATCH /tasks/:id/complete", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("completes task and grants server-owned XP", async () => {
    const token = await registerAndLogin(`comp-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Complete me", difficulty: "normal", size: "medium" }),
    });
    const taskId = createData.task.id;
    const { status, data } = await fetchJson(`/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.task.completed).toBe(true);
    expect(data.xp_gained).toBe(20);

    const { data: prog } = await fetchJson("/progression", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(prog.xp).toBe(20);
  });

  it("is idempotent on already completed task", async () => {
    const token = await registerAndLogin(`comp2-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Done", difficulty: "high", size: "large" }),
    });
    const taskId = createData.task.id;
    await fetchJson(`/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const { status, data } = await fetchJson(`/tasks/${taskId}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.xp_gained).toBe(0);

    const { data: prog } = await fetchJson("/progression", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(prog.xp).toBe(60);
  });

  it("returns 404 for other user's task", async () => {
    const tokenA = await registerAndLogin(`a-${Date.now()}@example.com`);
    const tokenB = await registerAndLogin(`b-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Private" }),
    });
    const { status } = await fetchJson(`/tasks/${createData.task.id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(status).toBe(404);
  });
});

describe("PATCH /tasks/:id/archive", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("archives a task", async () => {
    const token = await registerAndLogin(`arch-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Archive me" }),
    });
    const taskId = createData.task.id;
    const { status, data } = await fetchJson(`/tasks/${taskId}/archive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.archived).toBe(true);

    const { data: list } = await fetchJson("/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const found = list.tasks.find((t: { id: number }) => t.id === taskId);
    expect(found).toBeUndefined();
  });
});
