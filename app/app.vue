<script setup lang="ts">
import { DARK_TOKENS as t } from "../assets/tokens/dark"
import "@fontsource-variable/inter"
</script>

<template>
  <NuxtPage />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: v-bind("t.color.bgBase");
  color: v-bind("t.color.textPrimary");
  font-family: 'Inter Variable', 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-feature-settings: 'cv11', 'ss01';
  letter-spacing: 0;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
*, *::before, *::after {
  box-sizing: inherit;
}
h1, h2, h3 {
  letter-spacing: -0.02em;
  text-wrap: balance;
}

</style>
