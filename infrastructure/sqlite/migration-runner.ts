import type { Migration } from './migrations/index.ts'

export interface SqliteConnection {
  execute(statements: string): Promise<{ changes: number }>
  run(statement: string, values?: unknown[]): Promise<{ changes: number }>
  query(statement: string, values?: unknown[]): Promise<{ values: unknown[] }>
  executeSet?(statements: { statement: string; values?: unknown[] }[]): Promise<{ changes: number }>
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return h
}

function checksum(sql: string): string {
  return String(hashCode(sql))
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
      applied_at TEXT NOT NULL,
      checksum TEXT NOT NULL
    )`,
  )
  const { values } = await db.query('SELECT version, checksum FROM schema_migrations')
  const applied = new Map<number, string>()
  for (const row of values as { version: number; checksum: string }[]) {
    applied.set(row.version, row.checksum)
  }

  for (const m of migrations) {
    const existing = applied.get(m.version)
    if (existing !== undefined && existing !== checksum(m.sql)) {
      throw new Error(
        `schema drift detected for migration ${m.version}`,
      )
    }
  }

  return migrations
    .filter((m) => !applied.has(m.version))
    .sort((a, b) => a.version - b.version)
}

async function applySingleMigration(
  db: SqliteConnection,
  m: Migration,
  timeoutMs = 5000,
): Promise<void> {
  const cs = checksum(m.sql)
  console.log(`[migration] start v${m.version}`)

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
      await db.execute(m.sql)
      await db.run(insertStmt, insertValues)
    }
  }

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`[migration] timeout v${m.version}`)), timeoutMs)
  })

  try {
    await Promise.race([runMigration(), timeout])
    console.log(`[migration] done v${m.version}`)
  } catch (err) {
    console.error(`[migration] fail v${m.version}: ${err instanceof Error ? err.message : String(err)}`)
    throw err
  }
}
