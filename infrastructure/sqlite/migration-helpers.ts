import type { Migration } from "./migrations/index.ts";
import type { SqliteConnection } from "./migration-runner.ts";

async function sha256(sql: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(sql);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function getPendingMigrations(
	db: SqliteConnection,
	migrations: Migration[],
): Promise<Migration[]> {
	await db.execute(
		`CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL,
      checksum TEXT NOT NULL
    )`,
	);
	await db.execute(
		`CREATE TABLE IF NOT EXISTS failed_migrations (
      version INTEGER PRIMARY KEY,
      error TEXT NOT NULL,
      failed_at TEXT NOT NULL
    )`,
	);
	const { values } = await db.query(
		"SELECT version, checksum FROM schema_migrations",
	);
	const applied = new Map<number, string>();
	for (const row of values as { version: number; checksum: string }[]) {
		applied.set(row.version, row.checksum);
	}

	for (const m of migrations) {
		const cs = await sha256(m.sql);
		const existing = applied.get(m.version);
		if (existing !== undefined && existing !== cs) {
			await recordFailedMigration(
				db,
				m.version,
				`schema drift detected for migration ${m.version}`,
			);
			throw new Error(`schema drift detected for migration ${m.version}`);
		}
	}

	return migrations
		.filter((m) => !applied.has(m.version))
		.sort((a, b) => a.version - b.version);
}

export async function recordFailedMigration(
	db: SqliteConnection,
	version: number,
	error: string,
): Promise<void> {
	await db.run(
		"INSERT OR REPLACE INTO failed_migrations (version, error, failed_at) VALUES (?, ?, ?)",
		[version, error, new Date().toISOString()],
	);
}

export async function applySingleMigration(
	db: SqliteConnection,
	m: Migration,
	timeoutMs = 5000,
): Promise<void> {
	const txPattern = /\b(BEGIN|COMMIT|ROLLBACK)\b/i;
	if (txPattern.test(m.sql)) {
		throw new Error(
			`migration ${m.version} contains transaction control statements — not allowed`,
		);
	}

	const cs = await sha256(m.sql);

	const runMigration = async (): Promise<void> => {
		const insertStmt =
			"INSERT INTO schema_migrations (version, applied_at, checksum) VALUES (?, ?, ?)";
		const insertValues = [m.version, new Date().toISOString(), cs];

		await db.execute("BEGIN TRANSACTION");
		try {
			await db.execute(m.sql);
			await db.run(insertStmt, insertValues);
			await db.execute("COMMIT");
		} catch (err) {
			let rollbackErr: unknown;
			try {
				await db.execute("ROLLBACK");
			} catch (e) {
				rollbackErr = e;
			}
			if (rollbackErr) {
				throw new Error(
					`migration ${m.version} failed: ${err instanceof Error ? err.message : String(err)}. ` +
						`ROLLBACK also failed: ${rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr)}`,
				);
			}
			throw err;
		}
	};

	let timerId: ReturnType<typeof setTimeout>;
	const timeout = new Promise<never>((_, reject) => {
		timerId = setTimeout(
			() => reject(new Error(`migration timeout v${m.version}`)),
			timeoutMs,
		);
	});

	try {
		await Promise.race([runMigration(), timeout]);
	} finally {
		clearTimeout(timerId);
	}
}
