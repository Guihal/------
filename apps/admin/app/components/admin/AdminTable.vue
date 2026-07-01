<script setup lang="ts" generic="T">
defineProps<{
  rows: T[];
  loading: boolean;
  error?: string | null;
  emptyText: string;
  caption: string;
}>();
</script>

<template>
  <div class="table-wrap">
    <p v-if="error" class="state error" role="alert" aria-live="assertive">
      {{ error }}
    </p>
    <p v-else-if="loading" class="state" role="status">Загрузка…</p>
    <p v-else-if="!rows.length" class="state" role="status">{{ emptyText }}</p>
    <table v-else>
      <caption class="sr-only">{{ caption }}</caption>
      <thead><slot name="head" /></thead>
      <tbody><slot name="body" /></tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.table-wrap {
  overflow-x: auto;
}
.state {
  margin: 0;
  padding: 0.85rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--muted);
}
.error {
  color: var(--danger);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
:deep(th),
:deep(td) {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--stroke);
  text-align: left;
  font-size: 0.9rem;
}
:deep(th) {
  color: var(--muted);
  font-weight: 600;
}
</style>
