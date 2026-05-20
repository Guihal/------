import { describe, expect, it } from "vitest";
import type { Profile } from "../../../core/domain/profile/types";

describe("Profile type compatibility", () => {
	it("accepts valid profile shape", () => {
		const profile: Profile = {
			id: "p1",
			name: "Alice",
			createdAt: "2026-05-19T00:00:00Z",
			updatedAt: "2026-05-19T00:00:00Z",
		};

		expect(profile.id).toBe("p1");
		expect(profile.name).toBe("Alice");
	});
});
