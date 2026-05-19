import { CapacitorSQLite } from '@capacitor-community/sqlite'
import type { SqliteConnection } from './migration-runner.ts'

export async function openDatabaseConnection(
  database: string,
): Promise<SqliteConnection> {
  await CapacitorSQLite.open({ database })
  await CapacitorSQLite.run({
    database,
    statement: 'PRAGMA foreign_keys = ON',
    transaction: false,
  })
  return {
    execute: async (statements: string) =>
      CapacitorSQLite.execute({ database, statements, transaction: true }),
    run: async (statement: string, values?: unknown[]) =>
      CapacitorSQLite.run({ database, statement, values, transaction: true }),
    query: async (statement: string, values?: unknown[]) =>
      CapacitorSQLite.query({ database, statement, values }),
    executeSet: async (statements: { statement: string; values?: unknown[] }[]) =>
      CapacitorSQLite.executeSet({
        database,
        set: statements.map((s) => ({
          statement: s.statement,
          values: s.values ?? [],
        })),
        transaction: true,
      }),
  }
}
