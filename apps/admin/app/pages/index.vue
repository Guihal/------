<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const store = useDashboardStore();

const cards = computed(() => {
  const s = store.stats;
  if (!s) return [];
  return [
    { label: "Пользователи", value: s.users },
    { label: "Задачи", value: s.tasks },
    { label: "Выполненные задачи", value: s.completed_tasks },
    { label: "Розыгрыши наград", value: s.reward_rolls },
    { label: "Предметы в каталоге", value: s.items },
    { label: "Выдано предметов", value: s.granted_items },
  ];
});

onMounted(() => {
  void store.load().catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <h1 class="display">Дашборд</h1>
    <p v-if="store.error" class="state error" role="alert" aria-live="assertive">
      {{ store.error }}
    </p>
    <p v-else-if="store.loading" class="state" role="status">
      Статистика загружается…
    </p>
    <p v-else-if="!cards.length" class="state" role="status">
      Данные пока недоступны.
    </p>
    <div v-else class="grid" aria-label="Статистика проекта">
      <StatCard v-for="card in cards" :key="card.label" v-bind="card" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.wrap {
  display: grid;
  gap: 1rem;
}
h1 {
  margin: 0;
  font-size: 1.5rem;
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.85rem;
}
</style>
