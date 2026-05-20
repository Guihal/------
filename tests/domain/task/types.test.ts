import { describe, expect, it } from "vitest";
import type {
	Task,
	TaskComplexity,
	TaskComplexitySource,
	TaskPriority,
	TaskStatus,
} from "../../../core/domain/task/types";

describe("Task type compatibility", () => {
	it("accepts valid task shape", () => {
		const task: Task = {
			id: "t1",
			profileId: "p1",
			title: "Test task",
			description: null,
			status: "active",
			priority: "normal",
			complexity: "small",
			complexitySource: "suggested",
			dueAt: null,
			createdAt: "2026-05-19T00:00:00Z",
			updatedAt: "2026-05-19T00:00:00Z",
			completedAt: null,
			archivedAt: null,
		};

		expect(task.id).toBe("t1");
		expect(task.status).toBe("active");
	});

	it("TaskStatus allows only valid literals", () => {
		const statuses: TaskStatus[] = ["active", "completed", "archived"];
		expect(statuses).toContain("active");
		expect(statuses).toContain("completed");
		expect(statuses).toContain("archived");
	});

	it("TaskPriority allows only valid literals", () => {
		const priorities: TaskPriority[] = ["low", "normal", "high"];
		expect(priorities).toContain("low");
		expect(priorities).toContain("normal");
		expect(priorities).toContain("high");
	});

	it("TaskComplexity allows only valid literals", () => {
		const complexities: TaskComplexity[] = ["tiny", "small", "medium", "large"];
		expect(complexities).toContain("tiny");
		expect(complexities).toContain("small");
		expect(complexities).toContain("medium");
		expect(complexities).toContain("large");
	});

	it("TaskComplexitySource allows only valid literals", () => {
		const sources: TaskComplexitySource[] = ["suggested", "manual"];
		expect(sources).toContain("suggested");
		expect(sources).toContain("manual");
	});
});
