import { beforeEach, describe, expect, it } from "../test-compat.ts";
import { Database } from "../bun-sqlite.ts";
import {
	applyMigrations,
	type SqliteConnection,
} from "../../../../infrastructure/sqlite/migration-runner.ts";
import { migrations } from "../../../../infrastructure/sqlite/migrations/index.ts";
import { SqliteUnitOfWork } from "../../../../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work.ts";
import { createConn, profileFixture, taskFixture } from "./fixtures.ts";

describe("sqlite unit of work — edge", () => {
	let db: Database;
	let conn: ReturnType<typeof createConn>;
	let uow: SqliteUnitOfWork;

	beforeEach(async () => {
		db = new Database(":memory:");
		conn = createConn(db);
		await applyMigrations(conn, migrations);
		uow = new SqliteUnitOfWork(conn);
	});

	it("rejects nested run() calls", async () => {
		await expect(
			uow.run(async () => {
				await uow.profiles.save(profileFixture);
				await uow.run(async () => {
					await uow.tasks.save(taskFixture);
				});
			}),
		).rejects.toThrow("Nested transactions are not supported");

		expect(await uow.profiles.findById("p1")).toBeNull();
		expect(await uow.tasks.findById("p1", "t1")).toBeNull();
	});

	it("does not mask original error when BEGIN fails", async () => {
		const brokenConn = {
			execute: async () => {
				throw new Error("db locked");
			},
			run: conn.run,
			query: conn.query,
		};
		const brokenUow = new SqliteUnitOfWork(brokenConn);

		await expect(
			brokenUow.run(async () => {
				await brokenUow.profiles.save(profileFixture);
			}),
		).rejects.toThrow("db locked");
	});

	it("preserves original error when ROLLBACK fails", async () => {
		let _callCount = 0;
		const rollbackFailingConn = {
			execute: async (sql: string) => {
				_callCount++;
				if (sql === "BEGIN TRANSACTION") {
					db.exec(sql);
					return { changes: db.changes };
				}
				if (sql === "ROLLBACK") {
					throw new Error("rollback failed");
				}
				db.exec(sql);
				return { changes: db.changes };
			},
			run: conn.run,
			query: conn.query,
		};
		const uow = new SqliteUnitOfWork(rollbackFailingConn);

		await expect(
			uow.run(async () => {
				await uow.profiles.save(profileFixture);
				throw new Error("original boom");
			}),
		).rejects.toThrow("original boom");
	});

	it("serializes concurrent run() calls", async () => {
		const order: string[] = [];

		const p1 = uow.run(async () => {
			order.push("a-begin");
			await new Promise((r) => setTimeout(r, 20));
			order.push("a-end");
			return "a";
		});

		const p2 = uow.run(async () => {
			order.push("b-begin");
			await new Promise((r) => setTimeout(r, 10));
			order.push("b-end");
			return "b";
		});

		const [r1, r2] = await Promise.all([p1, p2]);
		expect(r1).toBe("a");
		expect(r2).toBe("b");

		// one transaction must fully complete before the other starts
		const aFirst = order.indexOf("a-begin") < order.indexOf("b-begin");
		if (aFirst) {
			expect(order).toEqual(["a-begin", "a-end", "b-begin", "b-end"]);
		} else {
			expect(order).toEqual(["b-begin", "b-end", "a-begin", "a-end"]);
		}
	});
});
