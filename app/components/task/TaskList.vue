<script setup lang="ts">
import type { Task } from "../../../core/domain/task/types"
import TaskCard from "./TaskCard.vue"
import EmptyState from "../ui/EmptyState.vue"
import { computed } from "vue"

const props = defineProps<{
  title: string
  tasks: readonly Task[]
  emptyText: string
  emptyDescription?: string
  loadingTaskId?: (taskId: string) => boolean
}>()

const emit = defineEmits<{
  complete: [taskId: string]
  archive: [taskId: string]
}>()

const emptyStateProps = computed(() => {
  const base: { title: string; description?: string } = { title: props.emptyText }
  if (props.emptyDescription !== undefined) {
    base.description = props.emptyDescription
  }
  return base
})
</script>

<template>
  <section class="task-group" :data-testid="`group-${props.title.toLowerCase().replace(/\s+/g, '-')}`">
    <h2 class="group-title">{{ props.title }} ({{ props.tasks.length }})</h2>
    <div v-if="props.tasks.length === 0" class="group-empty">
      <EmptyState v-bind="emptyStateProps" />
    </div>
    <div v-else class="group-list">
      <TaskCard
        v-for="task in props.tasks"
        :key="task.id"
        :task="task"
        :is-loading="props.loadingTaskId?.(task.id) ?? false"
        @complete="emit('complete', $event)"
        @archive="emit('archive', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.task-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a6adc8;
  margin: 0 0 12px 0;
  padding: 0 4px;
}

.group-empty {
  /* wrapper keeps padding/radius from EmptyState; minimal override */
}

.group-list {
  display: flex;
  flex-direction: column;
}
</style>
