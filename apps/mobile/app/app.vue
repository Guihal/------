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
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.app-shell {
  position: relative;
  min-height: 100%;
}
</style>
