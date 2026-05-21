import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchJson, setupTests, teardownTests, countAuditLogs } from "./setup.ts";

describe("POST /auth/logout", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

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

  it("writes audit log on logout", async () => {
    const email = `audit-logout-${Date.now()}@example.com`;
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
    const before = await countAuditLogs("logout");
    await fetchJson("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    const after = await countAuditLogs("logout");
    expect(after).toBe(before + 1);
  });
});

describe("GET /auth/me", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

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

describe("GET /auth/users (admin)", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

  it("returns 403 for non-admin", async () => {
    const email = `user-${Date.now()}@example.com`;
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
    const { status } = await fetchJson("/auth/users", {
      headers: { Authorization: `Bearer ${loginData.access_token}` },
    });
    expect(status).toBe(403);
  });
});
