<script setup lang="ts">
import { ListChecks, Backpack, User, Settings } from "lucide-vue-next";

type Tab = { to: string; label: string; icon: unknown };

const tabs: Tab[] = [
  { to: "/tasks", label: "Задачи", icon: ListChecks },
  { to: "/inventory", label: "Инвентарь", icon: Backpack },
  { to: "/profile", label: "Профиль", icon: User },
  { to: "/settings", label: "Настройки", icon: Settings },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="Основная навигация">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tab tap"
      active-class="tab-active"
    >
      <component :is="tab.icon" :size="22" aria-hidden="true" />
      <span class="label">{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--surface);
  border-top: 1px solid var(--surface-2);
  // Respect Android/iOS safe area (gesture nav bar).
  padding-bottom: var(--safe-bottom);
  z-index: 50;
}
.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.4rem 0.25rem;
  color: var(--muted);
  text-decoration: none;
  min-height: 56px;
}
.tab-active {
  color: var(--accent);
}
.tab-active ::v-deep(svg) {
  filter: drop-shadow(0 0 6px rgba(124, 92, 255, 0.7));
}
.label {
  font-size: 0.7rem;
}
</style>
