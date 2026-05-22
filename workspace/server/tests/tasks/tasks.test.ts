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

describe("PATCH /profile", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("updates display_name", async () => {
    const token = await registerAndLogin(`patch-${Date.now()}@example.com`);
    const { status, data } = await fetchJson("/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "New Name" }),
    });
    expect(status).toBe(200);
    expect(data.profile.display_name).toBe("New Name");
  });

  it("rejects empty display_name", async () => {
    const token = await registerAndLogin(`patch2-${Date.now()}@example.com`);
    const { status } = await fetchJson("/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "   " }),
    });
    expect(status).toBe(400);
  });

  it("returns 401 without token", async () => {
    const { status } = await fetchJson("/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: "X" }),
    });
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

  it("validates title empty after trim", async () => {
    const token = await registerAndLogin(`task-trim-${Date.now()}@example.com`);
    const { status } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
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

  it("validates description empty after trim", async () => {
    const token = await registerAndLogin(`task-desc-${Date.now()}@example.com`);
    const { status } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X", description: "   " }),
    });
    expect(status).toBe(400);
  });

  it("validates deadline in the future", async () => {
    const token = await registerAndLogin(`task-dl-${Date.now()}@example.com`);
    const past = new Date(Date.now() - 86400000).toISOString();
    const { status } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X", deadline: past }),
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
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
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
    const found = list.find((t: { id: number }) => t.id === taskId);
    expect(found).toBeUndefined();
  });
});

describe("PUT /tasks/:id", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("updates a task", async () => {
    const token = await registerAndLogin(`edit-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Old title", difficulty: "low" }),
    });
    const taskId = createData.task.id;
    const { status, data } = await fetchJson(`/tasks/${taskId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New title", difficulty: "high" }),
    });
    expect(status).toBe(200);
    expect(data.task.title).toBe("New title");
    expect(data.task.difficulty).toBe("high");
  });

  it("returns 404 for other user's task", async () => {
    const tokenA = await registerAndLogin(`ea-${Date.now()}@example.com`);
    const tokenB = await registerAndLogin(`eb-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Private" }),
    });
    const { status } = await fetchJson(`/tasks/${createData.task.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hacked" }),
    });
    expect(status).toBe(404);
  });

  it("rejects empty title", async () => {
    const token = await registerAndLogin(`edit2-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X" }),
    });
    const { status } = await fetchJson(`/tasks/${createData.task.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    expect(status).toBe(400);
  });
});

describe("DELETE /tasks/:id", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("deletes a task", async () => {
    const token = await registerAndLogin(`del-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Delete me" }),
    });
    const taskId = createData.task.id;
    const { status, data } = await fetchJson(`/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(status).toBe(200);
    expect(data.deleted).toBe(true);

    const { data: list } = await fetchJson("/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const found = list.find((t: { id: number }) => t.id === taskId);
    expect(found).toBeUndefined();
  });

  it("returns 404 for other user's task", async () => {
    const tokenA = await registerAndLogin(`da-${Date.now()}@example.com`);
    const tokenB = await registerAndLogin(`db-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Private" }),
    });
    const { status } = await fetchJson(`/tasks/${createData.task.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(status).toBe(404);
  });
});

describe("GET /tasks?status=", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("filters active tasks", async () => {
    const token = await registerAndLogin(`f-${Date.now()}@example.com`);
    await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Active task" }),
    });
    const { data: list } = await fetchJson("/tasks?status=active", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.every((t: { completed: boolean; archived: boolean }) => !t.completed && !t.archived)).toBe(true);
  });

  it("filters completed tasks", async () => {
    const token = await registerAndLogin(`fc-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Complete me" }),
    });
    await fetchJson(`/tasks/${createData.task.id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data: list } = await fetchJson("/tasks?status=completed", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.every((t: { completed: boolean }) => t.completed)).toBe(true);
  });

  it("filters archived tasks", async () => {
    const token = await registerAndLogin(`fa-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Archive me" }),
    });
    await fetchJson(`/tasks/${createData.task.id}/archive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data: list } = await fetchJson("/tasks?status=archived", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.every((t: { archived: boolean }) => t.archived)).toBe(true);
  });
});

describe("GET /tasks?overdue=true", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns only overdue uncompleted tasks", async () => {
    const token = await registerAndLogin(`ov-${Date.now()}@example.com`);
    const { data: createData } = await fetchJson("/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Overdue task" }),
    });
    const past = new Date(Date.now() - 86400000).toISOString();
    await fetchJson(`/tasks/${createData.task.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: past }),
    });
    const { data: list } = await fetchJson("/tasks?overdue=true", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.every((t: { deadline: string | null; completed: boolean }) => t.deadline !== null && !t.completed)).toBe(true);
  });
});
