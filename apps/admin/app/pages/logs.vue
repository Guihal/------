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
    <PaginationControls
      :limit="store.limit"
      :offset="store.offset"
      :total="store.total"
      @update:offset="store.setOffset"
    />
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
</style>
