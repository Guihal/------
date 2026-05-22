<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { DARK_TOKENS as t } from "../../../assets/tokens/dark";
import ItemTable from "../../components/items/ItemTable.vue";
import EmptyState from "../../components/ui/EmptyState.vue";
import LoadingState from "../../components/ui/LoadingState.vue";
import ErrorState from "../../components/ui/ErrorState.vue";

interface Item {
  id: number;
  name: string;
  rarity: string;
  asset_url: string | null;
}

const router = useRouter();
const items = ref<Item[]>([]);
const isLoading = ref(true);
const error = ref("");
const deletingId = ref<number | null>(null);

const API_BASE = "http://localhost:3000";

async function fetchItems() {
  isLoading.value = true;
  error.value = "";
  try {
    const res = await $fetch<{ items: Item[] }>(`${API_BASE}/admin/items`, { credentials: "include" });
    items.value = res.items;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Ошибка загрузки";
  } finally {
    isLoading.value = false;
  }
}

async function handleDelete(id: number) {
  if (!confirm("Удалить предмет?")) return;
  deletingId.value = id;
  try {
    await $fetch(`${API_BASE}/admin/items/${id}`, { method: "DELETE", credentials: "include" });
    items.value = items.value.filter((i) => i.id !== id);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Ошибка удаления";
  } finally {
    deletingId.value = null;
  }
}

function handleEdit(id: number) {
  router.push(`/items/${id}`);
}

onMounted(fetchItems);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Предметы</h1>
      <button class="btn-primary" @click="router.push('/items/create')">+ Создать</button>
    </header>
    <LoadingState v-if="isLoading" />
    <ErrorState v-else-if="error" :message="error" />
    <EmptyState v-else-if="items.length === 0" title="Нет предметов" description="Создайте первый предмет" icon="📦" />
    <ItemTable v-else :items="items" :loading-id="deletingId" @edit="handleEdit" @delete="handleDelete" />
  </div>
</template>

<style scoped>
.page { padding: v-bind("t.spacing.lg"); max-width: 960px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: v-bind("t.spacing.xl"); }
.page-title { margin: 0; font-size: v-bind("t.typography.size.xxl"); font-weight: v-bind("t.typography.weight.bold"); color: v-bind("t.color.textPrimary"); }
.btn-primary { min-height: 44px; padding: v-bind("t.spacing.sm") v-bind("t.spacing.lg"); border-radius: v-bind("t.radius.md"); font-size: v-bind("t.typography.size.md"); font-weight: v-bind("t.typography.weight.semibold"); cursor: pointer; background: v-bind("t.color.accentBlue"); color: v-bind("t.color.textInverse"); border: none; }
.btn-primary:hover { filter: brightness(1.1); }
</style>
