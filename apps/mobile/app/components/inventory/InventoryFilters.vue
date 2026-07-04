<script setup lang="ts">
import type { Rarity } from "~~/api";

defineProps<{ slots: string[] }>();
const rarity = defineModel<Rarity | "all">("rarity", { required: true });
const slot = defineModel<string>("slot", { required: true });

const rarities: Array<Rarity | "all"> = ["all", "common", "rare", "epic", "legendary"];
const rarityText = (value: Rarity | "all") =>
  value === "all" ? "Все" : rarityLabels[value];
</script>

<template>
  <section class="filters" aria-label="Фильтры инвентаря">
    <label>
      Редкость
      <select v-model="rarity" class="tap">
        <option v-for="value in rarities" :key="value" :value="value">
          {{ rarityText(value) }}
        </option>
      </select>
    </label>
    <label>
      Слот
      <select v-model="slot" class="tap">
        <option value="all">Все</option>
        <option v-for="value in slots" :key="value" :value="value">
          {{ slotLabel(value) }}
        </option>
      </select>
    </label>
  </section>
</template>

<style scoped lang="scss">
.filters { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
label { display: grid; gap: 0.3rem; color: var(--muted); font-size: 0.82rem; }
select { width: 100%; min-height: 44px; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface); color: var(--text); padding: 0 0.6rem; }
</style>
