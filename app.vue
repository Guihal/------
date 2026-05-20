<script setup lang="ts">
import { ref, onMounted } from "vue"
import { getAppDependencies } from "./infrastructure/di/provide-app-dependencies"

const ready = ref(false)
const error = ref("")

onMounted(async () => {
  // Wait for bootstrap plugin to complete (up to 5s)
  for (let i = 0; i < 50; i++) {
    if (getAppDependencies()) {
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
@import '@fontsource-variable/inter';

html, body {
  font-family: 'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif;
}

.boot-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0d0d12;
  color: #cdd6f4;
}
.boot-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #313244;
  border-top-color: #a6e3a1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
