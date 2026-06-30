<script setup lang="ts">
import { User } from "lucide-vue-next";

// Compact header: greeting + level/XP PLACEHOLDER (read-only display only;
// progression data wiring is a later packet). Profile action is decorative.
const auth = useAuthStore();
const greeting = computed(
  () => `Привет, ${auth.user?.display_name ?? "гость"}`,
);
// ponytail: placeholder numbers — real progression arrives via /profile in P11.
const levelLine = "Ур. 1 · 0/1000 XP";
</script>

<template>
  <header class="app-header">
    <div class="meta">
      <p class="greeting display">{{ greeting }}</p>
      <p class="xp">{{ levelLine }}</p>
      <div class="bar" role="img" aria-label="Прогресс XP">
        <span class="bar-fill"></span>
      </div>
    </div>
    <button
      class="profile-btn tap"
      type="button"
      aria-label="Профиль"
      @click="$router.push('/profile')"
    >
      <User :size="22" aria-hidden="true" />
    </button>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: calc(var(--safe-top) + 0.75rem) 1rem 0.75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--surface-2);
}
.meta {
  min-width: 0;
}
.greeting {
  margin: 0;
  font-weight: 800;
  font-size: 1.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.xp {
  margin: 0.15rem 0 0.45rem;
  color: var(--muted);
  font-size: 0.8rem;
}
.bar {
  height: 6px;
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
  box-shadow: 0 0 8px rgba(124, 92, 255, 0.7);
}
.profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  color: var(--text);
  border: none;
  border-radius: 999px;
  padding: 0.5rem;
}
</style>
