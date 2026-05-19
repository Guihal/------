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

  constructor(private readonly db: SqliteConnection) {
    this.tasks = new SqliteTaskRepository(db)
    this.profiles = new SqliteProfileRepository(db)
    this.progressions = new SqliteProgressionRepository(db)
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
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
        await this.db.execute("ROLLBACK")
      }
      throw err
    } finally {
      this.inTransaction = false
    }
  }
}
