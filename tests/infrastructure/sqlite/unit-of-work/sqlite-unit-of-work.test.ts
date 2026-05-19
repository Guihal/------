import { describe, it, expect, beforeEach } from "vitest"
import { Database } from "bun:sqlite"
import { applyMigrations, type SqliteConnection } from "../../../../infrastructure/sqlite/migration-runner.ts"
import { migrations } from "../../../../infrastructure/sqlite/migrations/index.ts"
import { SqliteUnitOfWork } from "../../../../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work.ts"
import type { Task } from "../../../../core/domain/task/types"
import type { Profile } from "../../../../core/domain/profile/types"
import type { Progression } from "../../../../core/domain/progression/types"

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
  describe.skip("sqlite unit of work", () => { it("skipped", () => {}) })
} else {
  describe("sqlite unit of work", () => {
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

    it("commits multi-entity operation", async () => {
      await uow.run(async () => {
        await uow.profiles.save(profile)
        await uow.tasks.save(task)
      })
      expect(await uow.profiles.findById("p1")).toEqual(profile)
      expect(await uow.tasks.findById("t1")).toEqual(task)
    })

    it("rolls back on error leaving no partial state", async () => {
      await expect(
        uow.run(async () => {
          await uow.profiles.save(profile)
          await uow.tasks.save(task)
          throw new Error("boom")
        }),
      ).rejects.toThrow("boom")

      expect(await uow.profiles.findById("p1")).toBeNull()
      expect(await uow.tasks.findById("t1")).toBeNull()
    })

    it("simulates completeTask chain: save task + save progression", async () => {
      await uow.profiles.save(profile)
      const prog: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2025-01-01T00:00:00Z" }
      await uow.progressions.save(prog)

      const completedTask: Task = { ...task, status: "completed", updatedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:00:00Z" }
      const updatedProg: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2025-01-02T00:00:00Z" }

      await uow.run(async () => {
        await uow.tasks.save(completedTask)
        await uow.progressions.save(updatedProg)
      })

      expect(await uow.tasks.findById("t1")).toEqual(completedTask)
      expect(await uow.progressions.findById("p1")).toEqual(updatedProg)
    })

    it("rolls back completeTask chain on error", async () => {
      await uow.profiles.save(profile)
      const prog: Progression = { profileId: "p1", totalXp: 0, updatedAt: "2025-01-01T00:00:00Z" }
      await uow.progressions.save(prog)
      await uow.tasks.save(task)

      const completedTask: Task = { ...task, status: "completed", updatedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:00:00Z" }
      const updatedProg: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2025-01-02T00:00:00Z" }

      await expect(
        uow.run(async () => {
          await uow.tasks.save(completedTask)
          await uow.progressions.save(updatedProg)
          throw new Error("boom")
        }),
      ).rejects.toThrow("boom")

      expect((await uow.tasks.findById("t1"))!.status).toBe("active")
      expect((await uow.progressions.findById("p1"))!.totalXp).toBe(0)
    })

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
      expect(await uow.tasks.findById("t1")).toBeNull()
    })
  })
}
