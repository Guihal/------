<script setup lang="ts">
import { FALLBACK_VISUAL_STATE, visualStateToCssVars } from "~~/api";
// ponytail: FALLBACK until a Pinia visual-state store wires the backend
// /visual-state response (P10+). Mapper + scatter stay deterministic, no client random.
const rootVars = visualStateToCssVars(FALLBACK_VISUAL_STATE);
const decor = FALLBACK_VISUAL_STATE.decorative_detail;
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
