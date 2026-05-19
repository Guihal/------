import type { AppDependencies } from "../infrastructure/di/app-dependencies"
import { createTask } from "../core/use-cases/tasks/create-task.use-case"
import { completeTask } from "../core/use-cases/tasks/complete-task.use-case"
import { archiveTask } from "../core/use-cases/tasks/archive-task.use-case"
import { grantTaskXpWithinTransaction } from "../core/use-cases/tasks/grant-task-xp.use-case"
import { applyLevelProgress } from "../core/use-cases/apply-level-progress.use-case"
import { resolveTaskList } from "../core/use-cases/resolve-task-list.use-case"
import { suggestTaskComplexity } from "../core/use-cases/suggest-task-complexity.use-case"
import { SqliteUnitOfWork } from "../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work"
import { MemoryUnitOfWork } from "../infrastructure/memory/unit-of-work/memory-unit-of-work"
import { Capacitor } from "@capacitor/core"
import { applyMigrations } from "../infrastructure/sqlite/migration-runner"
import { migrations } from "../infrastructure/sqlite/migrations"
import type { SqliteConnection } from "../infrastructure/sqlite/migration-runner"
import { provideAppDependencies } from "../infrastructure/di/provide-app-dependencies"
import { defineNuxtPlugin } from "nuxt/app"

async function openNativeConnection(): Promise<SqliteConnection> {
  const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite")
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const conn = await sqlite.createConnection("app_db", false, "no-encryption", 1, false)
  await conn.open()
  return conn as unknown as SqliteConnection
}

export async function bootstrapDependencies(): Promise<AppDependencies> {
  const isNative = Capacitor.isNativePlatform()

  let uow: SqliteUnitOfWork | MemoryUnitOfWork

  if (isNative) {
    const conn = await openNativeConnection()
    await applyMigrations(conn, migrations)
    uow = new SqliteUnitOfWork(conn)
  } else {
    uow = new MemoryUnitOfWork()
  }

  const deps: AppDependencies = {
    ports: {
      taskRepository: uow.tasks,
      profileRepository: uow.profiles,
      progressionRepository: uow.progressions,
      unitOfWork: uow,
    },
    useCases: {
      createTask: (input) => createTask(deps.ports.taskRepository, input),
      completeTask: (input) => completeTask(deps.ports.unitOfWork, input),
      archiveTask: (input) => archiveTask(deps.ports.taskRepository, input),
      grantTaskXp: (input) => grantTaskXpWithinTransaction(deps.ports.unitOfWork, input),
      applyLevelProgress,
      resolveTaskList,
      suggestTaskComplexity,
    },
  }

  return deps
}

export default defineNuxtPlugin(async () => {
  const deps = await bootstrapDependencies()
  provideAppDependencies(deps)
  return {
    provide: {
      appDependencies: deps,
    },
  }
})
