<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { DARK_TOKENS as t } from "../../../assets/tokens/dark";
import ItemForm from "../../components/items/ItemForm.vue";
import type { ItemFormData } from "../../components/items/ItemForm.vue";

const router = useRouter();
const isLoading = ref(false);
const error = ref("");

const API_BASE = "http://localhost:3000";

async function handleSubmit(data: ItemFormData) {
  isLoading.value = true;
  error.value = "";
  try {
    await $fetch(`${API_BASE}/admin/items`, {
      method: "POST",
      body: {
        name: data.name,
        rarity: data.rarity,
        asset_url: data.asset_url || null,
      },
      credentials: "include",
    });
    router.push("/items");
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Ошибка создания";
    isLoading.value = false;
  }
}

function handleCancel() {
  router.push("/items");
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Создать предмет</h1>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <ItemForm :is-loading="isLoading" @submit="handleSubmit" @cancel="handleCancel" />
  </div>
</template>

<style scoped>
.page { padding: v-bind("t.spacing.lg"); max-width: 640px; margin: 0 auto; }
.page-title { margin: 0 0 v-bind("t.spacing.lg") 0; font-size: v-bind("t.typography.size.xxl"); font-weight: v-bind("t.typography.weight.bold"); color: v-bind("t.color.textPrimary"); }
.error { color: v-bind("t.color.statusError"); font-size: v-bind("t.typography.size.sm"); margin-bottom: v-bind("t.spacing.md"); }
</style>
