<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DARK_TOKENS as t } from "../../../assets/tokens/dark";
import ItemForm from "../../components/items/ItemForm.vue";
import type { ItemFormData } from "../../components/items/ItemForm.vue";
import LoadingState from "../../components/ui/LoadingState.vue";

interface Item {
  id: number;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  asset_url: string | null;
  description: string | null;
}

const route = useRoute();
const router = useRouter();
const item = ref<Item | null>(null);
const isLoading = ref(false);
const isFetching = ref(true);
const error = ref("");

const API_BASE = "http://localhost:3000";
const itemId = Number(route.params.id);

async function fetchItem() {
  isFetching.value = true;
  try {
    const res = await $fetch<{ item: Item }>(`${API_BASE}/admin/items/${itemId}`, { credentials: "include" });
    item.value = res.item;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Ошибка загрузки";
  } finally {
    isFetching.value = false;
  }
}

async function handleSubmit(data: ItemFormData) {
  isLoading.value = true;
  error.value = "";
  try {
    await $fetch(`${API_BASE}/admin/items/${itemId}`, {
      method: "PUT",
      body: {
        name: data.name,
        rarity: data.rarity,
        asset_url: data.asset_url || null,
      },
      credentials: "include",
    });
    router.push("/items");
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Ошибка обновления";
    isLoading.value = false;
  }
}

function handleCancel() {
  router.push("/items");
}

onMounted(fetchItem);
</script>

<template>
  <div class="page">
    <h1 class="page-title">Редактировать предмет</h1>
    <LoadingState v-if="isFetching" />
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>
    <ItemForm
      v-else-if="item"
      :initial="{
        name: item.name,
        rarity: item.rarity,
        asset_url: item.asset_url ?? '',
        xp_multiplier_min: 1,
        xp_multiplier_max: 1,
      }"
      :is-loading="isLoading"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
.page { padding: v-bind("t.spacing.lg"); max-width: 640px; margin: 0 auto; }
.page-title { margin: 0 0 v-bind("t.spacing.lg") 0; font-size: v-bind("t.typography.size.xxl"); font-weight: v-bind("t.typography.weight.bold"); color: v-bind("t.color.textPrimary"); }
.error { color: v-bind("t.color.statusError"); font-size: v-bind("t.typography.size.sm"); margin-bottom: v-bind("t.spacing.md"); }
</style>
