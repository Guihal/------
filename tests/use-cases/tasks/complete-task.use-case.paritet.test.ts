import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import type { Profile } from "../../../core/domain/profile/types";
import type { Progression } from "../../../core/domain/progression/types";
import type { Task } from "../../../core/domain/task/types";
import type { UnitOfWorkPort } from "../../../core/ports/unit-of-work.port";
import { completeTask } from "../../../core/use-cases/tasks/complete-task.use-case";
import { MemoryUnitOfWork } from "../../../infrastructure/memory/unit-of-work/memory-unit-of-work";
import {
	applyMigrations,
	type SqliteConnection,
} from "../../../infrastructure/sqlite/migration-runner.ts";
import { migrations } from "../../../infrastructure/sqlite/migrations/index.ts";
import { SqliteUnitOfWork } from "../../../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work.ts";

function createConn(db: Database): SqliteConnection {
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

function makeTask(
	overrides: Partial<Task> & Pick<Task, "id" | "status">,
): Task {
	return {
		id: overrides.id,
		profileId: overrides.profileId ?? "p1",
		title: overrides.title ?? "Task",
		description: overrides.description ?? null,
		status: overrides.status,
		priority: overrides.priority ?? "normal",
		complexity: overrides.complexity ?? "small",
		complexitySource: "suggested",
		dueAt: overrides.dueAt ?? null,
		createdAt: overrides.createdAt ?? "2026-05-01T00:00:00Z",
		updatedAt: overrides.updatedAt ?? "2026-05-01T00:00:00Z",
		completedAt: overrides.completedAt ?? null,
		archivedAt: overrides.archivedAt ?? null,
	};
}

const profile: Profile = {
	id: "p1",
	name: "Alice",
	createdAt: "2026-05-01T00:00:00Z",
	updatedAt: "2026-05-01T00:00:00Z",
};

async function seed(
	uow: UnitOfWorkPort,
	task: Task,
	progression: Progression,
): Promise<void> {
	await uow.profiles.save(profile);
	await uow.tasks.save(task);
	await uow.progressions.save(progression);
}

function expectHappy(result: Awaited<ReturnType<typeof completeTask>>) {
	expect(result.task.status).toBe("completed");
	expect(result.xpGranted).toBe(55);
	expect(result.previousLevel).toBe(0);
	expect(result.newLevel).toBe(0);
	expect(result.didLevelUp).toBe(false);
	expect(result.xpToNextLevel).toBe(445);
}

describe("completeTask parity — memory vs sqlite", () => {
	it("memory: happy path", async () => {
		const uow = new MemoryUnitOfWork();
		const task = makeTask({
			id: "t1",
			status: "active",
			complexity: "medium",
			priority: "normal",
		});
		await seed(uow, task, {
			profileId: "p1",
			totalXp: 500,
			updatedAt: "2026-05-01T00:00:00Z",
		});
		const result = await completeTask(uow, {
			taskId: "t1",
			profileId: "p1",
			now: "2026-05-10T00:00:00Z",
		});
		expectHappy(result);
		expect((await uow.tasks.findById("p1", "t1"))?.status).toBe("completed");
		expect((await uow.progressions.findById("p1"))?.totalXp).toBe(555);
	});

	it("memory: rollback on error", async () => {
		const uow = new MemoryUnitOfWork();
		const task = makeTask({ id: "t1", status: "active" });
		await seed(uow, task, {
			profileId: "p1",
			totalXp: 100,
			updatedAt: "2026-05-01T00:00:00Z",
		});
		const brokenUow: UnitOfWorkPort = {
			tasks: uow.tasks,
			profiles: uow.profiles,
			progressions: {
				async findById(id: string) {
					return uow.progressions.findById(id);
				},
				async save() {
					throw new Error("db failure");
				},
			},
			async run<T>(cb: () => Promise<T>): Promise<T> {
				return uow.run(cb);
			},
		};
		await expect(
			completeTask(brokenUow, {
				taskId: "t1",
				profileId: "p1",
				now: "2026-05-10T00:00:00Z",
			}),
		).rejects.toThrow("db failure");
		expect((await uow.tasks.findById("p1", "t1"))?.status).toBe("active");
		expect((await uow.progressions.findById("p1"))?.totalXp).toBe(100);
	});
});

if (typeof Bun !== "undefined") {
	describe("completeTask parity — sqlite", () => {
		let db: Database, conn: SqliteConnection, uow: SqliteUnitOfWork;
		beforeEach(async () => {
			db = new Database(":memory:");
			conn = createConn(db);
			await applyMigrations(conn, migrations);
			uow = new SqliteUnitOfWork(conn);
		});

		it("sqlite: happy path", async () => {
			const task = makeTask({
				id: "t1",
				status: "active",
				complexity: "medium",
				priority: "normal",
			});
			await seed(uow, task, {
				profileId: "p1",
				totalXp: 500,
				updatedAt: "2026-05-01T00:00:00Z",
			});
			const result = await completeTask(uow, {
				taskId: "t1",
				profileId: "p1",
				now: "2026-05-10T00:00:00Z",
			});
			expectHappy(result);
			expect((await uow.tasks.findById("p1", "t1"))?.status).toBe("completed");
			expect((await uow.progressions.findById("p1"))?.totalXp).toBe(555);
		});

		it("sqlite: rollback on error", async () => {
			const task = makeTask({ id: "t1", status: "active" });
			await seed(uow, task, {
				profileId: "p1",
				totalXp: 100,
				updatedAt: "2026-05-01T00:00:00Z",
			});
			const brokenUow: UnitOfWorkPort = {
				tasks: uow.tasks,
				profiles: uow.profiles,
				progressions: {
					async findById(id: string) {
						return uow.progressions.findById(id);
					},
					async save() {
						throw new Error("db failure");
					},
				},
				async run<T>(cb: () => Promise<T>): Promise<T> {
					return uow.run(cb);
				},
			};
			await expect(
				completeTask(brokenUow, {
					taskId: "t1",
					profileId: "p1",
					now: "2026-05-10T00:00:00Z",
				}),
			).rejects.toThrow("db failure");
			expect((await uow.tasks.findById("p1", "t1"))?.status).toBe("active");
			expect((await uow.progressions.findById("p1"))?.totalXp).toBe(100);
		});
	});
}
