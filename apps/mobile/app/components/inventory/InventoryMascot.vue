<script setup lang="ts">
import type { ActiveMascot, OwnedItem } from "~~/api";

defineProps<{ mascot: ActiveMascot | null; equipped: OwnedItem[] }>();
</script>

<template>
  <section class="mascot" aria-label="Экипировка маскота">
    <div class="preview">
      <img v-if="mascot?.asset_url" :src="mascot.asset_url" :alt="mascot.name" />
      <Logo v-else :size="84" color="var(--magic)" :glow="true" label="Чубзик" :decorative="false" />
    </div>
    <div class="slots">
      <p v-for="slot in mascot?.slots ?? []" :key="slot.slot_key">
        <span>{{ slot.title || slotLabel(slot.slot_key) }}</span>
        <strong>
          {{ equipped.find((item) => item.slot_key === slot.slot_key)?.name ?? "пусто" }}
        </strong>
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.mascot { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: 0.8rem; padding: 0.85rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--profile-bg); }
.preview { display: grid; place-items: center; min-height: 6rem; border-radius: var(--radius-md); background: color-mix(in srgb, var(--surface) 70%, transparent); }
img { max-width: 5rem; max-height: 5rem; object-fit: contain; }
.slots { display: grid; gap: 0.35rem; }
p { display: flex; justify-content: space-between; gap: 0.5rem; margin: 0; color: var(--muted); font-size: 0.82rem; }
strong { color: var(--text); text-align: right; }
</style>
