import { Database } from "../bun-sqlite.ts";
import type { SqliteConnection } from "../../../../infrastructure/sqlite/migration-runner.ts";
import type { Profile } from "../../../../core/domain/profile/types";
import type { Task } from "../../../../core/domain/task/types";

export function createConn(db: Database): SqliteConnection {
	return {
		execute: async (s: string) => {
			db.exec(s);
			return { changes: db.changes };
		},
		run: async (s: string, v?: unknown[]) => {
			const stmt = db.prepare(s);
			const info = stmt.run(...(v ?? []));
			stmt.finalize();
			return { changes: Number(info.changes) };
		},
		query: async (s: string, v?: unknown[]) => {
			const stmt = db.prepare(s);
			const rows = stmt.all(...(v ?? [])) as unknown[];
			stmt.finalize();
			return { values: rows };
		},
	};
}

export const profileFixture: Profile = {
	id: "p1",
	name: "Alice",
	createdAt: "2025-01-01T00:00:00Z",
	updatedAt: "2025-01-01T00:00:00Z",
};

export const taskFixture: Task = {
	id: "t1",
	profileId: "p1",
	title: "T",
	description: null,
	status: "active",
	priority: "normal",
	complexity: "small",
	complexitySource: "suggested",
	dueAt: null,
	createdAt: "2025-01-01T00:00:00Z",
	updatedAt: "2025-01-01T00:00:00Z",
	completedAt: null,
	archivedAt: null,
};
