import type { Migration } from './migrations/index.ts'

export interface SqliteConnection {
  execute(statements: string): Promise<{ changes: number }>
  run(statement: string, values?: unknown[]): Promise<{ changes: number }>
  query(statement: string, values?: unknown[]): Promise<{ values: unknown[] }>
  executeSet?(statements: { statement: string; values?: unknown[] }[]): Promise<{ changes: number }>
}

async function sha256(sql: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(sql)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function applyMigrations(
  db: SqliteConnection,
  migrations: Migration[],
  timeoutMs = 5000,
): Promise<void> {
  const seen = new Set<number>()
  for (const m of migrations) {
    if (seen.has(m.version)) {
      throw new Error(`duplicate migration version: ${m.version}`)
    }
    seen.add(m.version)
  }

  await db.execute('PRAGMA foreign_keys = ON')
  await db.execute('PRAGMA journal_mode = WAL')
  await db.execute('PRAGMA synchronous = NORMAL')

  const pending = await getPendingMigrations(db, migrations)
  for (const m of pending) {
    await applySingleMigration(db, m, timeoutMs)
  }
}

async function getPendingMigrations(
  db: SqliteConnection,
  migrations: Migration[],
): Promise<Migration[]> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL,
      checksum TEXT NOT NULL
    )`,
  )
  await db.execute(
    `CREATE TABLE IF NOT EXISTS failed_migrations (
      version INTEGER PRIMARY KEY,
      error TEXT NOT NULL,
      failed_at TEXT NOT NULL
    )`,
  )
  const { values } = await db.query('SELECT version, checksum FROM schema_migrations')
  const applied = new Map<number, string>()
  for (const row of values as { version: number; checksum: string }[]) {
    applied.set(row.version, row.checksum)
  }

  for (const m of migrations) {
    const cs = await sha256(m.sql)
    const existing = applied.get(m.version)
    if (existing !== undefined && existing !== cs) {
      await recordFailedMigration(db, m.version, `schema drift detected for migration ${m.version}`)
      throw new Error(
        `schema drift detected for migration ${m.version}`,
      )
    }
  }

  return migrations
    .filter((m) => !applied.has(m.version))
    .sort((a, b) => a.version - b.version)
}

async function recordFailedMigration(
  db: SqliteConnection,
  version: number,
  error: string,
): Promise<void> {
  await db.run(
    'INSERT OR REPLACE INTO failed_migrations (version, error, failed_at) VALUES (?, ?, ?)',
    [version, error, new Date().toISOString()],
  )
}

async function applySingleMigration(
  db: SqliteConnection,
  m: Migration,
  timeoutMs = 5000,
): Promise<void> {
  const cs = await sha256(m.sql)

  const runMigration = async (): Promise<void> => {
    const insertStmt =
      'INSERT INTO schema_migrations (version, applied_at, checksum) VALUES (?, ?, ?)'
    const insertValues = [m.version, new Date().toISOString(), cs]

    if (db.executeSet) {
      await db.executeSet([
        { statement: m.sql },
        { statement: insertStmt, values: insertValues },
      ])
    } else {
      await db.execute('BEGIN TRANSACTION')
      try {
        await db.execute(m.sql)
        await db.run(insertStmt, insertValues)
        await db.execute('COMMIT')
      } catch (err) {
        try {
          await db.execute('ROLLBACK')
        } catch {
          // rollback failed, but throw original error
        }
        throw err
      }
    }
  }

  // SQLite doesn't support query cancellation. The timeout rejects the Promise
  // but the SQL statement continues executing in the background.
  let timerId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`migration timeout v${m.version}`)), timeoutMs)
  })

  try {
    await Promise.race([runMigration(), timeout])
  } finally {
    clearTimeout(timerId)
  }
}
