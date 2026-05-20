import { beforeEach, describe, expect, it } from "../test-compat.ts";
import { Database } from "../bun-sqlite.ts";
import {
	applyMigrations,
	type SqliteConnection,
} from "../../../../infrastructure/sqlite/migration-runner.ts";
import { migrations } from "../../../../infrastructure/sqlite/migrations/index.ts";
import { SqliteUnitOfWork } from "../../../../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work.ts";
import { createConn, profileFixture, taskFixture } from "./fixtures.ts";
import type { Progression } from "../../../../core/domain/progression/types";

describe("sqlite unit of work — transaction", () => {
	let db: Database;
	let conn: ReturnType<typeof createConn>;
	let uow: SqliteUnitOfWork;

	beforeEach(async () => {
		db = new Database(":memory:");
		conn = createConn(db);
		await applyMigrations(conn, migrations);
		uow = new SqliteUnitOfWork(conn);
	});

	it("commits multi-entity operation", async () => {
		await uow.run(async () => {
			await uow.profiles.save(profileFixture);
			await uow.tasks.save(taskFixture);
		});
		expect(await uow.profiles.findById("p1")).toEqual(profileFixture);
		expect(await uow.tasks.findById("p1", "t1")).toEqual(taskFixture);
	});

	it("rolls back on error leaving no partial state", async () => {
		await expect(
			uow.run(async () => {
				await uow.profiles.save(profileFixture);
				await uow.tasks.save(taskFixture);
				throw new Error("boom");
			}),
		).rejects.toThrow("boom");

		expect(await uow.profiles.findById("p1")).toBeNull();
		expect(await uow.tasks.findById("p1", "t1")).toBeNull();
	});

	it("simulates completeTask chain: save task + save progression", async () => {
		await uow.profiles.save(profileFixture);
		const prog: Progression = {
			profileId: "p1",
			totalXp: 0,
			updatedAt: "2025-01-01T00:00:00Z",
		};
		await uow.progressions.save(prog);

		const completedTask = {
			...taskFixture,
			status: "completed" as const,
			updatedAt: "2025-01-02T00:00:00Z",
			completedAt: "2025-01-02T00:00:00Z",
		};
		const updatedProg: Progression = {
			profileId: "p1",
			totalXp: 500,
			updatedAt: "2025-01-02T00:00:00Z",
		};

		await uow.run(async () => {
			await uow.tasks.save(completedTask);
			await uow.progressions.save(updatedProg);
		});

		expect(await uow.tasks.findById("p1", "t1")).toEqual(completedTask);
		expect(await uow.progressions.findById("p1")).toEqual(updatedProg);
	});

	it("rolls back completeTask chain on error", async () => {
		await uow.profiles.save(profileFixture);
		const prog: Progression = {
			profileId: "p1",
			totalXp: 0,
			updatedAt: "2025-01-01T00:00:00Z",
		};
		await uow.progressions.save(prog);
		await uow.tasks.save(taskFixture);

		const completedTask = {
			...taskFixture,
			status: "completed" as const,
			updatedAt: "2025-01-02T00:00:00Z",
			completedAt: "2025-01-02T00:00:00Z",
		};
		const updatedProg: Progression = {
			profileId: "p1",
			totalXp: 500,
			updatedAt: "2025-01-02T00:00:00Z",
		};

		await expect(
			uow.run(async () => {
				await uow.tasks.save(completedTask);
				await uow.progressions.save(updatedProg);
				throw new Error("boom");
			}),
		).rejects.toThrow("boom");

		expect((await uow.tasks.findById("p1", "t1"))?.status).toBe("active");
		expect((await uow.progressions.findById("p1"))?.totalXp).toBe(0);
	});
});
