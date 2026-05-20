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

function createMemoryDeps(): AppDependencies {
	const uow = new MemoryUnitOfWork();

	const ports = {
		clock: { nowIso: () => new Date().toISOString() },
		idGenerator: {
			generateId: () => {
				const bytes = new Uint8Array(16);
				crypto.getRandomValues(bytes);
				bytes[6] = (bytes[6] & 0x0f) | 0x40;
				bytes[8] = (bytes[8] & 0x3f) | 0x80;
				const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
				return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
			},
		},
		taskRepository: uow.tasks,
		profileRepository: uow.profiles,
		progressionRepository: uow.progressions,
		unitOfWork: uow,
	};

	return Object.freeze({
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
	});
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

export function bootstrapDependenciesSync(): AppDependencies {
	const existing = (globalThis as unknown as Record<string, unknown>)[
		"app-dependencies"
	] as AppDependencies | undefined;
	if (existing) return existing;
	const deps = createMemoryDeps();
	(globalThis as unknown as Record<string, unknown>)["app-dependencies"] = deps;
	return deps;
}

async function doBootstrap(
	openNative: () => Promise<SqliteConnection>,
	isNativePlatform?: () => boolean,
): Promise<AppDependencies> {
	const deps = createMemoryDeps();
	(globalThis as unknown as Record<string, unknown>)["app-dependencies"] = deps;

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

	if (isNative) {
		let conn: SqliteConnection | undefined;
		try {
			conn = await openNative();
			await applyMigrations(conn, migrations);
			const uow = new SqliteUnitOfWork(conn);
			const ports = {
				clock: { nowIso: () => new Date().toISOString() },
				idGenerator: {
					generateId: () => {
						const bytes = new Uint8Array(16);
						crypto.getRandomValues(bytes);
						bytes[6] = (bytes[6] & 0x0f) | 0x40;
						bytes[8] = (bytes[8] & 0x3f) | 0x80;
						const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
						return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
					},
				},
				taskRepository: uow.tasks,
				profileRepository: uow.profiles,
				progressionRepository: uow.progressions,
				unitOfWork: uow,
			};
			const nativeDeps = Object.freeze({
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
			});
			(globalThis as unknown as Record<string, unknown>)["app-dependencies"] = nativeDeps;
			return nativeDeps;
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
		}
	}

	return deps;
}
