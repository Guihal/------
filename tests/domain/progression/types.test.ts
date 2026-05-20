import { describe, expect, it } from "vitest";
import type { Progression } from "../../../core/domain/progression/types";

describe("Progression type compatibility", () => {
	it("accepts valid progression shape", () => {
		const progression: Progression = {
			profileId: "p1",
			totalXp: 0,
			updatedAt: "2026-05-19T00:00:00Z",
		};

		expect(progression.profileId).toBe("p1");
		expect(progression.totalXp).toBe(0);
	});
});
