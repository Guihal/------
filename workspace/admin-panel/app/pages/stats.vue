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
    <div v-if="levelStats" class="stats-section">
      <h2>Level Stats</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span>Average Level</span>
          <strong>{{ levelStats.average_level }}</strong>
        </div>
        <div class="stat-card">
          <span>Max Level</span>
          <strong>{{ levelStats.max_level }}</strong>
        </div>
      </div>
    </div>
    <div v-if="dropStats" class="stats-section">
      <h2>Drop Stats</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span>Total Drops</span>
          <strong>{{ dropStats.total_drops }}</strong>
        </div>
        <div class="stat-card">
          <span>Drop Rate</span>
          <strong>{{ dropStats.drop_rate }}</strong>
        </div>
      </div>
    </div>
    <p v-if="!stats && !levelStats && !dropStats">Loading...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Stats {
  total_users: number
  total_tasks: number
  completed_tasks: number
}

interface LevelStats {
  average_level: number
  max_level: number
}

interface DropStats {
  total_drops: number
  drop_rate: number
}

const stats = ref<Stats | null>(null)
const levelStats = ref<LevelStats | null>(null)
const dropStats = ref<DropStats | null>(null)
const api = useApi()

onMounted(async () => {
  const [s, l, d] = await Promise.all([
    api.fetch<{ stats: Stats }>('/admin/stats').catch(() => null),
    api.fetch<{ stats: LevelStats }>('/admin/stats/levels').catch(() => null),
    api.fetch<{ stats: DropStats }>('/admin/stats/drops').catch(() => null),
  ])
  stats.value = s?.stats ?? null
  levelStats.value = l?.stats ?? null
   dropStats.value = d?.stats ?? null
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
.stat-card { padding: 1.5rem; background: #f5f5f5; border-radius: 8px; display: flex; flex-direction: column; }
.stats-section { margin-top: 2rem; }
</style>
