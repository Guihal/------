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
  overflow-x: hidden;
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: inherit;
}

</style>
