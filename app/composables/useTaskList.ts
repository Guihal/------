import { computed } from "vue";
import { useTaskStore } from "../stores/useTaskStore";
import { useClock } from "./useClock";

export function useTaskList() {
	const store = useTaskStore();
	const { nowIso } = useClock();

	const groups = computed(() => store.resolveGroups(new Date(nowIso())));

	return {
		overdue: computed(() => groups.value.overdue),
		upcoming: computed(() => groups.value.upcoming),
		noDeadline: computed(() => groups.value.noDeadline),
		completed: computed(() => groups.value.completed),
	};
}
