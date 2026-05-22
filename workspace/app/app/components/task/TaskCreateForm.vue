<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <form class="w-full max-w-sm rounded-lg bg-white p-6 shadow" @submit.prevent="submit">
      <h2 class="mb-4 text-lg font-bold">Новая задача</h2>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Название</label>
        <input v-model="title" type="text" class="w-full rounded border px-3 py-2" required />
      </div>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Описание</label>
        <textarea v-model="description" class="w-full rounded border px-3 py-2" rows="3"></textarea>
      </div>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Приоритет</label>
        <select v-model="priority" class="w-full rounded border px-3 py-2">
          <option value="low">Низкий</option>
          <option value="normal">Обычный</option>
          <option value="high">Высокий</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium">Срок выполнения</label>
        <input v-model="dueAt" type="datetime-local" class="w-full rounded border px-3 py-2" />
      </div>
      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="rounded border px-4 py-2" @click="emit('close')">
          Отмена
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Создание...' : 'Создать' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { TaskPriority } from '~/types/api'

const emit = defineEmits<{
  close: []
  submit: [payload: { title: string; description?: string; priority: TaskPriority; due_at?: string }]
}>()

const title = ref('')
const description = ref('')
const priority = ref<TaskPriority>('normal')
const dueAt = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const payload: {
      title: string
      description?: string
      priority: TaskPriority
      due_at?: string
    } = {
      title: title.value,
      priority: priority.value,
    }
    if (description.value) payload.description = description.value
    if (dueAt.value) payload.due_at = new Date(dueAt.value).toISOString()
    emit('submit', payload)
  } finally {
    loading.value = false
  }
}
</script>
