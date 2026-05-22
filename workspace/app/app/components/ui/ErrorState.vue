<template>
  <div class="py-8 text-center text-red-600">
    <p>{{ message }}</p>
    <button v-if="onRetry" class="mt-2 text-sm text-blue-600 hover:underline" @click="onRetry">
      Повторить
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  onRetry?: () => void
}>()
</script>
