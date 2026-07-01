<script setup lang="ts">
import type { ActiveMascot, OwnedItem } from "~~/api";

defineProps<{ mascot: ActiveMascot | null; equipped?: OwnedItem[] }>();
</script>

<template>
  <section class="mascot" aria-label="Маскот профиля">
    <div class="stage">
      <img v-if="mascot?.asset_url" :src="mascot.asset_url" :alt="mascot.name" />
      <Logo v-else :size="112" color="var(--magic)" :glow="true" :decorative="false" label="Чубзик" />
    </div>
    <div>
      <p class="title">{{ mascot?.name ?? "Чубзик" }}</p>
      <p class="note">
        Активный маскот. Надетые предметы управляются через инвентарь.
      </p>
      <p v-if="equipped?.length" class="items">
        Надето: {{ equipped.map((item) => item.name).join(", ") }}
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.mascot { display: grid; gap: 0.9rem; padding: 1rem; border: 1px solid var(--stroke); border-radius: var(--radius-xl); background: var(--profile-bg); box-shadow: var(--shadow-soft); }
.stage { display: grid; place-items: center; min-height: 11rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--surface) 72%, transparent); }
img { max-width: 9rem; max-height: 9rem; object-fit: contain; filter: drop-shadow(0 0 14px var(--magic)); }
.title { margin: 0; font-size: 1.25rem; font-weight: 900; }
.note, .items { margin: 0.3rem 0 0; color: var(--muted); font-size: 0.88rem; }
</style>
