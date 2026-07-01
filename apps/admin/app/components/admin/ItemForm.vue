<script setup lang="ts">
import type { AdminItem, Rarity } from "~~/api";

const props = defineProps<{
  mode: "create" | "edit";
  initial?: AdminItem | null;
  saving: boolean;
  uploading: boolean;
  fieldErrors: Record<string, string>;
  formError: string | null;
}>();
const emit = defineEmits<{
  (e: "submit", payload: { name: string; description: string; slot_key: string; rarity: Rarity }): void;
  (e: "upload", file: File): void;
  (e: "disable"): void;
}>();

const rarities: Rarity[] = ["common", "rare", "epic", "legendary"];

const name = ref(props.initial?.name ?? "");
const description = ref(props.initial?.description ?? "");
const rarity = ref<Rarity>(props.initial?.rarity ?? "common");
const slotKey = ref(props.initial?.slot_key ?? "");
const fileInput = ref<HTMLInputElement | null>(null);

function submit() {
  emit("submit", {
    name: name.value,
    description: description.value,
    slot_key: slotKey.value,
    rarity: rarity.value,
  });
}

function pickFile() {
  const file = fileInput.value?.files?.[0];
  if (file) emit("upload", file);
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <FormField id="item-name" v-model="name" label="Название" :error="fieldErrors.name" />
    <div class="field">
      <label for="item-desc">Описание</label>
      <textarea id="item-desc" v-model="description" rows="3" class="textarea" />
      <FieldError :message="fieldErrors.description" />
    </div>
    <label class="field">
      Редкость
      <select v-model="rarity" class="tap" :disabled="mode === 'edit'">
        <option v-for="r in rarities" :key="r" :value="r">{{ rarityLabel(r) }}</option>
      </select>
    </label>
    <FormField id="item-slot" v-model="slotKey" label="Слот" :error="fieldErrors.slot_key" />

    <div v-if="mode === 'edit' && initial" class="asset">
      <p class="asset-label">Изображение</p>
      <img v-if="initial.asset_url" :src="initial.asset_url" alt="" class="preview" />
      <input ref="fileInput" type="file" accept="image/*" class="tap" @change="pickFile" />
      <p v-if="uploading" role="status">Загрузка файла…</p>
      <FieldError :message="fieldErrors.asset" />
      <p class="status">Статус: {{ statusLabel(initial.active) }}</p>
      <AppButton v-if="initial.active" variant="ghost" type="button" @click="emit('disable')">
        Отключить предмет
      </AppButton>
    </div>

    <FieldError :message="formError" />
    <AppButton type="submit" :loading="saving">
      {{ mode === "create" ? "Создать" : "Сохранить" }}
    </AppButton>
  </form>
</template>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 28rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.textarea,
select {
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--stroke);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
}
.asset {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
  border: 1px solid var(--stroke);
  border-radius: var(--radius-lg);
}
.preview {
  max-width: 6rem;
  border-radius: var(--radius-md);
}
.status {
  margin: 0;
  color: var(--muted);
}
</style>
