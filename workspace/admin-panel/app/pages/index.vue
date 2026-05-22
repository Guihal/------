<template>
  <div>
    <h1>Dashboard</h1>
    <div class="cards">
      <NuxtLink to="/users" class="card">Users</NuxtLink>
      <NuxtLink to="/logs" class="card">Logs</NuxtLink>
      <NuxtLink to="/stats" class="card">Stats</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
.card { display: block; padding: 2rem; background: #f0f0f0; text-align: center; text-decoration: none; border-radius: 8px; }
.card:hover { background: #e0e0e0; }
</style>
