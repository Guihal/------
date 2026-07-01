<script setup lang="ts">
import type { AdminItem, Rarity } from "~~/api";

definePageMeta({ middleware: "auth" });

const store = useItemsStore();
const rarities: Rarity[] = ["common", "rare", "epic", "legendary"];
const pendingDisable = ref<AdminItem | null>(null);

function askDisable(item: AdminItem) {
  pendingDisable.value = item;
}

async function confirmDisable() {
  const item = pendingDisable.value;
  pendingDisable.value = null;
  if (!item) return;
  await store.disable(item.id).catch(() => {});
}

onMounted(() => {
  void store.load().catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <div class="header">
      <h1 class="display">Предметы</h1>
      <NuxtLink to="/items/new" class="tap create-link">Создать предмет</NuxtLink>
    </div>
    <ItemsFilters
      v-model:q="store.q"
      v-model:rarity="store.rarity"
      v-model:active="store.active"
      v-model:slot="store.slot"
      :rarities="rarities"
      @apply="store.applyFilters"
    />
    <AdminTable
      :rows="store.items"
      :loading="store.loading"
      :error="store.error"
      empty-text="Предметы не найдены."
      caption="Каталог предметов"
    >
      <template #head>
        <tr>
          <th scope="col">Название</th>
          <th scope="col">Редкость</th>
          <th scope="col">Слот</th>
          <th scope="col">Статус</th>
          <th scope="col">Дата создания</th>
          <th scope="col">Действия</th>
        </tr>
      </template>
      <template #body>
        <ItemRow v-for="item in store.items" :key="item.id" :item="item" @disable="askDisable" />
      </template>
    </AdminTable>
    <PaginationControls
      :limit="store.limit"
      :offset="store.offset"
      :total="store.total"
      @update:offset="store.setOffset"
    />
    <ConfirmDialog
      :open="!!pendingDisable"
      title="Отключить предмет?"
      message="Уже выданные предметы у пользователей не будут удалены."
      confirm-label="Отключить"
      @confirm="confirmDisable"
      @cancel="pendingDisable = null"
    />
  </section>
</template>

<style scoped lang="scss">
.wrap {
  display: grid;
  gap: 1rem;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
h1 {
  margin: 0;
  font-size: 1.5rem;
}
.create-link {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md);
  background: var(--accent-grad);
  color: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}
</style>
