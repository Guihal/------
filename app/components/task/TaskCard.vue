<script setup lang="ts">
import type { Task } from "../../../core/domain/task/types"

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  complete: [taskId: string]
  archive: [taskId: string]
}>()

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("en-US") : ""
}

const pcls: Record<Task["priority"], string> = {
  low: "priority-low",
  normal: "priority-normal",
  high: "priority-high",
}
</script>

<template>
  <div class="task-card" data-testid="task-card">
    <div class="task-header">
      <h3 class="task-title">{{ props.task.title }}</h3>
      <span class="task-priority" :class="pcls[props.task.priority]">{{ props.task.priority }}</span>
    </div>
    <div class="task-meta">
      <span class="task-complexity">{{ props.task.complexity }}</span>
      <span v-if="props.task.dueAt" class="task-deadline">{{ fmtDate(props.task.dueAt) }}</span>
    </div>
    <div v-if="props.task.description" class="task-description">{{ props.task.description }}</div>
    <div v-if="props.task.status === 'active'" class="task-actions">
      <button class="btn-complete" data-testid="btn-complete" @click="emit('complete', props.task.id)">Complete</button>
      <button class="btn-archive" data-testid="btn-archive" @click="emit('archive', props.task.id)">Archive</button>
    </div>
  </div>
</template>

<style scoped>
.task-card { background: #1e1e2e; border: 1px solid #313244; border-radius: 12px; padding: 16px; margin-bottom: 12px; color: #cdd6f4; }
.task-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.task-title { margin: 0; font-size: 16px; font-weight: 600; color: #cdd6f4; word-break: break-word; }
.task-priority { font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
.priority-low { background: #45475a; color: #a6adc8; }
.priority-normal { background: #313244; color: #89b4fa; }
.priority-high { background: #452434; color: #f38ba8; }
.task-meta { display: flex; gap: 12px; font-size: 13px; color: #a6adc8; margin-bottom: 8px; }
.task-complexity { text-transform: capitalize; }
.task-description { font-size: 14px; color: #a6adc8; margin-bottom: 12px; line-height: 1.4; }
.task-actions { display: flex; gap: 8px; }
.btn-complete, .btn-archive { min-height: 44px; min-width: 44px; padding: 8px 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; }
.btn-complete { background: #a6e3a1; color: #1e1e2e; }
.btn-archive { background: #45475a; color: #cdd6f4; }
</style>
