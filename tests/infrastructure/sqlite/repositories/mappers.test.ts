import { describe, expect, it } from "../test-compat.ts";
import type { Profile } from "../../../../core/domain/profile/types";
import type { Progression } from "../../../../core/domain/progression/types";
import type { Task } from "../../../../core/domain/task/types";
import {
	toDomain as profileToDomain,
	toRow as profileToRow,
} from "../../../../infrastructure/sqlite/mappers/profile.mapper.ts";
import {
	toDomain as progressionToDomain,
	toRow as progressionToRow,
} from "../../../../infrastructure/sqlite/mappers/progression.mapper.ts";
import {
	toDomain as taskToDomain,
	toRow as taskToRow,
} from "../../../../infrastructure/sqlite/mappers/task.mapper.ts";

describe("task mapper round-trip", () => {
	const task: Task = {
		id: "t1",
		profileId: "p1",
		title: "Test task",
		description: "desc",
		status: "active",
		priority: "high",
		complexity: "medium",
		complexitySource: "manual",
		dueAt: "2025-01-01T00:00:00Z",
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-02T00:00:00Z",
		completedAt: null,
		archivedAt: null,
	};

	it("preserves all fields domain → row → domain", () => {
		const row = taskToRow(task);
		const restored = taskToDomain(row);
		expect(restored).toEqual(task);
	});
});

describe("profile mapper round-trip", () => {
	const profile: Profile = {
		id: "p1",
		name: "Alice",
		createdAt: "2025-01-01T00:00:00Z",
		updatedAt: "2025-01-02T00:00:00Z",
	};

	it("maps name ↔ display_name", () => {
		const row = profileToRow(profile);
		expect(row.display_name).toBe("Alice");
		const restored = profileToDomain(row);
		expect(restored).toEqual(profile);
	});
});

describe("progression mapper round-trip", () => {
	const progression: Progression = {
		profileId: "p1",
		totalXp: 2500,
		updatedAt: "2025-01-02T00:00:00Z",
	};

	it("maps totalXp ↔ xp_total and computes level", () => {
		const row = progressionToRow(progression);
		expect(row.xp_total).toBe(2500);
		expect(row.level).toBe(3);
		const restored = progressionToDomain(row);
		expect(restored).toEqual(progression);
	});

	it("computes level=1 for zero xp", () => {
		const row = progressionToRow({
			profileId: "p1",
			totalXp: 0,
			updatedAt: "now",
		});
		expect(row.level).toBe(1);
	});
});
