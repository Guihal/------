<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
    <h1 class="mb-2 text-2xl font-bold">Таск Компаньон</h1>
    <p class="mb-6 text-gray-600">Управляй задачами, прокачивай уровень</p>
    <NuxtLink
      to="/login"
      class="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
    >
      Начать
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>
