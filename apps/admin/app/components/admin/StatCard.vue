<script setup lang="ts">
defineProps<{ label: string; value: number | string }>();
</script>

<template>
  <div class="card">
    <p class="label">{{ label }}</p>
    <p class="value">{{ value }}</p>
  </div>
</template>

<style scoped lang="scss">
.card {
  padding: 1rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-lg);
  background: var(--surface);
}
.label {
  margin: 0 0 0.35rem;
  color: var(--muted);
  font-size: 0.85rem;
}
.value {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
}
</style>
