import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppDependencies } from "../../../app/composables/useAppDependencies";
import type { AppDependencies } from "../../../infrastructure/di/app-dependencies";
import {
	_resetBootstrapPromise,
	bootstrapDependencies,
} from "../../../infrastructure/di/bootstrap-app";
import {
	getAppDependencies,
	provideAppDependencies,
} from "../../../infrastructure/di/provide-app-dependencies";
import { MemoryUnitOfWork } from "../../../infrastructure/memory/unit-of-work/memory-unit-of-work";
import { SqliteUnitOfWork } from "../../../infrastructure/sqlite/unit-of-work/sqlite-unit-of-work";

vi.mock("../../../infrastructure/sqlite/migration-runner", () => ({
	applyMigrations: vi.fn(),
}));

describe("AppDependencies DI", () => {
	beforeEach(() => {
		delete (globalThis as unknown as Record<string, unknown>)[
			"app-dependencies"
		];
	});

	afterEach(() => {
		delete (globalThis as unknown as Record<string, unknown>)[
			"app-dependencies"
		];
	});

	it("provideAppDependencies stores deps on window", () => {
		const fakeDeps = { ports: {} } as unknown as AppDependencies;
		provideAppDependencies(fakeDeps);
		expect(getAppDependencies()).toBe(fakeDeps);
	});

	it("getAppDependencies returns undefined when not set", () => {
		expect(getAppDependencies()).toBeUndefined();
	});

	it("useAppDependencies returns deps when available", () => {
		const fakeDeps = { ports: {} } as unknown as AppDependencies;
		provideAppDependencies(fakeDeps);
		expect(useAppDependencies()).toBe(fakeDeps);
	});

	it("useAppDependencies returns undefined when deps not bootstrapped", () => {
		expect(useAppDependencies()).toBeUndefined();
	});
});

describe("provideAppDependencies cleanup", () => {
	beforeEach(() => {
		delete (globalThis as unknown as Record<string, unknown>)[
			"app-dependencies"
		];
	});

	afterEach(() => {
		delete (globalThis as unknown as Record<string, unknown>)[
			"app-dependencies"
		];
	});

	it("calls close on previous unitOfWork when overwriting", () => {
		const closeSpy = vi.fn();
		const prevDeps = {
			ports: {
				unitOfWork: { close: closeSpy },
			},
		} as unknown as AppDependencies;
		provideAppDependencies(prevDeps);

		const nextDeps = { ports: {} } as unknown as AppDependencies;
		provideAppDependencies(nextDeps);

		expect(closeSpy).toHaveBeenCalledOnce();
		expect(getAppDependencies()).toBe(nextDeps);
	});

	it("does not throw when previous unitOfWork has no close method", () => {
		const prevDeps = {
			ports: {
				unitOfWork: {},
			},
		} as unknown as AppDependencies;
		provideAppDependencies(prevDeps);

		const nextDeps = { ports: {} } as unknown as AppDependencies;
		expect(() => provideAppDependencies(nextDeps)).not.toThrow();
		expect(getAppDependencies()).toBe(nextDeps);
	});
});

describe("bootstrapDependencies", () => {
	beforeEach(() => {
		delete (globalThis as unknown as Record<string, unknown>)[
			"app-dependencies"
		];
		_resetBootstrapPromise();
	});

	afterEach(() => {
		delete (globalThis as unknown as Record<string, unknown>)[
			"app-dependencies"
		];
		vi.restoreAllMocks();
	});

	it("bootstrapPromise singleton: calling twice returns same promise", async () => {
		const openNative = vi.fn().mockRejectedValue(new Error("no native"));
		const p1 = bootstrapDependencies(openNative);
		const p2 = bootstrapDependencies(openNative);
		expect(p1).toBe(p2);
		await p1;
	});

	it("Object.freeze: deps object is frozen", async () => {
		const openNative = vi.fn().mockRejectedValue(new Error("no native"));
		const deps = await bootstrapDependencies(openNative);
		expect(Object.isFrozen(deps)).toBe(true);
	});

	it("Native fallback: when openNativeConnection throws, falls back to MemoryUnitOfWork", async () => {
		const openNative = vi.fn().mockRejectedValue(new Error("no native"));
		const deps = await bootstrapDependencies(openNative);
		expect(deps.ports.unitOfWork).toBeInstanceOf(MemoryUnitOfWork);
	});

	it("Native success: when isNativePlatform=true and openNative resolves, uses SqliteUnitOfWork", async () => {
		const mockConn = {
			execute: vi.fn().mockResolvedValue({ changes: 1 }),
			run: vi.fn().mockResolvedValue({ changes: 1 }),
			query: vi.fn().mockResolvedValue({ values: [] }),
			close: vi.fn().mockResolvedValue(undefined),
		};
		const openNative = vi.fn().mockResolvedValue(mockConn);

		const deps = await bootstrapDependencies(openNative, () => true);
		expect(deps.ports.unitOfWork).toBeInstanceOf(SqliteUnitOfWork);
	});

	it("Concurrent race: two calls during async gap return same promise", async () => {
		let resolveBootstrap: (value: unknown) => void = () => {};
		const openNative = vi.fn().mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveBootstrap = resolve;
				}),
		);

		const p1 = bootstrapDependencies(openNative, () => true);
		const p2 = bootstrapDependencies(openNative, () => true);
		expect(p1).toBe(p2);

		resolveBootstrap({ execute: vi.fn(), close: vi.fn() });
		await p1;
		expect(openNative).toHaveBeenCalledTimes(1);
	});

	it("Native fallback: when applyMigrations throws, falls back to MemoryUnitOfWork", async () => {
		const mockConn = {
			execute: vi.fn().mockResolvedValue({ changes: 1 }),
			run: vi.fn().mockResolvedValue({ changes: 1 }),
			query: vi.fn().mockResolvedValue({ values: [] }),
			close: vi.fn().mockResolvedValue(undefined),
		};
		const openNative = vi.fn().mockResolvedValue(mockConn);

		const { applyMigrations } = await import(
			"../../../infrastructure/sqlite/migration-runner"
		);
		(applyMigrations as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("migration failed"),
		);

		const deps = await bootstrapDependencies(openNative, () => true);
		expect(deps.ports.unitOfWork).toBeInstanceOf(MemoryUnitOfWork);
	});
});
