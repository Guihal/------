import { describe, it, expect, beforeEach } from "vitest"
import { Database } from "bun:sqlite"
import { applyMigrations, type SqliteConnection } from "../../../../infrastructure/sqlite/migration-runner.ts"
import { migrations } from "../../../../infrastructure/sqlite/migrations/index.ts"
import { SqliteTaskRepository } from "../../../../infrastructure/sqlite/repositories/task.repository.ts"
import { SqliteProfileRepository } from "../../../../infrastructure/sqlite/repositories/profile.repository.ts"
import { SqliteProgressionRepository } from "../../../../infrastructure/sqlite/repositories/progression.repository.ts"
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
  describe.skip("sqlite repositories", () => { it("skipped", () => {}) })
} else {
  describe("sqlite repositories", () => {
    let db: Database
    let conn: SqliteConnection
    let tasks: SqliteTaskRepository
    let profiles: SqliteProfileRepository
    let progressions: SqliteProgressionRepository

    beforeEach(async () => {
      db = new Database(":memory:")
      conn = createConn(db)
      await applyMigrations(conn, migrations)
      tasks = new SqliteTaskRepository(conn)
      profiles = new SqliteProfileRepository(conn)
      progressions = new SqliteProgressionRepository(conn)
    })

    const profile: Profile = { id: "p1", name: "Alice", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z" }
    const task: Task = {
      id: "t1", profileId: "p1", title: "T", description: null, status: "active",
      priority: "normal", complexity: "small", complexitySource: "suggested",
      dueAt: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z",
      completedAt: null, archivedAt: null,
    }

    it("profile CRUD", async () => {
      expect(await profiles.findById("p1")).toBeNull()
      await profiles.save(profile)
      const found = await profiles.findById("p1")
      expect(found).toEqual(profile)
    })

    it("task CRUD", async () => {
      await profiles.save(profile)
      expect(await tasks.findById("t1")).toBeNull()
      await tasks.save(task)
      const found = await tasks.findById("t1")
      expect(found).toEqual(task)
    })

    it("task findAll filters by profile_id", async () => {
      await profiles.save(profile)
      await profiles.save({ ...profile, id: "p2", name: "Bob" })
      await tasks.save(task)
      await tasks.save({ ...task, id: "t2", profileId: "p2" })
      const p1Tasks = await tasks.findAll("p1")
      expect(p1Tasks).toHaveLength(1)
      expect(p1Tasks[0].id).toBe("t1")
    })

    it("task delete", async () => {
      await profiles.save(profile)
      await tasks.save(task)
      await tasks.delete("t1")
      expect(await tasks.findById("t1")).toBeNull()
    })

    it("task save updates existing", async () => {
      await profiles.save(profile)
      await tasks.save(task)
      const updated: Task = { ...task, title: "Updated", status: "completed", completedAt: "2025-01-02T00:00:00Z" }
      await tasks.save(updated)
      const found = await tasks.findById("t1")
      expect(found).toEqual(updated)
    })

    it("progression CRUD", async () => {
      await profiles.save(profile)
      const prog: Progression = { profileId: "p1", totalXp: 1500, updatedAt: "2025-01-02T00:00:00Z" }
      await progressions.save(prog)
      const found = await progressions.findById("p1")
      expect(found).toEqual(prog)
    })

    it("progression save updates existing", async () => {
      await profiles.save(profile)
      const prog: Progression = { profileId: "p1", totalXp: 500, updatedAt: "2025-01-02T00:00:00Z" }
      await progressions.save(prog)
      const updated: Progression = { profileId: "p1", totalXp: 2500, updatedAt: "2025-01-03T00:00:00Z" }
      await progressions.save(updated)
      const found = await progressions.findById("p1")
      expect(found).toEqual(updated)
    })
  })
}
