<script setup lang="ts">
import type { Task } from "../../../core/domain/task/types"
import TaskCard from "./TaskCard.vue"

const props = defineProps<{
  title: string
  tasks: readonly Task[]
  emptyText: string
  loadingTaskId?: (taskId: string) => boolean
}>()

const emit = defineEmits<{
  complete: [taskId: string]
  archive: [taskId: string]
}>()
</script>

<template>
  <section class="task-group" :data-testid="`group-${props.title.toLowerCase().replace(/\s+/g, '-')}`">
    <h2 class="group-title">{{ props.title }} ({{ props.tasks.length }})</h2>
    <div v-if="props.tasks.length === 0" class="group-empty">
      {{ props.emptyText }}
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
  padding: 24px 16px;
  text-align: center;
  color: #6c7086;
  font-size: 14px;
  background: #181825;
  border-radius: 12px;
  border: 1px dashed #313244;
}

.group-list {
  display: flex;
  flex-direction: column;
}
</style>
