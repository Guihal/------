const isVitest =
	typeof process !== "undefined" && !!process.env.VITEST_WORKER_ID;

const mod = isVitest
	? await import("vitest")
	: await import("bun:test");

export const { beforeEach, describe, expect, it } = mod;
