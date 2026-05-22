<template>
  <div>
    <h1>Stats</h1>
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <span>Total Users</span>
        <strong>{{ stats.total_users }}</strong>
      </div>
      <div class="stat-card">
        <span>Total Tasks</span>
        <strong>{{ stats.total_tasks }}</strong>
      </div>
      <div class="stat-card">
        <span>Completed Tasks</span>
        <strong>{{ stats.completed_tasks }}</strong>
      </div>
    </div>
    <p v-else>Loading...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Stats {
  total_users: number
  total_tasks: number
  completed_tasks: number
}

const stats = ref<Stats | null>(null)

onMounted(async () => {
  const data = await $fetch<{ stats: Stats }>('/admin/stats', {
    baseURL: useRuntimeConfig().public.apiBase as string,
    headers: { Authorization: `Bearer ${useAuthStore().token}` },
  }).catch(() => null)
  stats.value = data?.stats ?? null
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
.stat-card { padding: 1.5rem; background: #f5f5f5; border-radius: 8px; display: flex; flex-direction: column; }
</style>
