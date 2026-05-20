import { beforeEach, describe, expect, it } from "vitest";
import { bootstrapApp } from "../../core/use-cases/app/bootstrap-app.use-case";
import { makeDeps } from "./bootstrap-app.fixtures";

describe("bootstrapApp profile + progression", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates default profile when none exists", async () => {
		const deps = makeDeps();
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.profile.id).toBe("default");
		expect(result.state.profile.name).toBe("User");
		expect(deps.ports.profileRepository.save).toHaveBeenCalledTimes(1);
	});

	it("reuses existing profile", async () => {
		const existing = {
			id: "default",
			name: "Alice",
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-01-01T00:00:00Z",
		};
		const deps = makeDeps({ profile: existing });
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.profile).toEqual(existing);
		expect(deps.ports.profileRepository.save).not.toHaveBeenCalled();
	});

	it("creates progression when none exists", async () => {
		const deps = makeDeps();
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.progression.profileId).toBe("default");
		expect(result.state.progression.totalXp).toBe(0);
		expect(deps.ports.progressionRepository.save).toHaveBeenCalledTimes(1);
	});

	it("reuses existing progression", async () => {
		const existing = {
			profileId: "default",
			totalXp: 1500,
			updatedAt: "2025-01-01T00:00:00Z",
		};
		const deps = makeDeps({ progression: existing });
		const result = await bootstrapApp(() => Promise.resolve(deps));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.state.progression).toEqual(existing);
		expect(deps.ports.progressionRepository.save).not.toHaveBeenCalled();
	});
});
