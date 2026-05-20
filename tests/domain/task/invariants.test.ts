import { describe, expect, it } from "vitest";
import {
	canTransitionTo,
	suggestComplexity,
	validatePriority,
} from "../../../core/domain/task/invariants";
import type { Task } from "../../../core/domain/task/types";

function makeTask(status: Task["status"]): Task {
	return {
		id: "t1",
		profileId: "p1",
		title: "Test",
		description: null,
		status,
		priority: "normal",
		complexity: "small",
		complexitySource: "suggested",
		dueAt: null,
		createdAt: "2026-05-19T00:00:00Z",
		updatedAt: "2026-05-19T00:00:00Z",
		completedAt: null,
		archivedAt: null,
	};
}

describe("canTransitionTo", () => {
	it("active -> completed: ok", () => {
		const result = canTransitionTo(makeTask("active"), "completed");
		expect(result.ok).toBe(true);
	});

	it("active -> archived: ok", () => {
		const result = canTransitionTo(makeTask("active"), "archived");
		expect(result.ok).toBe(true);
	});

	it("active -> active: ok (no-op)", () => {
		const result = canTransitionTo(makeTask("active"), "active");
		expect(result.ok).toBe(true);
	});

	it("completed -> active: fail (already_completed)", () => {
		const result = canTransitionTo(makeTask("completed"), "active");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe("already_completed");
		}
	});

	it("completed -> archived: fail (already_completed)", () => {
		const result = canTransitionTo(makeTask("completed"), "archived");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe("already_completed");
		}
	});

	it("completed -> completed: ok (idempotent)", () => {
		const result = canTransitionTo(makeTask("completed"), "completed");
		expect(result.ok).toBe(true);
	});

	it("archived -> any: fail (already_archived)", () => {
		const result = canTransitionTo(makeTask("archived"), "active");
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe("already_archived");
		}
	});
});

describe("validatePriority", () => {
	it("accepts low", () => {
		const result = validatePriority("low");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("low");
	});

	it("accepts normal", () => {
		const result = validatePriority("normal");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("normal");
	});

	it("accepts high", () => {
		const result = validatePriority("high");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("high");
	});

	it("rejects empty string", () => {
		const result = validatePriority("");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.kind).toBe("empty_priority");
	});

	it("falls back to normal for unknown value", () => {
		const result = validatePriority("urgent");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe("normal");
	});
});

describe("suggestComplexity", () => {
	it("rule 1: high + description + dueAt -> large", () => {
		const result = suggestComplexity({
			priority: "high",
			title: "Short",
			description: "Some description",
			dueAt: "2026-05-20T00:00:00Z",
		});
		expect(result).toBe("large");
	});

	it("rule 2: high without description/dueAt -> medium", () => {
		const result = suggestComplexity({
			priority: "high",
			title: "Short",
			description: null,
			dueAt: null,
		});
		expect(result).toBe("medium");
	});

	it("rule 3: title > 60 -> medium", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "a".repeat(61),
			description: null,
			dueAt: null,
		});
		expect(result).toBe("medium");
	});

	it("rule 3: description > 160 -> medium", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "Short",
			description: "b".repeat(161),
			dueAt: null,
		});
		expect(result).toBe("medium");
	});

	it("rule 4: title > 20 -> small", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "a".repeat(21),
			description: null,
			dueAt: null,
		});
		expect(result).toBe("small");
	});

	it("rule 4: description exists -> small", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "Short",
			description: "Some desc",
			dueAt: null,
		});
		expect(result).toBe("small");
	});

	it("rule 5: tiny fallback", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "Tiny",
			description: null,
			dueAt: null,
		});
		expect(result).toBe("tiny");
	});

	it("rule 1 takes precedence over rule 2", () => {
		const result = suggestComplexity({
			priority: "high",
			title: "Short",
			description: "Desc",
			dueAt: "2026-05-20T00:00:00Z",
		});
		expect(result).toBe("large");
	});

	it("rule 2 takes precedence over rule 3", () => {
		const result = suggestComplexity({
			priority: "high",
			title: "a".repeat(100),
			description: "b".repeat(200),
			dueAt: null,
		});
		expect(result).toBe("medium");
	});

	it("rule 3 takes precedence over rule 4", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "a".repeat(61),
			description: "Desc",
			dueAt: null,
		});
		expect(result).toBe("medium");
	});

	it("rule 4 takes precedence over rule 5", () => {
		const result = suggestComplexity({
			priority: "normal",
			title: "a".repeat(21),
			description: null,
			dueAt: null,
		});
		expect(result).toBe("small");
	});
});
