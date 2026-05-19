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

let bootstrapPromise: Promise<AppDependencies> | null = null

export async function bootstrapDependencies(): Promise<AppDependencies> {
  if (bootstrapPromise) {
    return bootstrapPromise
  }

  bootstrapPromise = (async (): Promise<AppDependencies> => {
    const { Capacitor } = await import("@capacitor/core")
    const isNative = Capacitor.isNativePlatform()

    let uow: SqliteUnitOfWork | MemoryUnitOfWork

    if (isNative) {
      try {
        const conn = await openNativeConnection()
        await applyMigrations(conn, migrations)
        uow = new SqliteUnitOfWork(conn)
      } catch {
        uow = new MemoryUnitOfWork()
      }
    } else {
      uow = new MemoryUnitOfWork()
    }

    const ports = {
      taskRepository: uow.tasks,
      profileRepository: uow.profiles,
      progressionRepository: uow.progressions,
      unitOfWork: uow,
    }

    const deps: AppDependencies = {
      ports,
      useCases: {
        createTask: (input) => createTask(ports.taskRepository, input),
        completeTask: (input) => completeTask(ports.unitOfWork, input),
        archiveTask: (input) => archiveTask(ports.taskRepository, input),
        grantTaskXp: (input) => grantTaskXpWithinTransaction(ports.unitOfWork, input),
        applyLevelProgress,
        resolveTaskList,
        suggestTaskComplexity,
      },
    }

    return Object.freeze(deps)
  })()

  return bootstrapPromise
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
