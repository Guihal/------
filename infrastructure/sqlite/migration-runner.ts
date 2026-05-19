import type { Migration } from './migrations/index.ts'

export interface SqliteConnection {
  execute(statements: string): Promise<{ changes: number }>
  run(statement: string, values?: unknown[]): Promise<{ changes: number }>
  query(statement: string, values?: unknown[]): Promise<{ values: unknown[] }>
}

export async function applyMigrations(
  db: SqliteConnection,
  migrations: Migration[],
): Promise<void> {
  const pending = await getPendingMigrations(db, migrations)
  for (const m of pending) {
    await applySingleMigration(db, m)
  }
}

async function getPendingMigrations(
  db: SqliteConnection,
  migrations: Migration[],
): Promise<Migration[]> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  )
  const { values } = await db.query('SELECT version FROM schema_migrations')
  const applied = new Set(
    (values as { version: number }[]).map((r) => r.version),
  )
  return migrations
    .filter((m) => !applied.has(m.version))
    .sort((a, b) => a.version - b.version)
}

async function applySingleMigration(
  db: SqliteConnection,
  m: Migration,
): Promise<void> {
  await db.execute('BEGIN TRANSACTION')
  try {
    await db.execute(m.sql)
    await db.run(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      [m.version, new Date().toISOString()],
    )
    await db.execute('COMMIT')
  } catch (err) {
    await db.execute('ROLLBACK').catch(() => {
      /* ignore rollback errors */
    })
    throw err
  }
}
