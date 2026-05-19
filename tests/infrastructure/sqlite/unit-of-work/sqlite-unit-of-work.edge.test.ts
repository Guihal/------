import { describe, it, expect, beforeEach } from "vitest"
import { Database } from "bun:sqlite"
import { applyMigrations, type SqliteConnection } from "../../../../infrastructure/sqlite/migration-runner.ts"
import { migrations } from "../../../../infrastructure/sqlite/migrations/index.ts"
import { SqliteUnitOfWork } from "../../../../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work.ts"
import type { Task } from "../../../../core/domain/task/types"
import type { Profile } from "../../../../core/domain/profile/types"

function createConn(db: Database): SqliteConnection {
  return {
    execute: async (s: string) => { db.exec(s); return { changes: db.changes } },
    run: async (s: string, v?: unknown[]) => {
      const stmt = db.prepare(s)
      const info = stmt.run(...(v ?? []))
      stmt.finalize()
      return { changes: Number(info.changes) }
    },
    query: async (s: string, v?: unknown[]) => {
      const stmt = db.prepare(s)
      const rows = stmt.all(...(v ?? [])) as unknown[]
      stmt.finalize()
      return { values: rows }
    },
  }
}

if (typeof Bun === "undefined") {
  describe.skip("sqlite unit of work — edge", () => { it("skipped", () => {}) })
} else {
  describe("sqlite unit of work — edge", () => {
    let db: Database
    let conn: SqliteConnection
    let uow: SqliteUnitOfWork

    beforeEach(async () => {
      db = new Database(":memory:")
      conn = createConn(db)
      await applyMigrations(conn, migrations)
      uow = new SqliteUnitOfWork(conn)
    })

    const profile: Profile = { id: "p1", name: "Alice", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }
    const task: Task = {
      id: "t1", profileId: "p1", title: "T", description: null, status: "active",
      priority: "normal", complexity: "small", complexitySource: "suggested",
      dueAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
      completedAt: null, archivedAt: null,
    }

    it("rejects nested run() calls", async () => {
      await expect(
        uow.run(async () => {
          await uow.profiles.save(profile)
          await uow.run(async () => {
            await uow.tasks.save(task)
          })
        }),
      ).rejects.toThrow("Nested transactions are not supported")

      expect(await uow.profiles.findById("p1")).toBeNull()
      expect(await uow.tasks.findById("p1", "t1")).toBeNull()
    })

    it("does not mask original error when BEGIN fails", async () => {
      const brokenConn: SqliteConnection = {
        execute: async () => { throw new Error("db locked") },
        run: conn.run,
        query: conn.query,
      }
      const brokenUow = new SqliteUnitOfWork(brokenConn)

      await expect(
        brokenUow.run(async () => {
          await brokenUow.profiles.save(profile)
        }),
      ).rejects.toThrow("db locked")
    })

    it("preserves original error when ROLLBACK fails", async () => {
      let callCount = 0
      const rollbackFailingConn: SqliteConnection = {
        execute: async (sql: string) => {
          callCount++
          if (sql === "BEGIN TRANSACTION") {
            db.exec(sql)
            return { changes: db.changes }
          }
          if (sql === "ROLLBACK") {
            throw new Error("rollback failed")
          }
          db.exec(sql)
          return { changes: db.changes }
        },
        run: conn.run,
        query: conn.query,
      }
      const uow = new SqliteUnitOfWork(rollbackFailingConn)

      await expect(
        uow.run(async () => {
          await uow.profiles.save(profile)
          throw new Error("original boom")
        }),
      ).rejects.toThrow("original boom")
    })

    it("serializes concurrent run() calls", async () => {
      const order: string[] = []

      const p1 = uow.run(async () => {
        order.push("a-begin")
        await new Promise((r) => setTimeout(r, 20))
        order.push("a-end")
        return "a"
      })

      const p2 = uow.run(async () => {
        order.push("b-begin")
        await new Promise((r) => setTimeout(r, 10))
        order.push("b-end")
        return "b"
      })

      const [r1, r2] = await Promise.all([p1, p2])
      expect(r1).toBe("a")
      expect(r2).toBe("b")

      // one transaction must fully complete before the other starts
      const aFirst = order.indexOf("a-begin") < order.indexOf("b-begin")
      if (aFirst) {
        expect(order).toEqual(["a-begin", "a-end", "b-begin", "b-end"])
      } else {
        expect(order).toEqual(["b-begin", "b-end", "a-begin", "a-end"])
      }
    })
  })
}
