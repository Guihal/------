<template>
  <div class="rounded border bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <span
          :class="{
            'line-through text-gray-400': task.status === 'completed',
          }"
          class="font-medium"
        >
          {{ task.title }}
        </span>
        <span
          v-if="task.priority !== 'normal'"
          :class="priorityClass"
          class="ml-2 inline-block rounded px-1.5 py-0.5 text-xs"
        >
          {{ priorityLabel }}
        </span>
      </div>
      <span class="ml-2 text-xs capitalize text-gray-500">{{ statusLabel }}</span>
    </div>
    <p v-if="task.description" class="mt-1 text-sm text-gray-600">
      {{ task.description }}
    </p>
    <p v-if="task.due_at" class="mt-1 text-xs text-gray-500">
      Срок: {{ formatDate(task.due_at) }}
    </p>
    <div class="mt-2 flex gap-2">
      <button
        v-if="task.status === 'pending'"
        class="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
        @click="emit('complete', task.id)"
      >
        Выполнить
      </button>
      <button
        v-if="task.status !== 'archived'"
        class="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700"
        @click="emit('archive', task.id)"
      >
        В архив
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types/api'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{
  complete: [id: number]
  archive: [id: number]
}>()

const priorityLabel = computed(() => {
  const map: Record<string, string> = { low: 'Низкий', normal: 'Обычный', high: 'Высокий' }
  return map[props.task.priority] || props.task.priority
})

const priorityClass = computed(() => {
  const map: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800',
  }
  return map[props.task.priority] || 'bg-gray-100 text-gray-800'
})

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    pending: 'В работе',
    completed: 'Выполнена',
    archived: 'В архиве',
  }
  return map[props.task.status] || props.task.status
})

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU')
}
</script>
