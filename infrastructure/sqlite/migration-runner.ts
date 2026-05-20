import type { Migration } from "./migrations/index.ts";
import {
	applySingleMigration,
	getPendingMigrations,
} from "./migration-helpers.ts";

export interface SqliteConnection {
	execute(statements: string): Promise<{ changes: number }>;
	run(statement: string, values?: unknown[]): Promise<{ changes: number }>;
	query(statement: string, values?: unknown[]): Promise<{ values: unknown[] }>;
}

export async function applyMigrations(
	db: SqliteConnection,
	migrations: Migration[],
	timeoutMs = 5000,
): Promise<void> {
	const seen = new Set<number>();
	for (const m of migrations) {
		if (seen.has(m.version)) {
			throw new Error(`duplicate migration version: ${m.version}`);
		}
		seen.add(m.version);
	}

	// database.ts sets PRAGMA foreign_keys on open; repeat here defensively
	// because connection pooling may hand us a fresh connection.
	await db.execute("PRAGMA foreign_keys = ON");
	await db.execute("PRAGMA journal_mode = WAL");
	await db.execute("PRAGMA synchronous = NORMAL");

	const pending = await getPendingMigrations(db, migrations);
	for (const m of pending) {
		await applySingleMigration(db, m, timeoutMs);
	}
}
