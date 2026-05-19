import { describe, it, expect, beforeEach } from 'vitest'
import { Database } from 'bun:sqlite'
import { applyMigrations, type SqliteConnection } from '../../../infrastructure/sqlite/migration-runner.ts'
import { migrations } from '../../../infrastructure/sqlite/migrations/index.ts'

if (typeof Bun === 'undefined') {
  describe.skip('migration-runner', () => {
    it('skipped — requires Bun runtime', () => {})
  })
} else {
  function createBunSqliteConnection(db: Database): SqliteConnection {
    return {
      execute: async (statements: string) => {
        db.exec(statements)
        return { changes: db.changes }
      },
      run: async (statement: string, values?: unknown[]) => {
        const stmt = db.prepare(statement)
        const info = stmt.run(...(values ?? []))
        stmt.finalize()
        return { changes: Number(info.changes) }
      },
      query: async (statement: string, values?: unknown[]) => {
        const stmt = db.prepare(statement)
        const rows = stmt.all(...(values ?? [])) as unknown[]
        stmt.finalize()
        return { values: rows }
      },
    }
  }

  describe('migration-runner', () => {
    let db: Database
    let conn: SqliteConnection

    beforeEach(() => {
      db = new Database(':memory:')
      conn = createBunSqliteConnection(db)
    })

    it('applies all migrations on empty database', async () => {
      await applyMigrations(conn, migrations)

      const { values } = await conn.query(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      )
      const names = (values as { name: string }[]).map((r) => r.name)
      expect(names).toContain('schema_migrations')
      expect(names).toContain('profile')
      expect(names).toContain('progression')
      expect(names).toContain('tasks')
    })

    it('records applied migration in schema_migrations with checksum', async () => {
      await applyMigrations(conn, migrations)

      const { values } = await conn.query('SELECT version, checksum FROM schema_migrations')
      const rows = values as { version: number; checksum: string }[]
      expect(rows).toHaveLength(1)
      expect(rows[0].version).toBe(1)
      expect(rows[0].checksum).toBeTruthy()
      expect(typeof rows[0].checksum).toBe('string')
      expect(rows[0].checksum).toMatch(/^[a-f0-9]{64}$/)
    })

    it('is idempotent — re-run is no-op', async () => {
      await applyMigrations(conn, migrations)
      await applyMigrations(conn, migrations)

      const { values } = await conn.query('SELECT version FROM schema_migrations')
      const versions = (values as { version: number }[]).map((r) => r.version)
      expect(versions).toHaveLength(1)
      expect(versions[0]).toBe(1)
    })

    it('detects schema drift when checksum differs', async () => {
      await applyMigrations(conn, migrations)

      const tampered = migrations.map((m) => ({
        ...m,
        sql: m.sql + '\n-- tampered',
      }))

      await expect(applyMigrations(conn, tampered)).rejects.toThrow(/schema drift/)
    })

    it('rejects duplicate versions', async () => {
      const dups = [
        ...migrations,
        { version: 1, name: 'dup', sql: 'SELECT 1;' },
      ]
      await expect(applyMigrations(conn, dups)).rejects.toThrow(/duplicate migration version/)
    })

    it('times out on slow migration', async () => {
      const slowConn: SqliteConnection = {
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 200))
          return { changes: 0 }
        },
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 200))
          return { changes: 0 }
        },
        query: async () => ({ values: [] }),
      }

      const fastMigration = { version: 1, name: 'fast', sql: 'SELECT 1;' }
      await expect(applyMigrations(slowConn, [fastMigration], 50)).rejects.toThrow(/migration timeout/)
    })
  })
}
