<script setup lang="ts">
import { DARK_TOKENS as t } from "../../../assets/tokens/dark"

const props = defineProps<{
  title?: string
  message?: string
  retryLabel?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="error-state" data-testid="error-state">
    <div class="error-icon" aria-hidden="true">⚠️</div>
    <h3 class="error-title">{{ props.title ?? "Что-то пошло не так" }}</h3>
    <p v-if="props.message" class="error-message">{{ props.message }}</p>
    <button
      v-if="props.retryLabel"
      class="error-retry"
      data-testid="error-retry"
      @click="emit('retry')"
    >
      {{ props.retryLabel }}
    </button>
  </div>
</template>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: v-bind("t.spacing.sm");
  padding: v-bind("t.spacing.xxl") v-bind("t.spacing.lg");
  text-align: center;
  background: v-bind("t.color.bgElevated");
  border: 1px solid v-bind("t.color.borderSubtle");
  border-radius: v-bind("t.radius.lg");
  color: v-bind("t.color.textSecondary");
  min-height: 160px;
}

.error-icon {
  font-size: 28px;
  line-height: 1;
  margin-bottom: v-bind("t.spacing.xs");
}

.error-title {
  margin: 0;
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.statusError");
}

.error-message {
  margin: 0;
  font-size: v-bind("t.typography.size.sm");
  color: v-bind("t.color.textMuted");
  line-height: v-bind("t.typography.lineHeight.normal");
  max-width: 280px;
}

.error-retry {
  margin-top: v-bind("t.spacing.sm");
  padding: v-bind("t.spacing.sm") v-bind("t.spacing.lg");
  font-size: v-bind("t.typography.size.md");
  font-weight: v-bind("t.typography.weight.semibold");
  color: v-bind("t.color.textInverse");
  background: v-bind("t.color.accentBlue");
  border: none;
  border-radius: v-bind("t.radius.md");
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}

.error-retry:active {
  opacity: 0.85;
}
</style>
