<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const store = useLogsStore();

onMounted(() => {
  void store.load().catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <h1 class="display">Журнал действий</h1>
    <LogsFilters
      v-model:user-id="store.userId"
      v-model:action="store.action"
      v-model:from="store.from"
      v-model:to="store.to"
      @apply="store.applyFilters"
    />
    <AdminTable
      :rows="store.items"
      :loading="store.loading"
      :error="store.error"
      empty-text="Событий пока нет."
      caption="Журнал admin-действий"
    >
      <template #head>
        <tr>
          <th scope="col">Пользователь</th>
          <th scope="col">Действие</th>
          <th scope="col">Дата</th>
          <th scope="col">Детали</th>
        </tr>
      </template>
      <template #body>
        <LogRow v-for="entry in store.items" :key="entry.id" :entry="entry" />
      </template>
    </AdminTable>
    <nav class="pagination" aria-label="Постраничная навигация">
      <button type="button" class="tap" :disabled="store.offset <= 0" @click="store.prev">
        Назад
      </button>
      <button type="button" class="tap" :disabled="!store.hasMore" @click="store.next">
        Вперед
      </button>
    </nav>
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
.pagination {
  display: flex;
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
</style>
