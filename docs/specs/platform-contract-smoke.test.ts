import { describe, it, expect, beforeEach } from 'bun:test';
import { MockPool } from '../../workspace/server/src/db/pg';
import { setPool } from '../../workspace/server/src/db';
import { registerHandler } from '../../workspace/server/src/http/auth/register';
import { loginHandler } from '../../workspace/server/src/http/auth/login';
import { meHandler } from '../../workspace/server/src/http/auth/me';
import { createTaskHandler, completeTaskHandler } from '../../workspace/server/src/http/tasks';
import { createItemHandler } from '../../workspace/server/src/http/admin/items/create';
import { listAdminLogsHandler } from '../../workspace/server/src/http/admin/logs';
import { getTaskStatsHandler } from '../../workspace/server/src/http/admin/stats';

function makeRequest(body: object): Request {
  return new Request('http://localhost:3000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(url = 'http://localhost:3000', headers?: Record<string, string>): Request {
  return new Request(url, { method: 'GET', headers });
}

function makePatchRequest(url: string, headers?: Record<string, string>): Request {
  return new Request(url, { method: 'PATCH', headers });
}

function makeAuthRequest(token: string, body: object): Request {
  return new Request('http://localhost:3000', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function makeDeterministicRng(sequence: number[]): () => number {
  let idx = 0;
  return () => {
    const val = sequence[idx % sequence.length]!;
    idx++;
    return val;
  };
}

async function registerUser(email: string, password: string) {
  const res = await registerHandler(makeRequest({ email, password }));
  if (res.status !== 201) throw new Error(`Register failed: ${res.status}`);
  return res.json();
}

async function loginUser(email: string, password: string) {
  const res = await loginHandler(makeRequest({ email, password }));
  if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

describe('Platform contract smoke', () => {
  let mockPool: MockPool;

  beforeEach(() => {
    mockPool = new MockPool();
    setPool(mockPool);
  });

  it('all critical endpoints respond correctly', async () => {
    // Seed an item for drops
    await mockPool.query(
      `INSERT INTO items (name, description, rarity, slot, xp_multiplier_min, xp_multiplier_max, asset_url, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      ['Contract Hat', 'A hat', 'common', 'head', 1.0, 1.5, '/assets/hat.webp', true]
    );

    // /auth/register
    const reg = await registerHandler(makeRequest({ email: 'u@example.com', password: 'password123' }));
    expect(reg.status).toBe(201);
    const regBody = await reg.json();
    expect(regBody.id).toBeDefined();
    expect(regBody.email).toBe('u@example.com');

    // /auth/login
    const login = await loginHandler(makeRequest({ email: 'u@example.com', password: 'password123' }));
    expect(login.status).toBe(200);
    const loginBody = await login.json();
    expect(loginBody.accessToken).toBeDefined();
    expect(loginBody.user).toBeDefined();
    const token = loginBody.accessToken;

    // /auth/me
    const me = await meHandler(makeGetRequest('http://localhost:3000/auth/me', { Authorization: `Bearer ${token}` }));
    expect(me.status).toBe(200);
    const meBody = await me.json();
    expect(meBody.email).toBe('u@example.com');

    // /tasks (create)
    const taskRes = await createTaskHandler(
      makeAuthRequest(token, { title: 'Contract task', category: 'work', difficulty: 'medium' }),
      regBody.id
    );
    expect(taskRes.status).toBe(201);
    const task = await taskRes.json();
    expect(task.id).toBeDefined();

    // /tasks/:id/complete
    const rng = makeDeterministicRng([0.1, 0.05, 0.5, 0.5]);
    const completeRes = await completeTaskHandler(
      makePatchRequest(`http://localhost:3000/tasks/${task.id}/complete`, { Authorization: `Bearer ${token}` }),
      regBody.id,
      task.id,
      rng
    );
    expect(completeRes.status).toBe(200);
    const completeBody = await completeRes.json();
    expect(completeBody.progression).toBeDefined();
    expect(completeBody.reward).toBeDefined();

    // Promote to admin for admin routes
    await mockPool.query("UPDATE users SET role = 'admin' WHERE id = $1", [regBody.id]);

    // /admin/items
    const itemRes = await createItemHandler(
      makeAuthRequest(token, {
        name: 'Admin Item',
        rarity: 'rare',
        slot: 'body',
        xpMultiplierMin: 1.0,
        xpMultiplierMax: 2.0,
        active: true,
      })
    );
    expect(itemRes.status).toBe(201);
    const itemBody = await itemRes.json();
    expect(itemBody.id).toBeDefined();

    // /admin/logs
    const logsRes = await listAdminLogsHandler(
      makeGetRequest('http://localhost:3000/admin/logs?limit=10&offset=0', { Authorization: `Bearer ${token}` })
    );
    expect(logsRes.status).toBe(200);
    const logsBody = await logsRes.json();
    expect(Array.isArray(logsBody.logs)).toBe(true);
    expect(logsBody.pagination).toBeDefined();

    // /admin/stats/tasks
    const statsRes = await getTaskStatsHandler();
    expect(statsRes.status).toBe(200);
    const statsBody = await statsRes.json();
    expect(typeof statsBody.totalCreated).toBe('number');
    expect(typeof statsBody.totalCompleted).toBe('number');
    expect(typeof statsBody.completionRate).toBe('number');
  });
});
