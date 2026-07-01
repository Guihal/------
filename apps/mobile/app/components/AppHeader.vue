<script setup lang="ts">
import { Settings, User } from "lucide-vue-next";

const auth = useAuthStore();
const profile = useProfileStore();
const displayName = computed(
  () => profile.profile?.display_name ?? auth.user?.display_name ?? "гость",
);
const progression = computed(() => profile.profile?.progression);
const levelLine = computed(() => {
  const p = progression.value;
  if (!p) return "Прогресс загружается";
  return `Ур. ${p.level} · ${p.xp_in_current_level}/${p.xp_per_level} XP`;
});
const barWidth = computed(() => {
  const p = progression.value;
  if (!p) return "0%";
  return `${Math.round((p.xp_in_current_level / p.xp_per_level) * 100)}%`;
});

onMounted(() => {
  if (!profile.profile) void profile.load().catch(() => {});
});
</script>

<template>
  <header class="app-header">
    <NuxtLink class="brand tap" to="/tasks" aria-label="На главную">
      <Logo :size="34" color="var(--magic)" glow :decorative="false" label="Чубзик" />
      <div class="meta">
        <p class="eyebrow">Сегодня в фокусе</p>
        <p class="greeting display">{{ displayName }}</p>
        <p class="xp">{{ levelLine }}</p>
        <div class="bar" role="img" aria-label="Прогресс XP">
          <span class="bar-fill" :style="{ width: barWidth }"></span>
        </div>
      </div>
    </NuxtLink>
    <nav class="actions" aria-label="Быстрые действия">
      <NuxtLink class="icon tap" to="/settings" aria-label="Настройки">
        <Settings :size="19" aria-hidden="true" />
      </NuxtLink>
      <NuxtLink class="icon avatar tap" to="/profile" aria-label="Профиль">
        <User :size="19" aria-hidden="true" />
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: calc(var(--safe-top) + 0.6rem) 1rem 0.65rem;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--stroke) 72%, transparent);
  backdrop-filter: blur(14px);
}
.brand {
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 0.65rem;
  color: var(--text);
  text-decoration: none;
}
.meta {
  min-width: 0;
}
.eyebrow {
  margin: 0 0 0.1rem;
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}
.greeting {
  margin: 0;
  font-weight: 800;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.xp {
  margin: 0.1rem 0 0.38rem;
  color: var(--muted);
  font-size: 0.78rem;
}
.bar {
  height: 5px;
  width: min(180px, 48vw);
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.bar-fill {
  display: block;
  height: 100%;
  width: 8%; // ponytail: placeholder — real % from /profile in P11.
  border-radius: 999px;
  background: var(--accent-grad);
  box-shadow: var(--glow-accent);
}
.actions {
  display: flex;
  flex: 0 0 auto;
  gap: 0.4rem;
}
.icon {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--surface-2) 72%, transparent);
  color: var(--text);
  border: 1px solid color-mix(in srgb, var(--stroke) 78%, transparent);
  border-radius: var(--radius-md);
  padding: 0;
}
.avatar { color: var(--magic); }
.icon:focus-visible,
.brand:focus-visible {
  outline: none;
  box-shadow: var(--ring);
}
@media (max-width: 360px) {
  .app-header { padding-inline: 0.75rem; }
  .brand { gap: 0.5rem; }
  .actions { gap: 0.3rem; }
  .icon { width: 40px; min-width: 40px; }
}
</style>
