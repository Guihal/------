<template>
  <div>
    <h1>Logs</h1>
    <table v-if="logs.length">
      <thead>
        <tr><th>Time</th><th>Action</th><th>User</th></tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ log.created_at }}</td>
          <td>{{ log.action }}</td>
          <td>{{ log.user_id }}</td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button :disabled="offset === 0" @click="prev">Prev</button>
      <button :disabled="offset + limit >= total" @click="next">Next</button>
      <span>{{ offset + 1 }}–{{ Math.min(offset + limit, total) }} of {{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Log {
  id: number
  created_at: string
  action: string
  user_id: number | null
}

interface LogsResponse {
  logs: Log[]
  pagination: { total: number; limit: number; offset: number }
}

const limit = 20
const offset = ref(0)
const logs = ref<Log[]>([])
const total = ref(0)
const api = useApi()

async function fetchLogs() {
  const data = await api.fetch<LogsResponse>('/admin/logs', {
    query: { limit, offset: offset.value },
  }).catch(() => null)
  logs.value = data?.logs ?? []
  total.value = data?.pagination.total ?? 0
}

function next() {
  offset.value += limit
  fetchLogs()
}

function prev() {
  offset.value = Math.max(0, offset.value - limit)
  fetchLogs()
}

onMounted(fetchLogs)
</script>

<style scoped>
.pagination { margin-top: 1rem; display: flex; gap: 0.5rem; }
</style>
