<script setup lang="ts">
import type { Progression, ProfileStats } from "~~/api";

const props = defineProps<{ progression: Progression; stats: ProfileStats }>();

const xpLine = computed(() => {
  const p = props.progression;
  return `${p.xp_in_current_level}/${p.xp_per_level} XP`;
});
const width = computed(() => {
  const p = props.progression;
  return `${Math.round((p.xp_in_current_level / p.xp_per_level) * 100)}%`;
});
</script>

<template>
  <section class="panel" aria-label="Прогресс профиля">
    <div class="top">
      <strong>Ур. {{ progression.level }}</strong>
      <span>{{ xpLine }}</span>
    </div>
    <div class="bar" role="img" :aria-label="`Прогресс уровня: ${xpLine}`">
      <span :style="{ width }" />
    </div>
    <dl class="stats">
      <div><dt>Создано</dt><dd>{{ stats.tasks_created }}</dd></div>
      <div><dt>Выполнено</dt><dd>{{ stats.tasks_completed }}</dd></div>
      <div><dt>В архиве</dt><dd>{{ stats.tasks_archived }}</dd></div>
    </dl>
  </section>
</template>

<style scoped lang="scss">
.panel { display: grid; gap: 0.75rem; padding: 1rem; border: 1px solid var(--stroke); border-radius: var(--radius-lg); background: var(--surface-card); }
.top { display: flex; justify-content: space-between; gap: 0.75rem; color: var(--text); }
.top span, dt { color: var(--muted); }
.bar { height: 0.6rem; overflow: hidden; border-radius: var(--radius-sm); background: var(--surface-2); }
.bar span { display: block; height: 100%; border-radius: inherit; background: var(--accent-grad); box-shadow: var(--glow-accent); }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0; }
.stats div { padding: 0.65rem; border: 1px solid var(--stroke); border-radius: var(--radius-md); background: var(--surface-2); }
dt { font-size: 0.75rem; }
dd { margin: 0.2rem 0 0; font-weight: 800; }
</style>
