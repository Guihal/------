import { ref, watch } from "vue";
import type { TaskPriority } from "../../core/domain/task/types";
import { useTaskStore } from "../stores/useTaskStore";

export type TaskComplexity = "tiny" | "small" | "medium" | "large";

export function useTaskForm() {
	const taskStore = useTaskStore();

	const suggestedComplexity = ref<TaskComplexity | null>(null);

	const formDraft = ref({
		title: "",
		description: "",
		priority: "normal" as TaskPriority,
		dueAt: "",
	});

	function updateSuggestion() {
		const d = formDraft.value;
		if (d.title.trim().length > 0) {
			suggestedComplexity.value = taskStore.suggestComplexity({
				title: d.title,
				description: d.description || null,
				priority: d.priority,
				dueAt: d.dueAt || null,
			});
		} else {
			suggestedComplexity.value = null;
		}
	}

	watch(() => formDraft.value.title, updateSuggestion);
	watch(() => formDraft.value.description, updateSuggestion);
	watch(() => formDraft.value.priority, updateSuggestion);
	watch(() => formDraft.value.dueAt, updateSuggestion);

	function reset() {
		formDraft.value = {
			title: "",
			description: "",
			priority: "normal",
			dueAt: "",
		};
		suggestedComplexity.value = null;
	}

	return {
		formDraft,
		suggestedComplexity,
		updateSuggestion,
		reset,
	};
}
