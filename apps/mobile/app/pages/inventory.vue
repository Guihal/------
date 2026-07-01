<script setup lang="ts">
import type { Rarity } from "~~/api";

definePageMeta({ middleware: "auth" });
const store = useInventoryStore();
const visual = useVisualStore();
const rarity = ref<Rarity | "all">("all");
const slot = ref("all");

const slots = computed(() => [...new Set(store.items.map((item) => item.slot_key))]);
const filtered = computed(() =>
  store.items.filter((item) =>
    (rarity.value === "all" || item.rarity === rarity.value) &&
    (slot.value === "all" || item.slot_key === slot.value),
  ),
);
const equippedBySlot = computed(() =>
  Object.fromEntries(store.equipped.map((item) => [item.slot_key, item])),
);
const emptyText = computed(() => visual.current.empty_state_text);

function replacementName(itemSlot: string) {
  return equippedBySlot.value[itemSlot]?.name ?? null;
}

onMounted(() => {
  void store.load().catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <div class="title">
      <p>Инвентарь</p>
      <h1>Предметы маскота</h1>
    </div>
    <InventoryMascot :mascot="store.mascot" :equipped="store.equipped" />
    <InventoryFilters v-model:rarity="rarity" v-model:slot="slot" :slots="slots" />
    <p v-if="store.error" class="state error" role="alert" aria-live="assertive">
      {{ store.error }}
    </p>
    <p v-if="store.loading" class="state" role="status">Инвентарь загружается…</p>
    <div v-else-if="!filtered.length" class="empty" role="status">
      {{ emptyText }}
    </div>
    <div v-else class="items" aria-label="Предметы инвентаря">
      <InventoryItemCard
        v-for="item in filtered"
        :key="item.id"
        :item="item"
        :busy="store.mutatingId === item.id"
        :replacement-name="replacementName(item.slot_key)"
        @equip="store.equip"
        @unequip="store.unequip"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.wrap { display: grid; gap: 0.9rem; padding-top: 0.9rem; }
.title p, .title h1 { margin: 0; }
.title p { color: var(--muted); }
.title h1 { font-size: 1.55rem; }
.state, .empty { margin: 0; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface); }
.error { color: var(--danger); }
.empty { color: var(--muted); }
.items { display: grid; gap: 0.75rem; }
</style>
