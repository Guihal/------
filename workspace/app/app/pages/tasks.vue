<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-bold">Tasks</h1>
      <button
        class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        @click="showCreate = true"
      >
        New Task
      </button>
    </div>
    <div v-if="tasks.length" class="space-y-2">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="rounded border bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span :class="{ 'line-through': task.status === 'completed' }" class="font-medium">
            {{ task.title }}
          </span>
          <span class="text-xs capitalize text-gray-500">{{ task.status }}</span>
        </div>
        <p v-if="task.description" class="mt-1 text-sm text-gray-600">
          {{ task.description }}
        </p>
        <div class="mt-2 flex gap-2">
          <button
            v-if="task.status !== 'completed'"
            class="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
            @click="completeTask(task.id)"
          >
            Complete
          </button>
          <button
            class="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
            @click="deleteTask(task.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    <p v-else class="text-gray-500">No tasks.</p>

    <div
      v-if="showCreate"
      class="fixed inset-0 flex items-center justify-center bg-black/50"
      @click.self="showCreate = false"
    >
      <form class="w-full max-w-sm rounded-lg bg-white p-6 shadow" @submit.prevent="createTask">
        <h2 class="mb-4 text-lg font-bold">New Task</h2>
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">Title</label>
          <input v-model="newTitle" type="text" class="w-full rounded border px-3 py-2" required />
        </div>
        <div class="mb-4">
          <label class="mb-1 block text-sm font-medium">Description</label>
          <textarea v-model="newDesc" class="w-full rounded border px-3 py-2" rows="3"></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded border px-4 py-2" @click="showCreate = false">
            Cancel
          </button>
          <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Task {
  id: number
  title: string
  description: string | null
  status: string
}

const tasks = ref<Task[]>([])
const showCreate = ref(false)
const newTitle = ref('')
const newDesc = ref('')
const api = useApi()

async function fetchTasks() {
  const data = await api.fetch<{ tasks: Task[] }>('/tasks').catch(() => null)
  tasks.value = data?.tasks ?? []
}

async function createTask() {
  await api.fetch('/tasks', {
    method: 'POST',
    body: { title: newTitle.value, description: newDesc.value || undefined },
  })
  newTitle.value = ''
  newDesc.value = ''
  showCreate.value = false
  await fetchTasks()
}

async function completeTask(id: number) {
  await api.fetch(`/tasks/${id}/complete`, { method: 'POST' }).catch(() => null)
  await fetchTasks()
}

async function deleteTask(id: number) {
  await api.fetch(`/tasks/${id}`, { method: 'DELETE' }).catch(() => null)
  await fetchTasks()
}

onMounted(fetchTasks)
</script>
