<script setup lang="ts">
import { ApiError } from "~~/api";
import type { Rarity } from "~~/api";

definePageMeta({ middleware: "auth" });

const store = useItemsStore();
const router = useRouter();
const saving = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

async function onSubmit(payload: { name: string; description: string; slot_key: string; rarity: Rarity }) {
  saving.value = true;
  formError.value = null;
  fieldErrors.value = {};
  try {
    const item = await store.create(payload);
    await router.replace(`/items/${item.id}/edit`);
  } catch (e) {
    if (e instanceof ApiError) {
      formError.value = e.body.message;
      fieldErrors.value = e.body.field_errors ?? {};
    } else {
      formError.value = "Не удалось создать предмет.";
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="wrap">
    <h1 class="display">Новый предмет</h1>
    <ItemForm
      mode="create"
      :saving="saving"
      :uploading="false"
      :field-errors="fieldErrors"
      :form-error="formError"
      @submit="onSubmit"
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
