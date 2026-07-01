<script setup lang="ts">
import { Sparkles } from "lucide-vue-next";
import type { CompletionPayload } from "~~/api";

const props = defineProps<{ payload: CompletionPayload | null }>();

const rewardLine = computed(() => {
  const drop = props.payload?.task_drop;
  if (!drop?.dropped || !drop.item) return "Награда за задачу не выпала.";
  return `Получен предмет: ${drop.item.name}, редкость ${drop.item.rarity}.`;
});

const levelLine = computed(() => {
  const levels = props.payload?.level_ups ?? [];
  if (!levels.length) return "Уровень без изменений.";
  return `Новые уровни: ${levels.join(", ")}.`;
});
</script>

<template>
  <aside
    v-if="payload?.is_fresh_completion_event"
    class="toast"
    role="status"
    aria-live="polite"
  >
    <Sparkles :size="18" aria-hidden="true" />
    <span>Задача выполнена. {{ levelLine }} {{ rewardLine }}</span>
  </aside>
</template>

<style scoped lang="scss">
.toast {
  position: sticky;
  top: 0.5rem;
  z-index: 5;
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-soft);
}
</style>
