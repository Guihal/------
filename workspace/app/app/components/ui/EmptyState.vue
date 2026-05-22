<template>
  <div class="py-8 text-center text-gray-500">
    <p>{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>()
</script>
