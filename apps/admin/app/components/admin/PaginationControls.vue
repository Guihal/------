<script setup lang="ts">
const props = defineProps<{ limit: number; offset: number; total: number }>();
const emit = defineEmits<{ (e: "update:offset", value: number): void }>();

const page = computed(() => Math.floor(props.offset / props.limit) + 1);
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.limit)));
const canPrev = computed(() => props.offset > 0);
const canNext = computed(() => props.offset + props.limit < props.total);

function prev() {
  if (canPrev.value) emit("update:offset", Math.max(0, props.offset - props.limit));
}
function next() {
  if (canNext.value) emit("update:offset", props.offset + props.limit);
}
</script>

<template>
  <nav class="pagination" aria-label="Постраничная навигация">
    <button type="button" class="tap" :disabled="!canPrev" @click="prev">
      Назад
    </button>
    <span class="page" aria-live="polite">Страница {{ page }} из {{ pageCount }}</span>
    <button type="button" class="tap" :disabled="!canNext" @click="next">
      Вперед
    </button>
  </nav>
</template>

<style scoped lang="scss">
.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page {
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
