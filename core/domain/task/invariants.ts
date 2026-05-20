import type { Task, TaskComplexity, TaskPriority, TaskStatus } from "./types";

export type StatusTransitionError =
	| { readonly kind: "already_completed" }
	| { readonly kind: "already_archived" }
	| {
			readonly kind: "invalid_transition";
			readonly from: TaskStatus;
			readonly to: TaskStatus;
	  };

export type ValidatePriorityError = { readonly kind: "empty_priority" };

export type DomainResult<T, E> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };

export function canTransitionTo(
	task: Task,
	nextStatus: TaskStatus,
): DomainResult<void, StatusTransitionError> {
	if (task.status === "completed" && nextStatus !== "completed") {
		return { ok: false, error: { kind: "already_completed" } };
	}

	if (task.status === "archived") {
		return { ok: false, error: { kind: "already_archived" } };
	}

	const validTransitions: Record<TaskStatus, readonly TaskStatus[]> = {
		active: ["active", "completed", "archived"],
		completed: ["completed"],
		archived: ["archived"],
	};

	const allowed = validTransitions[task.status];
	if (!allowed.includes(nextStatus)) {
		return {
			ok: false,
			error: { kind: "invalid_transition", from: task.status, to: nextStatus },
		};
	}

	return { ok: true, value: undefined };
}

export function validatePriority(
	priority: string,
): DomainResult<TaskPriority, ValidatePriorityError> {
	if (priority === "") {
		return { ok: false, error: { kind: "empty_priority" } };
	}

	const valid: readonly TaskPriority[] = ["low", "normal", "high"];
	const found = valid.find((v) => v === priority);
	if (found) {
		return { ok: true, value: found };
	}

	return { ok: true, value: "normal" };
}

export function suggestComplexity(params: {
	readonly priority: TaskPriority;
	readonly title: string;
	readonly description: string | null;
	readonly dueAt: string | null;
}): TaskComplexity {
	const hasDescription =
		params.description !== null && params.description.length > 0;
	const titleLen = params.title.length;
	const descLen = params.description?.length ?? 0;

	if (params.priority === "high" && hasDescription && params.dueAt !== null) {
		return "large";
	}

	if (params.priority === "high") {
		return "medium";
	}

	if (titleLen > 60 || descLen > 160) {
		return "medium";
	}

	if (titleLen > 20 || hasDescription) {
		return "small";
	}

	return "tiny";
}
