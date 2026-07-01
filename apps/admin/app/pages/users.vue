<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const store = useUsersStore();
const qDraft = ref("");

function submitSearch() {
  store.search(qDraft.value);
}

onMounted(() => {
  void store.load().catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <h1 class="display">Пользователи</h1>
    <form class="filters" @submit.prevent="submitSearch">
      <SearchInput
        id="user-search"
        v-model="qDraft"
        label="Поиск по email"
        placeholder="user@example.com"
      />
      <AppButton type="submit">Искать</AppButton>
    </form>
    <AdminTable
      :rows="store.items"
      :loading="store.loading"
      :error="store.error"
      empty-text="Пользователи не найдены."
      caption="Список пользователей"
    >
      <template #head>
        <tr>
          <th scope="col">Email</th>
          <th scope="col">Роль</th>
          <th scope="col">Дата регистрации</th>
        </tr>
      </template>
      <template #body>
        <tr v-for="u in store.items" :key="u.id">
          <td>{{ u.email }}</td>
          <td>{{ u.role === "admin" ? "администратор" : "пользователь" }}</td>
          <td>{{ new Date(u.created_at).toLocaleString("ru-RU") }}</td>
        </tr>
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
.filters {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
