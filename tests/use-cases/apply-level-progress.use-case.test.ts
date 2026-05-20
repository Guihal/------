import { describe, expect, it } from "vitest";
import type { Progression } from "../../core/domain/progression/types";
import { applyLevelProgress } from "../../core/use-cases/apply-level-progress.use-case";

function makeProgression(totalXp: number): Progression {
	return {
		profileId: "p1",
		totalXp,
		updatedAt: "2026-05-01T00:00:00Z",
	};
}

describe("applyLevelProgress", () => {
	it("adds xp and keeps level when under threshold", () => {
		const current = makeProgression(500);
		const result = applyLevelProgress(current, 200, "2026-05-10T00:00:00Z");

		expect(result.progression.totalXp).toBe(700);
		expect(result.previousLevel).toBe(0);
		expect(result.newLevel).toBe(0);
		expect(result.didLevelUp).toBe(false);
		expect(result.xpToNextLevel).toBe(300);
		expect(result.progression.updatedAt).toBe("2026-05-10T00:00:00Z");
	});

	it("crosses level boundary", () => {
		const current = makeProgression(900);
		const result = applyLevelProgress(current, 200, "2026-05-10T00:00:00Z");

		expect(result.progression.totalXp).toBe(1100);
		expect(result.previousLevel).toBe(0);
		expect(result.newLevel).toBe(1);
		expect(result.didLevelUp).toBe(true);
		expect(result.xpToNextLevel).toBe(900);
	});

	it("lands exactly on level boundary", () => {
		const current = makeProgression(500);
		const result = applyLevelProgress(current, 500, "2026-05-10T00:00:00Z");

		expect(result.progression.totalXp).toBe(1000);
		expect(result.previousLevel).toBe(0);
		expect(result.newLevel).toBe(1);
		expect(result.didLevelUp).toBe(true);
		expect(result.xpToNextLevel).toBe(1000);
	});

	it("handles zero xp delta", () => {
		const current = makeProgression(1500);
		const result = applyLevelProgress(current, 0, "2026-05-10T00:00:00Z");

		expect(result.progression.totalXp).toBe(1500);
		expect(result.previousLevel).toBe(1);
		expect(result.newLevel).toBe(1);
		expect(result.didLevelUp).toBe(false);
	});

	it("multi-level up", () => {
		const current = makeProgression(500);
		const result = applyLevelProgress(current, 2500, "2026-05-10T00:00:00Z");

		expect(result.progression.totalXp).toBe(3000);
		expect(result.previousLevel).toBe(0);
		expect(result.newLevel).toBe(3);
		expect(result.didLevelUp).toBe(true);
		expect(result.xpToNextLevel).toBe(1000);
	});
});
