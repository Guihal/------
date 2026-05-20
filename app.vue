<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useAppDependencies } from "./app/composables/useAppDependencies"

import '@fontsource-variable/inter'

useHead({
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
    { name: "theme-color", content: "#0d0d12" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    { name: "format-detection", content: "telephone=no" },
  ],
  htmlAttrs: { lang: "ru" },
  bodyAttrs: { class: "safe-area" },
})

const ready = ref(false)
const error = ref("")

onMounted(async () => {
  // Wait for bootstrap plugin to complete (up to 5s)
  for (let i = 0; i < 50; i++) {
    if (useAppDependencies()) {
      ready.value = true
      return
    }
    await new Promise(r => setTimeout(r, 100))
  }
  error.value = "Ошибка загрузки приложения. Пожалуйста, перезагрузите страницу."
})
</script>

<template>
  <div v-if="!ready" class="boot-screen">
    <div class="boot-spinner" />
    <p class="boot-text">Загрузка...</p>
    <p v-if="error" class="boot-error">{{ error }}</p>
  </div>
  <NuxtPage v-else />
</template>

<style>
html, body {
  font-family: 'Inter Variable', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  overscroll-behavior-y: none;
}
body.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
*, *::before, *::after {
  box-sizing: inherit;
}

.boot-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  min-height: 100vh;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: #0d0d12;
  color: #cdd6f4;
  contain: strict;
}
.boot-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #313244;
  border-top-color: #a6e3a1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  will-change: transform;
}
.boot-text {
  margin-top: 16px;
  font-size: 14px;
  color: #a6adc8;
}
.boot-error {
  margin-top: 12px;
  font-size: 12px;
  color: #f38ba8;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
