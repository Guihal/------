import { applyLevelProgress } from "../../core/use-cases/apply-level-progress.use-case";
import { resolveTaskList } from "../../core/use-cases/resolve-task-list.use-case";
import { suggestTaskComplexity } from "../../core/use-cases/suggest-task-complexity.use-case";
import { archiveTask } from "../../core/use-cases/tasks/archive-task.use-case";
import { completeTask } from "../../core/use-cases/tasks/complete-task.use-case";
import { createTask } from "../../core/use-cases/tasks/create-task.use-case";
import { grantTaskXpWithinTransaction } from "../../core/use-cases/tasks/grant-task-xp.use-case";
import { MemoryUnitOfWork } from "../memory/unit-of-work/memory-unit-of-work";
import type { SqliteConnection } from "../sqlite/migration-runner";
import { applyMigrations } from "../sqlite/migration-runner";
import { migrations } from "../sqlite/migrations";
import { SqliteUnitOfWork } from "../sqlite/unit-of-work/sqlite-unit-of-work";
import type { AppDependencies } from "./app-dependencies";

async function openNativeConnection(): Promise<SqliteConnection> {
	const { CapacitorSQLite, SQLiteConnection } = await import(
		"@capacitor-community/sqlite"
	);
	const sqlite = new SQLiteConnection(CapacitorSQLite);
	const conn = await sqlite.createConnection(
		"app_db",
		false,
		"no-encryption",
		1,
		false,
	);
	await conn.open();
	return conn as unknown as SqliteConnection;
}

let bootstrapPromise: Promise<AppDependencies> | null = null;

const existingDeps = (globalThis as unknown as Record<string, unknown>)[
	"app-dependencies"
];
if (existingDeps) {
	bootstrapPromise = Promise.resolve(existingDeps as AppDependencies);
}

export function _resetBootstrapPromise(): void {
	bootstrapPromise = null;
}

export function _getBootstrapPromise(): Promise<AppDependencies> | null {
	return bootstrapPromise;
}

export function bootstrapDependencies(
	openNative = openNativeConnection,
	isNativePlatform?: () => boolean,
): Promise<AppDependencies> {
	if (bootstrapPromise) {
		return bootstrapPromise;
	}

	const p = doBootstrap(openNative, isNativePlatform);
	if (!bootstrapPromise) {
		bootstrapPromise = p;
	}
	return bootstrapPromise;
}

async function doBootstrap(
	openNative: () => Promise<SqliteConnection>,
	isNativePlatform?: () => boolean,
): Promise<AppDependencies> {
	let isNative = false;
	if (isNativePlatform) {
		try {
			isNative = isNativePlatform();
		} catch {
			isNative = false;
		}
	} else {
		try {
			const cap = (await import("@capacitor/core")).Capacitor;
			try {
				isNative = cap.isNativePlatform();
			} catch {
				isNative = false;
			}
		} catch {
			isNative = false;
		}
	}

	let uow: SqliteUnitOfWork | MemoryUnitOfWork;

	if (isNative) {
		let conn: SqliteConnection | undefined;
		try {
			conn = await openNative();
			await applyMigrations(conn, migrations);
			uow = new SqliteUnitOfWork(conn);
		} catch (e) {
			console.error(
				"[bootstrap] Native DB setup failed, falling back to memory:",
				e,
			);
			if (conn) {
				try {
					await conn.close();
				} catch {
					// ignore close errors during cleanup
				}
			}
			uow = new MemoryUnitOfWork();
		}
	} else {
		uow = new MemoryUnitOfWork();
	}

	const ports = {
		clock: { nowIso: () => new Date().toISOString() },
		idGenerator: { generateId: () => crypto.randomUUID() },
		taskRepository: uow.tasks,
		profileRepository: uow.profiles,
		progressionRepository: uow.progressions,
		unitOfWork: uow,
	};

	const deps: AppDependencies = {
		ports,
		useCases: {
			createTask: (input) => createTask(ports.taskRepository, input),
			completeTask: (input) => completeTask(ports.unitOfWork, input),
			archiveTask: (input) => archiveTask(ports.taskRepository, input),
			grantTaskXp: (input) =>
				grantTaskXpWithinTransaction(ports.unitOfWork, input),
			applyLevelProgress,
			resolveTaskList,
			suggestTaskComplexity,
		},
	};

	return Object.freeze(deps);
}
