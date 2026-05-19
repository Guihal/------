<script setup lang="ts">
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="loading-state" data-testid="loading-state">
    <div class="loading-spinner" aria-hidden="true" />
    <span class="loading-text">{{ props.message ?? "Loading…" }}</span>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: v-bind("t.spacing.md");
  padding: v-bind("t.spacing.xxl") v-bind("t.spacing.lg");
  color: v-bind("t.color.textSecondary");
  min-height: 160px;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid v-bind("t.color.borderSubtle");
  border-top-color: v-bind("t.color.accentBlue");
  border-radius: v-bind("t.radius.full");
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textMuted");
}
</style>
