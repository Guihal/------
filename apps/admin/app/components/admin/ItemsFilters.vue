<script setup lang="ts">
import type { Rarity } from "~~/api";

defineProps<{ rarities: readonly Rarity[] }>();
const emit = defineEmits<{ (e: "apply"): void }>();

const q = defineModel<string>("q", { required: true });
const rarity = defineModel<Rarity | "all">("rarity", { required: true });
const active = defineModel<"all" | "true" | "false">("active", { required: true });
const slot = defineModel<string>("slot", { required: true });
</script>

<template>
  <form class="filters" @submit.prevent="emit('apply')">
    <SearchInput id="item-search" v-model="q" label="Поиск по названию" />
    <label class="select-field">
      Редкость
      <select v-model="rarity" class="tap">
        <option value="all">все</option>
        <option v-for="r in rarities" :key="r" :value="r">{{ rarityLabel(r) }}</option>
      </select>
    </label>
    <label class="select-field">
      Статус
      <select v-model="active" class="tap">
        <option value="all">все</option>
        <option value="true">включен</option>
        <option value="false">отключен</option>
      </select>
    </label>
    <label class="select-field">
      Слот
      <input v-model="slot" type="text" class="tap" placeholder="head" />
    </label>
    <AppButton type="submit">Применить</AppButton>
  </form>
</template>

<style scoped lang="scss">
.filters {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.select-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--muted);
}
select,
input {
  padding: 0.5rem 0.6rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--stroke);
  background: var(--surface);
  color: var(--text);
}
</style>
