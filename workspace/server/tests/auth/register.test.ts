import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { fetchJson, setupTests, teardownTests, countAuditLogs } from "./setup.ts";

describe("POST /auth/register", () => {
  beforeAll(setupTests);
  afterAll(teardownTests);

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

  it("rejects invalid email", async () => {
    const { status } = await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "secret123" }),
    });
    expect(status).toBe(400);
  });

  it("writes audit log on register", async () => {
    const before = await countAuditLogs("register");
    const email = `audit-reg-${Date.now()}@example.com`;
    await fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    const after = await countAuditLogs("register");
    expect(after).toBe(before + 1);
  });
});
