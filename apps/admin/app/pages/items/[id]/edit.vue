<script setup lang="ts">
import { ApiError } from "~~/api";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const store = useItemsStore();
const id = route.params.id as string;

const saving = ref(false);
const uploading = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});
const loading = ref(true);
const loadError = ref<string | null>(null);

const item = computed(() => store.find(id));

onMounted(async () => {
  try {
    const found = await store.ensureLoaded(id);
    if (!found) loadError.value = "Предмет не найден.";
  } catch {
    loadError.value = "Не удалось загрузить предмет.";
  } finally {
    loading.value = false;
  }
});

async function onSubmit(payload: { name: string; description: string; slot_key: string }) {
  saving.value = true;
  formError.value = null;
  fieldErrors.value = {};
  try {
    await store.patch(id, {
      name: payload.name,
      description: payload.description,
      slot_key: payload.slot_key,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      formError.value = e.body.message;
      fieldErrors.value = e.body.field_errors ?? {};
    } else {
      formError.value = "Не удалось сохранить предмет.";
    }
  } finally {
    saving.value = false;
  }
}

async function onUpload(file: File) {
  uploading.value = true;
  fieldErrors.value = { ...fieldErrors.value, asset: "" };
  try {
    await store.uploadAsset(id, file);
  } catch (e) {
    fieldErrors.value = {
      ...fieldErrors.value,
      asset: e instanceof ApiError ? e.body.message : "Не удалось загрузить файл.",
    };
  } finally {
    uploading.value = false;
  }
}

async function onDisable() {
  formError.value = null;
  try {
    await store.disable(id);
  } catch {
    formError.value = store.error ?? "Не удалось отключить предмет.";
  }
}
</script>

<template>
  <section class="wrap">
    <h1 class="display">Редактирование предмета</h1>
    <p v-if="loading" role="status">Загрузка…</p>
    <p v-else-if="loadError" role="alert" class="error">{{ loadError }}</p>
    <ItemForm
      v-else-if="item"
      mode="edit"
      :initial="item"
      :saving="saving"
      :uploading="uploading"
      :field-errors="fieldErrors"
      :form-error="formError"
      @submit="onSubmit"
      @upload="onUpload"
      @disable="onDisable"
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
.error {
  color: var(--danger);
}
</style>
