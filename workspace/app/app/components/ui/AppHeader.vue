<template>
  <header class="border-b bg-white px-4 py-3">
    <div class="mx-auto flex max-w-2xl items-center justify-between">
      <NuxtLink to="/tasks" class="font-bold">Таск Компаньон</NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink to="/profile" class="text-sm text-gray-600 hover:text-gray-900">
          Профиль
        </NuxtLink>
        <button class="text-sm text-red-600" @click="emit('logout')">Выйти</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{ logout: [] }>()
</script>
