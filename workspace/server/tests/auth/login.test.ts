import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchJson, setupTests, teardownTests, countAuditLogs } from "./setup.ts";

describe("POST /auth/login", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

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

  it("writes audit log on login", async () => {
    const email = `audit-login-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const before = await countAuditLogs("login");
    await fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const after = await countAuditLogs("login");
    expect(after).toBe(before + 1);
  });
});

describe("POST /auth/refresh", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

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

  it("detects reuse and invalidates all sessions", async () => {
    const email = `reuse-${Date.now()}@example.com`;
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

    const { data: refresh1 } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(refresh1.access_token).toBeString();

    const { status } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: loginData.refresh_token }),
    });
    expect(status).toBe(401);

    const { status: status2 } = await fetchJson("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh1.refresh_token }),
    });
    expect(status2).toBe(401);
  });
});
