import { ref } from "vue";

export function useTaskLoading() {
	const loadingTaskIds = ref<Set<string>>(new Set());

	function isLoading(taskId: string): boolean {
		return loadingTaskIds.value.has(taskId);
	}

	function start(taskId: string) {
		loadingTaskIds.value.add(taskId);
	}

	function stop(taskId: string) {
		loadingTaskIds.value.delete(taskId);
	}

	return {
		isLoading,
		start,
		stop,
	};
}
