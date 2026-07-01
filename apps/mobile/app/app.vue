<script setup lang="ts">
import { visualStateToCssVars } from "~~/api";

const visual = useVisualStore();
const rootVars = computed(() => visualStateToCssVars(visual.current));
const decor = computed(() => visual.current.decorative_detail);
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
