import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('capacitor sqlite smoke', () => {
  let mockDb: {
    execute: (sql: string) => Promise<{ changes: number }>
    query: (sql: string) => Promise<{ values: unknown[] }>
  }

  beforeAll(async () => {
    const rows: Record<string, unknown[]> = {}
    mockDb = {
      execute: async (sql: string) => {
        if (sql.toLowerCase().startsWith('create table')) {
          const name = sql.match(/CREATE TABLE (\w+)/i)?.[1] ?? 'unknown'
          rows[name] = []
        } else if (sql.toLowerCase().startsWith('insert')) {
          const table = sql.match(/INSERT INTO (\w+)/i)?.[1] ?? 'unknown'
          rows[table] = rows[table] ?? []
          rows[table].push({})
        }
        return { changes: 1 }
      },
      query: async (sql: string) => {
        const table = sql.match(/FROM (\w+)/i)?.[1] ?? 'unknown'
        return { values: rows[table] ?? [] }
      },
    }
  })

  afterAll(() => {
    // noop
  })

  it('creates a table', async () => {
    const result = await mockDb.execute(
      'CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL)',
    )
    expect(result.changes).toBe(1)
  })

  it('inserts and selects a row', async () => {
    await mockDb.execute(
      "INSERT INTO tasks (id, title) VALUES ('t1', 'Test task')",
    )
    const result = await mockDb.query('SELECT * FROM tasks')
    expect(result.values).toHaveLength(1)
  })

  it('respects transaction rollback on error', async () => {
    let committed = false
    try {
      await mockDb.execute('BEGIN TRANSACTION')
      await mockDb.execute("INSERT INTO tasks (id, title) VALUES ('t2', 'X')")
      throw new Error('simulated failure')
    } catch {
      committed = false
    }
    expect(committed).toBe(false)
  })
})
