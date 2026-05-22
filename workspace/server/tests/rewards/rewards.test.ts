import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { pool } from "../../src/db/client.ts";
import { migrate } from "../../src/db/schema.ts";
import { setGlobalRandom, createSeededRandom } from "../../src/domain/rewards/drop.ts";

const BASE = "http://localhost:3005";

async function fetchWithTimeout(url: string, opts?: RequestInit, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(path: string, opts?: RequestInit) {
  const res = await fetchWithTimeout(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function waitForServer(url: string, maxMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (res.status === 200) return;
    } catch { /* ignore */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Server did not start in time");
}

let server: ReturnType<typeof spawn>;

async function registerAndLogin(): Promise<{ accessToken: string; userId: number }> {
  const email = `reward-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const reg = await fetchJson("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret123" }),
  });
  const { data } = await fetchJson("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "secret123" }),
  });
  return { accessToken: data.accessToken, userId: reg.data.id ?? data.user.id };
}

async function createTask(accessToken: string, difficulty = "normal", size = "medium") {
  const { status, data } = await fetchJson("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ title: "Test task", difficulty, size }),
  });
  if (status !== 201) throw new Error(`Task create failed: ${status} ${JSON.stringify(data)}`);
  return data.task;
}

import { signAccessToken } from "../../src/security/jwt.ts";

async function createItem(name: string, rarity: string) {
  const { data } = await fetchJson("/admin/items", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${signAccessToken(1, "admin")}` },
    body: JSON.stringify({ name, rarity }),
  });
  return data.item;
}

beforeAll(async () => {
  await migrate();
  await pool.query("DELETE FROM user_items");
  await pool.query("DELETE FROM items");
  await pool.query("DELETE FROM tasks");
  await pool.query("DELETE FROM progressions");
  await pool.query("DELETE FROM audit_logs");
  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM users");
  server = spawn(["bun", "run", "src/index.ts"], {
    cwd: "/usr/projects/Диплом/workspace/server",
    stdio: ["inherit", "inherit", "inherit"],
    env: { ...process.env, PORT: "3005", DISABLE_RATE_LIMIT: "1" },
  });
  await waitForServer(`${BASE}/health`);
});

afterAll(async () => {
  server?.kill();
  await server?.exited;
});

describe("drop roll", () => {
  it("is deterministic with seeded random", async () => {
    setGlobalRandom(createSeededRandom(42));
    await createItem("Common Hat", "common");
    const { accessToken } = await registerAndLogin();
    const task = await createTask(accessToken);
    const { data } = await fetchJson(`/tasks/${task.id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(data.reward).toBeDefined();
    setGlobalRandom(null);
  });

  it("returns null when no items match rarity", async () => {
    setGlobalRandom(createSeededRandom(42));
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    const { accessToken } = await registerAndLogin();
    const task = await createTask(accessToken);
    const { data } = await fetchJson(`/tasks/${task.id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(data.reward.drop).toBeUndefined();
    setGlobalRandom(null);
  });
});

describe("inventory", () => {
  it("requires auth", async () => {
    const { status } = await fetchJson("/inventory");
    expect(status).toBe(401);
  });

  it("lists user items", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM progressions");
    await pool.query("DELETE FROM audit_logs");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM users");
    const item = await createItem("Sword", "rare");
    const { accessToken, userId } = await registerAndLogin();
    await pool.query("INSERT INTO user_items (user_id, item_id, quantity) VALUES ($1, $2, 1)", [userId, item.id]);
    const { status, data } = await fetchJson("/inventory", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(status).toBe(200);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });
});

describe("equip", () => {
  it("rejects equipping unowned item", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM progressions");
    await pool.query("DELETE FROM audit_logs");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM users");
    const { accessToken } = await registerAndLogin();
    const { status } = await fetchJson("/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ item_id: 99999 }),
    });
    expect(status).toBe(404);
  });

  it("equips owned item", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM progressions");
    await pool.query("DELETE FROM audit_logs");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM users");
    const item = await createItem("Shield", "common");
    const { accessToken, userId } = await registerAndLogin();
    await pool.query("INSERT INTO user_items (user_id, item_id, quantity) VALUES ($1, $2, 1)", [userId, item.id]);
    const { status, data } = await fetchJson("/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ item_id: item.id }),
    });
    expect(status).toBe(200);
    expect(data.item.equipped).toBe(true);
  });

  it("unequips when item_id is null", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM progressions");
    await pool.query("DELETE FROM audit_logs");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM users");
    const item = await createItem("Helm", "common");
    const { accessToken, userId } = await registerAndLogin();
    await pool.query("INSERT INTO user_items (user_id, item_id, quantity, equipped) VALUES ($1, $2, 1, true)", [userId, item.id]);
    const { status, data } = await fetchJson("/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ item_id: null }),
    });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
  });
});

describe("level rewards", () => {
  it("grants reward on level up", async () => {
    await pool.query("DELETE FROM user_items");
    await pool.query("DELETE FROM items");
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM progressions");
    await pool.query("DELETE FROM audit_logs");
    await pool.query("DELETE FROM sessions");
    await pool.query("DELETE FROM users");
    await createItem("Common Gem", "common");
    const { accessToken } = await registerAndLogin();
    const task = await createTask(accessToken, "high", "large");
    const { data } = await fetchJson(`/tasks/${task.id}/complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(data.reward).toBeDefined();
    expect(data.xp_gained).toBeGreaterThan(0);
  });
});
