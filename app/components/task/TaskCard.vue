<script setup lang="ts">
import type { Task } from "../../../core/domain/task/types"

import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  task: Task
  isLoading?: boolean
}>()

const emit = defineEmits<{
  complete: [taskId: string]
  archive: [taskId: string]
}>()

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("ru-RU") : ""
}

const priorityLabels: Record<Task["priority"], string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
}

const complexityLabels: Record<Task["complexity"], string> = {
  tiny: "Крошечная",
  small: "Маленькая",
  medium: "Средняя",
  large: "Большая",
}

const priorityClasses: Record<Task["priority"], string> = {
  low: "priority-low",
  normal: "priority-normal",
  high: "priority-high",
}
</script>

<template>
  <div class="task-card" data-testid="task-card">
    <div class="task-header">
      <h3 class="task-title">{{ props.task.title }}</h3>
      <span class="task-priority" :class="priorityClasses[props.task.priority]">{{ priorityLabels[props.task.priority] }}</span>
    </div>
    <div class="task-meta">
      <span class="task-complexity">{{ complexityLabels[props.task.complexity] }}</span>
      <span v-if="props.task.dueAt" class="task-deadline">{{ fmtDate(props.task.dueAt) }}</span>
    </div>
    <div v-if="props.task.description" class="task-description">{{ props.task.description }}</div>
    <div v-if="props.task.status === 'active'" class="task-actions">
      <button class="btn-complete" data-testid="btn-complete" :disabled="props.isLoading" :aria-label="`Выполнить задачу: ${props.task.title}`" @click="emit('complete', props.task.id)">Выполнить</button>
      <button class="btn-archive" data-testid="btn-archive" :disabled="props.isLoading" :aria-label="`Архивировать задачу: ${props.task.title}`" @click="emit('archive', props.task.id)">В архив</button>
    </div>
  </div>
</template>

<style scoped>
.task-card { background: v-bind("t.color.bgCard"); border: 1px solid v-bind("t.color.borderSubtle"); border-radius: v-bind("t.radius.lg"); padding: v-bind("t.spacing.lg"); margin-bottom: v-bind("t.spacing.md"); color: v-bind("t.color.textPrimary"); contain: layout paint style; }
.task-header { display: flex; align-items: flex-start; justify-content: space-between; gap: v-bind("t.spacing.md"); margin-bottom: v-bind("t.spacing.sm"); flex-wrap: wrap; }
.task-title { margin: 0; font-size: v-bind("t.typography.size.lg"); font-weight: v-bind("t.typography.weight.semibold"); color: v-bind("t.color.textPrimary"); word-break: break-word; flex: 1; min-width: 0; }
.task-priority { font-size: v-bind("t.typography.size.xs"); font-weight: v-bind("t.typography.weight.semibold"); text-transform: uppercase; padding: v-bind("t.spacing.xs") v-bind("t.spacing.sm"); border-radius: v-bind("t.radius.full"); white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
.priority-low { background: v-bind("t.color.priorityLowBg"); color: v-bind("t.color.priorityLowText"); }
.priority-normal { background: v-bind("t.color.priorityNormalBg"); color: v-bind("t.color.priorityNormalText"); }
.priority-high { background: v-bind("t.color.priorityHighBg"); color: v-bind("t.color.priorityHighText"); }
.task-meta { display: flex; flex-wrap: wrap; gap: v-bind("t.spacing.md"); font-size: v-bind("t.typography.size.sm"); color: v-bind("t.color.textSecondary"); margin-bottom: v-bind("t.spacing.sm"); }
.task-complexity { text-transform: capitalize; }
.task-description { font-size: v-bind("t.typography.size.md"); color: v-bind("t.color.textSecondary"); margin-bottom: v-bind("t.spacing.md"); line-height: v-bind("t.typography.lineHeight.normal"); word-break: break-word; }
.task-actions { display: flex; gap: v-bind("t.spacing.sm"); }
.btn-complete, .btn-archive { min-height: 44px; min-width: 80px; padding: v-bind("t.spacing.sm") v-bind("t.spacing.lg"); border: none; border-radius: v-bind("t.radius.md"); font-size: v-bind("t.typography.size.md"); font-weight: v-bind("t.typography.weight.semibold"); cursor: pointer; flex: 1; touch-action: manipulation; -webkit-tap-highlight-color: transparent; will-change: transform; }
.btn-complete:active, .btn-archive:active { transform: scale(0.98); }
.btn-complete:focus-visible, .btn-archive:focus-visible { outline: 2px solid v-bind("t.color.accentBlue"); outline-offset: 2px; }
.btn-complete { background: v-bind("t.color.accentGreen"); color: v-bind("t.color.textInverse"); }
.btn-complete:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-archive { background: v-bind("t.color.priorityLowBg"); color: v-bind("t.color.textPrimary"); }
.btn-archive:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
