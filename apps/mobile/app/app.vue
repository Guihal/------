<script setup lang="ts">
import { visualStateToCssVars } from "~~/api";

const visual = useVisualStore();
const settings = useSettingsStore();
const auth = useAuthStore();
const rootVars = computed(() =>
  visualStateToCssVars(visual.current, settings.settings),
);
const decor = computed(() => visual.current.decorative_detail);

watch(
  () => auth.isAuthenticated,
  (ok) => {
    if (ok && !settings.settings) void settings.load();
  },
  { immediate: true },
);
</script>

<template>
  <div class="app-shell" :style="rootVars">
    <VisualBackground :decorative-detail="decor" />
    <div class="app-content">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<style>
.app-shell {
  --bg: var(--bg-variant, var(--bg-midnight));
  --surface: var(--card-variant, var(--card-graphite));
  --surface-2: color-mix(in srgb, var(--surface) 82%, var(--text));
  position: relative;
  min-height: 100%;
  isolation: isolate;
  background: var(--bg);
  color: var(--text);
}
.app-content {
  position: relative;
  z-index: 1;
  min-height: 100%;
}
</style>
