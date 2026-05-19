import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port"
import type { SqliteConnection } from "../migration-runner.ts"
import { SqliteTaskRepository } from "../repositories/task.repository.ts"
import { SqliteProfileRepository } from "../repositories/profile.repository.ts"
import { SqliteProgressionRepository } from "../repositories/progression.repository.ts"

export class SqliteUnitOfWork implements UnitOfWorkPort {
  readonly tasks: SqliteTaskRepository
  readonly profiles: SqliteProfileRepository
  readonly progressions: SqliteProgressionRepository

  private inTransaction = false
  private lock: Promise<void> = Promise.resolve()

  constructor(private readonly db: SqliteConnection) {
    this.tasks = new SqliteTaskRepository(db)
    this.profiles = new SqliteProfileRepository(db)
    this.progressions = new SqliteProgressionRepository(db)
  }

  private async acquireLock(): Promise<() => void> {
    const prev = this.lock
    let resolve: () => void
    this.lock = new Promise<void>((r) => { resolve = r })
    await prev
    return () => resolve!()
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
    if (this.inTransaction) {
      throw new Error("Nested transactions are not supported")
    }
    const release = await this.acquireLock()
    try {
      if (this.inTransaction) {
        throw new Error("Nested transactions are not supported")
      }
      await this.db.execute("BEGIN TRANSACTION")
      this.inTransaction = true
      try {
        const result = await callback()
        await this.db.execute("COMMIT")
        return result
      } catch (err) {
        if (this.inTransaction) {
          try {
            await this.db.execute("ROLLBACK")
          } catch {
            // ignore rollback error, preserve original
          }
        }
        throw err
      } finally {
        this.inTransaction = false
      }
    } finally {
      release()
    }
  }
}
