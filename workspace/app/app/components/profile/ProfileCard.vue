<template>
  <div class="rounded-lg bg-white p-6 shadow">
    <h2 class="mb-4 text-lg font-bold">Профиль</h2>
    <div class="space-y-2">
      <p><span class="text-gray-500">Email:</span> {{ profile.email }}</p>
      <p><span class="text-gray-500">Уровень:</span> {{ profile.level }}</p>
      <p><span class="text-gray-500">Опыт:</span> {{ profile.xp }}</p>
      <p><span class="text-gray-500">Выполнено задач:</span> {{ profile.tasks_completed }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Profile } from '~/types/api'

defineProps<{ profile: Profile }>()
</script>
