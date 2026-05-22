<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="mx-auto max-w-2xl p-4">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '~/components/ui/AppHeader.vue'
</script>
