import { computed } from "vue"
import { useTaskStore } from "../stores/useTaskStore"

export function useTaskList() {
  const store = useTaskStore()

  const groups = computed(() => store.resolveGroups(new Date()))

  return {
    overdue: computed(() => groups.value.overdue),
    upcoming: computed(() => groups.value.upcoming),
    noDeadline: computed(() => groups.value.noDeadline),
    completed: computed(() => groups.value.completed),
  }
}
