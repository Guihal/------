<script setup lang="ts">
import type { OwnedItem } from "~~/api";

const props = defineProps<{
  item: OwnedItem;
  busy: boolean;
  replacementName?: string | null;
}>();
const emit = defineEmits<{ equip: [item: OwnedItem]; unequip: [item: OwnedItem] }>();

const source = computed(() => sourceLabels[props.item.source] ?? props.item.source);
const replacement = computed(() => {
  if (props.item.equipped) return "Предмет уже надет в этом слоте.";
  if (props.replacementName) return `Заменит в слоте: ${props.replacementName}.`;
  return "Слот свободен, замены не будет.";
});
</script>

<template>
  <article class="card" :class="`rarity-${item.rarity}`">
    <div class="art">
      <img :src="item.asset_url" :alt="item.name" />
    </div>
    <div class="body">
      <p class="name">{{ item.name }}</p>
      <p class="meta">
        <span>Редкость: {{ rarityLabels[item.rarity] }}</span>
        <span>Слот: {{ slotLabel(item.slot_key) }}</span>
        <span>Источник: {{ source }}</span>
        <span>Бонус: {{ multiplierLabel(item.xp_multiplier) }}</span>
      </p>
      <p class="replace">{{ replacement }}</p>
      <button
        class="tap"
        type="button"
        :disabled="busy"
        @click="item.equipped ? emit('unequip', item) : emit('equip', item)"
      >
        {{ item.equipped ? "Снять" : "Надеть" }}
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.card { display: grid; grid-template-columns: 5rem minmax(0, 1fr); gap: 0.75rem; padding: 0.8rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-soft); }
.rarity-rare { border-color: var(--accent); }
.rarity-epic { border-color: var(--magic); box-shadow: var(--shadow-soft), 0 0 18px color-mix(in srgb, var(--magic) 26%, transparent); }
.rarity-legendary { border-color: var(--xp); box-shadow: var(--shadow-soft), 0 0 22px color-mix(in srgb, var(--xp) 32%, transparent); }
.art { display: grid; place-items: center; border-radius: var(--radius-md); background: var(--surface-2); }
img { max-width: 4rem; max-height: 4rem; object-fit: contain; }
.body { min-width: 0; display: grid; gap: 0.45rem; }
.name { margin: 0; font-weight: 900; }
.meta { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0; color: var(--muted); font-size: 0.78rem; }
.meta span { padding: 0.2rem 0.4rem; border: 1px solid var(--stroke); border-radius: var(--radius-sm); }
.replace { margin: 0; color: var(--text); font-size: 0.82rem; }
button { justify-self: start; min-height: 44px; border: 0; border-radius: var(--radius-md); background: var(--accent-grad); color: var(--bg); padding: 0 0.9rem; font-weight: 900; }
button:disabled { opacity: 0.55; }
</style>
