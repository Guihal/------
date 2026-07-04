<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const store = useDashboardStore();

const cards = computed(() => {
  const s = store.stats;
  if (!s) return [];
  return [
    {
      label: "Пользователи",
      value: s.users,
      accent: "#4c9bff",
      icon: "M4 20c0-4 3.5-6 8-6s8 2 8 6 M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8",
    },
    {
      label: "Задачи",
      value: s.tasks,
      accent: "#7c5cff",
      icon: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
    },
    {
      label: "Выполненные задачи",
      value: s.completed_tasks,
      accent: "#3fd07a",
      icon: "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20 M8 12l3 3 5-6",
    },
    {
      label: "Розыгрыши наград",
      value: s.reward_rolls,
      accent: "#f5b942",
      icon: "M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z",
    },
    {
      label: "Предметы в каталоге",
      value: s.items,
      accent: "#a06bff",
      icon: "M3 7l9-4 9 4v10l-9 4-9-4V7z M3 7l9 4 9-4 M12 11v10",
    },
    {
      label: "Выдано предметов",
      value: s.granted_items,
      accent: "#3fd0c0",
      icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.3 7L12 12l8.7-5 M12 22V12",
    },
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
  background: var(--surface-card);
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
