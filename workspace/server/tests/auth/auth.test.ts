import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { pool } from "../../src/db/client.ts";
import { migrate } from "../../src/db/migrate.ts";

const BASE = "http://localhost:3003";

async function fetchJson(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let server: ReturnType<typeof spawn>;

beforeAll(async () => {
  // Ensure schema exists
  await migrate();
  server = spawn(["bun", "run", "src/index.ts"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PORT: "3003" },
  });
  await new Promise((r) => setTimeout(r, 400));
});

afterAll(async () => {
  server?.kill();
  await pool.end();
});

describe("POST /auth/register", () => {
  it("creates a user and returns id + email + role", async () => {
    const email = `test-${Date.now()}@example.com`;
    const { status, data } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    expect(status).toBe(200);
    expect(data.id).toBeNumber();
    expect(data.email).toBe(email);
    expect(data.role).toBe("user");
  });

  it("rejects duplicate email with 409", async () => {
    const email = `dup-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    expect(status).toBe(409);
  });

  it("rejects short password", async () => {
    const { status } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `short-${Date.now()}@example.com`, password: "123" }),
    });
    expect(status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("returns tokens for valid credentials", async () => {
    const email = `login-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    expect(status).toBe(200);
    expect(data.access_token).toBeString();
    expect(data.refresh_token).toBeString();
    expect(data.token_type).toBe("Bearer");
    expect(data.expires_in).toBe(900);
    expect(data.user.role).toBe("user");
  });

  it("returns 401 for bad password", async () => {
    const email = `bad-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrong" }),
    });
    expect(status).toBe(401);
  });
});

describe("POST /auth/refresh", () => {
  it("rotates refresh token and returns new access token", async () => {
    const email = `refresh-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });

    const { status, data } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(status).toBe(200);
    expect(data.access_token).toBeString();
    expect(data.refresh_token).toBeString();
    expect(data.refresh_token).not.toBe(loginData.refresh_token);
  });

  it("returns 401 for revoked token", async () => {
    const { status } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: "invalid.token.here" }),
    });
    expect(status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("returns ok even without token", async () => {
    const { status, data } = await fetchJson("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("revokes the session", async () => {
    const email = `logout-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    await fetchJson("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    const { status } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns user info with valid Bearer token", async () => {
    const email = `me-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { data: loginData } = await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const { status, data } = await fetchJson("/auth/me", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(200);
    expect(data.email).toBe(email);
    expect(data.role).toBe("user");
  });

  it("returns 401 without token", async () => {
    const { status } = await fetchJson("/auth/me");
    expect(status).toBe(401);
  });
});
